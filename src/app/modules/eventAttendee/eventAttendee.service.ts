import { Types } from "mongoose";
import { connection_model } from "../connection/connection.schema";
import { UserProfile_Model } from "../user/user.schema";
import { Event_Model } from "../superAdmin/event.schema";
import { EventAttendeeBookmark_Model } from "./eventAttendee.schema";
import { boolean } from "zod";

type AttendeeProfile = {
  accountId: Types.ObjectId;
  name?: string;
  avatar?: string;
  affiliations?: {
    company?: string;
    isCurrent?: boolean;
  }[];
};
type Affiliation = {
  company?: string;
  position?: string;
  isCurrent?: boolean;
};

type UserProfileLean = {
  name?: string;
  avatar?: string;
  affiliations?: Affiliation[];
  contact?: {
    email?: string;
    phone?: string;
  };
  location?: {
    address?: string;
  };
};
type EventParticipant = {
  accountId: Types.ObjectId;
  role: string;
  sessionIndex?: number[];
};

const get_event_attendees_from_db = async (
  eventId: Types.ObjectId,
  viewerId: Types.ObjectId,
  filters: {
    search?: string;
    role?: string;
    bookmarked?: boolean;
  },
) => {
  /* 1️⃣ Load event participants + organizers */
  const event = await Event_Model.findById(eventId, {
    participants: 1,
    organizers: 1,
  }).lean();

  if (!event) throw new Error("Event not found");

  let participants = event.participants || [];

  /* 2️⃣ Inject organizers as participants */
  const organizerParticipants = (event.organizers || []).map(
    (accountId: any) => ({
      _id: new Types.ObjectId(),
      accountId,
      role: "organizer",
      sessionIndex: [],
    }),
  );

  /* 3️⃣ Merge & remove duplicates */
  const mergedMap = new Map<string, any>();

  [...participants, ...organizerParticipants].forEach((p: any) => {
    const key = p.accountId.toString();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, p);
    }
  });

  participants = Array.from(mergedMap.values());

  /* 4️⃣ Role filter */
  if (filters.role && filters.role !== "all") {
    participants = participants.filter((p: any) => p.role === filters.role);
  }

  const accountIds = participants.map((p: any) => p.accountId);

  /* 5️⃣ Load profiles */
  const profileQuery: any = {
    accountId: { $in: accountIds },
  };

  if (filters.search) {
    profileQuery.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { "affiliations.company": { $regex: filters.search, $options: "i" } },
    ];
  }

  const profiles = (await UserProfile_Model.find(profileQuery, {
    accountId: 1,
    name: 1,
    avatar: 1,
    affiliations: 1,
  }).lean()) as unknown as AttendeeProfile[];

  const profileMap = new Map(profiles.map((p) => [p.accountId.toString(), p]));

  /* 6️⃣ Load bookmarks */
  const bookmarks = await EventAttendeeBookmark_Model.find(
    {
      viewerAccountId: viewerId,
      eventId,
      attendeeAccountId: { $in: accountIds },
    },
    { attendeeAccountId: 1 },
  ).lean();

  const bookmarkedSet = new Set(
    bookmarks.map((b) => b.attendeeAccountId.toString()),
  );

  /* 7️⃣ Final mapping */
  const attendees = participants
    .map((p: any) => {
      const profile = profileMap.get(p.accountId.toString());
      if (!profile) return null;

      const currentAffiliation =
        profile.affiliations?.find((a) => a.isCurrent) ??
        profile.affiliations?.[0];

      const isBookmarked = bookmarkedSet.has(p.accountId.toString());

      if (filters.bookmarked && !isBookmarked) return null;

      return {
        id: p._id,
        accountId: p.accountId,
        name: profile.name ?? "",
        avatar: profile.avatar ?? null,
        company: currentAffiliation?.company ?? "",
        role: p.role, // attendee / speaker / organizer
        sessionsCount: p.sessionIndex?.length ?? 0,
        isBookmarked,
      };
    })
    .filter(Boolean);

  return {
    total: attendees.length,
    bookmarked: attendees.filter((a: any) => a.isBookmarked).length,
    attendees,
  };
};
const get_event_attendee_detail_from_db = async (
  eventId: Types.ObjectId,
  attendeeAccountId: Types.ObjectId,
  viewerAccountId: Types.ObjectId,
) => {
  /* 1️⃣ Load event with participants + organizers */
  const event = (await Event_Model.findById(eventId, {
    participants: 1,
    organizers: 1,
  }).lean()) as unknown as {
    participants: EventParticipant[];
    organizers: Types.ObjectId[];
  } | null;

  if (!event) {
    throw new Error("Event not found");
  }

  /* 2️⃣ Resolve participant or organizer */
  const participant = event.participants.find(
    (p) => p.accountId.toString() === attendeeAccountId.toString(),
  );

  const isOrganizer = event.organizers.some(
    (id) => id.toString() === attendeeAccountId.toString(),
  );

  if (!participant && !isOrganizer) {
    throw new Error("User not part of this event");
  }

  const resolvedParticipant: EventParticipant =
    participant ??
    ({
      _id: new Types.ObjectId(),
      accountId: attendeeAccountId,
      role: "organizer",
      sessionIndex: [],
    } as EventParticipant);

  /* 3️⃣ Load profile */
  const profile = (await UserProfile_Model.findOne(
    { accountId: attendeeAccountId },
    {
      name: 1,
      avatar: 1,
      affiliations: 1,
      contact: 1,
      location: 1,
    },
  ).lean()) as unknown as UserProfileLean | null;

  /* 4️⃣ Bookmark check */
  const bookmark = await EventAttendeeBookmark_Model.findOne({
    viewerAccountId,
    attendeeAccountId,
    eventId,
  }).lean();

  /* 5️⃣ Permissions */
  const canMessage = true;
  const canEmail = Boolean(profile?.contact?.email);

  /* 6️⃣ Affiliation resolve */
  const currentAffiliation =
    profile?.affiliations?.find((a) => a.isCurrent) ??
    profile?.affiliations?.[0];

  /* 7️⃣ Final response (frontend-safe) */
  return {
    accountId: attendeeAccountId,
    name: profile?.name ?? "",
    avatar: profile?.avatar ?? null,
    company: currentAffiliation?.company ?? "",

    role: resolvedParticipant.role,
    sessionsCount: resolvedParticipant.sessionIndex!.length,
    isBookmarked: Boolean(bookmark),

    contact: {
      email: profile?.contact?.email ?? null,
      phone: profile?.contact?.phone ?? null,
      location: profile?.location?.address ?? null,
    },

    actions: {
      canMessage,
      canEmail,
    },
  };
};

// const get_event_attendees_from_db = async (
//   eventId: Types.ObjectId,
//   viewerId: Types.ObjectId,
//   filters: {
//     search?: string;
//     role?: string;
//     bookmarked?: boolean;
//   },
// ) => {
//   /* 1️⃣ Load event participants */
//   const event = await Event_Model.findById(eventId, { participants: 1 }).lean();

//   if (!event) throw new Error("Event not found");

//   let participants = event.participants || [];
//   //   console.log(participants);

//   /* 2️⃣ Role filter */
//   if (filters.role && filters.role !== "all") {
//     participants = participants.filter((p: any) => p.role === filters.role);
//   }

//   const accountIds = participants.map((p: any) => p.accountId);

//   /* 3️⃣ Load profiles */
//   const profileQuery: any = {
//     accountId: { $in: accountIds },
//   };

//   if (filters.search) {
//     profileQuery.$or = [
//       { name: { $regex: filters.search, $options: "i" } },
//       { "affiliations.company": { $regex: filters.search, $options: "i" } },
//     ];
//   }

//   const profiles = (await UserProfile_Model.find(profileQuery, {
//     accountId: 1,
//     name: 1,
//     avatar: 1,
//     affiliations: 1,
//   }).lean()) as AttendeeProfile[];

//   const profileMap = new Map(profiles.map((p) => [p.accountId.toString(), p]));

//   const bookmarks = await EventAttendeeBookmark_Model.find(
//     {
//       viewerAccountId: viewerId,
//       eventId,
//       attendeeAccountId: { $in: accountIds },
//     },
//     { attendeeAccountId: 1 },
//   ).lean();

//   const bookmarkedSet = new Set(
//     bookmarks.map((b) => b.attendeeAccountId.toString()),
//   );
//   /* 5️⃣ Final mapping */
//   const attendees = participants
//     .map((p: any) => {
//       const profile = profileMap.get(p.accountId.toString());
//       if (!profile) return null;

//       const currentAffiliation =
//         profile.affiliations?.find((a) => a.isCurrent) ??
//         profile.affiliations?.[0];

//       const isBookmarked = bookmarkedSet.has(p.accountId.toString());

//       if (filters.bookmarked && !isBookmarked) return null;
//       return {
//         id: p._id,
//         accountId: p.accountId,
//         name: profile.name ?? "",
//         avatar: profile.avatar ?? null,
//         company: currentAffiliation?.company ?? "",
//         role: p.role,
//         sessionsCount: p.sessionIndex.length ?? 0,
//         isBookmarked,
//       };
//     })
//     .filter(Boolean);

//   return {
//     total: attendees.length,
//     bookmarked: attendees.filter((a: any) => a.isBookmarked).length,
//     attendees,
//   };
// };
// const get_event_attendee_detail_from_db = async (
//   eventId: Types.ObjectId,
//   attendeeAccountId: Types.ObjectId,
//   viewerAccountId: Types.ObjectId,
// ) => {
//   /* 1️⃣ Validate attendee belongs to event */
//   const event = (await Event_Model.findOne(
//     {
//       _id: eventId,
//       // "participants.accountId": attendeeAccountId,
//     },
//     // { participants: 1 },
//   ).lean()) as {
//     participants: EventParticipant[];
//   } | null;
//   if (!event) {
//     throw new Error("Attendee not part of this event");
//   }

//   const participant = event.participants.find(
//     (p: any) => p.accountId.toString() === attendeeAccountId.toString(),
//   );
//   /* 2️⃣ Profile load (same as connectionDetails) */
//   const profile = (await UserProfile_Model.findOne(
//     { accountId: attendeeAccountId },
//     {
//       name: 1,
//       avatar: 1,
//       affiliations: 1,
//       contact: 1,
//       location: 1,
//     },
//   ).lean()) as UserProfileLean | null;

//   const bookmark = await EventAttendeeBookmark_Model.findOne({
//     viewerAccountId,
//     attendeeAccountId,
//     eventId,
//   }).lean();
//   /* 4️⃣ Permissions */
//   const canMessage = true; // same event → socket allowed
//   const canEmail = Boolean(profile?.contact?.email);

//   /* 5️⃣ Affiliation resolve */
//   const currentAffiliation =
//     profile?.affiliations?.find((a) => a.isCurrent) ??
//     profile?.affiliations?.[0];

//   /* 6️⃣ SAME RESPONSE SHAPE */
//   return {
//     // frontend expects id
//     accountId: attendeeAccountId,
//     name: profile?.name ?? "",
//     avatar: profile?.avatar ?? null,
//     company: currentAffiliation?.company ?? "",

//     role: participant?.role ?? "",
//     sessionsCount: participant?.sessionIndex!.length ?? 0,
//     isBookmarked: Boolean(bookmark),

//     contact: {
//       email: profile?.contact?.email ?? null,
//       phone: profile?.contact?.phone ?? null,
//       location: profile?.location?.address ?? null,
//     },

//     actions: {
//       canMessage,
//       canEmail,
//     },
//   };
// };
const toggle_bookmark_into_db = async (
  viewerAccountId: Types.ObjectId,
  attendeeAccountId: any,
  eventId: any,
) => {
  const existing = await EventAttendeeBookmark_Model.findOne({
    viewerAccountId,
    attendeeAccountId,
    eventId,
  });

  if (existing) {
    await existing.deleteOne();
    return { isBookmarked: false };
  }

  await EventAttendeeBookmark_Model.create({
    viewerAccountId,
    attendeeAccountId,
    eventId,
  });

  return { isBookmarked: true };
};

export const event_attendee_service = {
  get_event_attendees_from_db,
  get_event_attendee_detail_from_db,
  toggle_bookmark_into_db,
};

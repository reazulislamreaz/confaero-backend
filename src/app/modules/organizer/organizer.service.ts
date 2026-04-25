import httpStatus from "http-status";
import { Event_Model } from "../superAdmin/event.schema";
import { AppError } from "../../utils/app_error";
import { UserProfile_Model } from "../user/user.schema";
import { Account_Model } from "../auth/auth.schema";
import { attendee_model } from "../attendee/attendee.schema";
import { invitation_model } from "../invitation/invitation.schema";
import { getCoordinatesFromMapUrl } from "../../utils/geocode.util";
const get_my_events_from_db = async (user: any) => {
  if (!user?.email) {
    throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
  }
  const event = await Event_Model.findOne({ organizerEmails: user.email });
  console.log(event);
  return event;
};

const update_my_event_in_db = async (
  user: any,
  eventId: string,
  payload: any,
) => {
  const event = await Event_Model.findById(eventId);

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  if (user.activeRole === "ORGANIZER") {
    if (!event.organizerEmails.includes(user.email)) {
      throw new AppError("Forbidden", httpStatus.FORBIDDEN);
    }
  }

  /* ===================================================
     🔥 Detect Map URL Change
     =================================================== */

  const isMapUrlChanged =
    payload.googleMapLink && payload.googleMapLink !== event.googleMapLink;

  /* ===================================================
     🔵 Floor Map ADD ONLY
     =================================================== */

  if (payload.__floorMapImageUrl && payload.floorMapTitle) {
    event.floorMaps.push({
      title: payload.floorMapTitle,
      imageUrl: payload.__floorMapImageUrl,
    });
  }

  /* ===================================================
     🔥 If Map Changed → Reset Coordinates
     =================================================== */

  if (isMapUrlChanged) {
    event.latitude = null;
    event.longitude = null;
  }

  /* ===================================================
     🔵 Locked Fields
     =================================================== */

  // Title update is now permitted

  /* ===================================================
     🔵 Cleanup Temp Fields
     =================================================== */

  delete payload.__floorMapImageUrl;
  delete payload.floorMapTitle;

  /* ===================================================
     🔵 Apply All Other Updates
     =================================================== */

  Object.assign(event, payload);

  await event.save();

  /* ===================================================
     🔥 Background Geocode (Non Blocking)
     =================================================== */

  if (isMapUrlChanged) {
    setImmediate(async () => {
      try {
        const coordinates = await getCoordinatesFromMapUrl(
          payload.googleMapLink,
        );

        await Event_Model.findByIdAndUpdate(event._id, {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
      } catch (error) {
        console.error("Background geocode failed:", error);
      }
    });
  }

  return event;
};
const get_all_register_from_db = async (
  user: any,
  query: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  },
  eventId: any,
) => {
  if (!user?.email) {
    throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const roleFilter = query.role;
  const search = query.search?.trim();

  const isSuperAdmin = user.activeRole === "SUPER_ADMIN";

  const eventQuery = isSuperAdmin
    ? { _id: eventId }
    : { _id: eventId, organizerEmails: user.email };

  const events = await Event_Model.find(eventQuery).select("_id participants");

  if (!events.length) {
    return { data: [], meta: { page, limit, total: 0 } };
  }

  let participants = events.flatMap((event: any) =>
    event.participants.map((p: any) => ({
      eventId: event._id,
      accountId: p.accountId,
      role: p.role,
    })),
  );

  if (roleFilter) {
    participants = participants.filter((p) => p.role == roleFilter);
  }

  if (!participants.length) {
    return { data: [], meta: { page, limit, total: 0 } };
  }

  const accountIds = participants
    .map((p) => p.accountId)
    .filter(Boolean); // ✅ fix

  const accounts = await Account_Model.find({
    _id: { $in: accountIds },
  }).select("email");

  const users = await UserProfile_Model.find({
    accountId: { $in: accountIds },
  }).select("name accountId");

  const profiles = await UserProfile_Model.find({
    accountId: { $in: accountIds },
  }).select("location accountId");

  const accountMap = new Map(
    accounts
      .filter((a: any) => a._id)
      .map((a: any) => [a._id.toString(), a]),
  );

  const userMap = new Map(
    users
      .filter((u: any) => u.accountId)
      .map((u: any) => [u.accountId.toString(), u]),
  );

  const profileMap = new Map(
    profiles
      .filter((p: any) => p.accountId)
      .map((p: any) => [p.accountId.toString(), p]),
  );

  let rows = participants
    .map((p) => {
      const accId = p.accountId?.toString(); // ✅ fix
      if (!accId) return null; // ✅ fix

      return {
        accountId: accId,
        name: userMap.get(accId)?.name || null,
        email: accountMap.get(accId)?.email || null,
        address: profileMap.get(accId)?.location || null,
        role: p.role,
        eventId: p.eventId,
      };
    })
    .filter(Boolean); // ✅ fix

  if (search) {
    const regex = new RegExp(search, "i");
    rows = rows.filter(
      (r: any) => regex.test(r.name || "") || regex.test(r.email || ""),
    );
  }

  const total = rows.length;
  const paginated = rows.slice(skip, skip + limit);

  return {
    data: paginated,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
// const get_all_register_from_db = async (
//   user: any,
//   query: {
//     page?: number;
//     limit?: number;
//     role?: string;
//     search?: string;
//   },
//   eventId: any,
// ) => {
//   if (!user?.email) {
//     throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
//   }

//   const page = Number(query.page) || 1;
//   const limit = Number(query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const roleFilter = query.role;
//   const search = query.search?.trim();
//   console.log(user);
//   const isSuperAdmin = user.activeRole === "SUPER_ADMIN"; // তোমার role value অনুযায়ী adjust করো

//   const eventQuery = isSuperAdmin
//     ? { _id: eventId }
//     : { _id: eventId, organizerEmails: user.email };
//   const events = await Event_Model.find(eventQuery).select("_id participants");

//   // const events = await Event_Model.find({
//   //   organizerEmails: user.email,
//   // }).select("_id participants");

//   if (!events.length) {
//     return { data: [], meta: { page, limit, total: 0 } };
//   }

//   let participants = events.flatMap((event: any) =>
//     event.participants.map((p: any) => ({
//       eventId: event._id,
//       accountId: p.accountId,
//       role: p.role,
//     })),
//   );

//   if (roleFilter) {
//     participants = participants.filter((p) => p.role == roleFilter);
//   }

//   if (!participants.length) {
//     return { data: [], meta: { page, limit, total: 0 } };
//   }

//   const accountIds = participants.map((p) => p.accountId);

//   const accounts = await Account_Model.find({
//     _id: { $in: accountIds },
//   }).select("email");

//   // const users = await User_Model.find({
//   //   accountId: { $in: accountIds },
//   // }).select("name accountId");
//   const users = await UserProfile_Model.find({
//     accountId: { $in: accountIds },
//   }).select("name accountId");

//   const profiles = await UserProfile_Model.find({
//     accountId: { $in: accountIds },
//   }).select("location accountId");

//   const accountMap = new Map(accounts.map((a: any) => [a._id.toString(), a]));

//   const userMap = new Map(users.map((u: any) => [u.accountId.toString(), u]));

//   const profileMap = new Map(
//     profiles.map((p: any) => [p.accountId.toString(), p]),
//   );

//   let rows = participants.map((p) => {
//     const accId = p.accountId.toString();

//     return {
//       accountId: accId,
//       name: userMap.get(accId)?.name || null,
//       email: accountMap.get(accId)?.email || null,
//       address: profileMap.get(accId)?.location || null,
//       role: p.role,
//       eventId: p.eventId,
//     };
//   });

//   if (search) {
//     const regex = new RegExp(search, "i");
//     rows = rows.filter(
//       (r) => regex.test(r.name || "") || regex.test(r.email || ""),
//     );
//   }

//   const total = rows.length;
//   const paginated = rows.slice(skip, skip + limit);

//   return {
//     data: paginated,
//     meta: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

// delete
const remove_attendee_from_event = async (
  user: any,
  eventId: any,
  accountId: any,
) => {
  if (!user?.email) {
    throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
  }

  const event = await Event_Model.findOne({
    _id: eventId,
    organizerEmails: user.email,
  });

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const participant = event.participants.find(
    (p: any) => p.accountId.toString() === accountId.toString(),
  );

  if (!participant) {
    throw new AppError("Participant not found", httpStatus.NOT_FOUND);
  }

  const removedRole = participant.role;

  await attendee_model.deleteOne({
    user: accountId,
    event: eventId,
  });

  event.participants = event.participants.filter(
    (p: any) => p.accountId.toString() !== accountId.toString(),
  );

  await event.save();

  const account = await Account_Model.findById(accountId);
  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  account.role = account.role!.filter((r: string) => r !== removedRole);

  if (account.activeRole === removedRole) {
    account.activeRole = account.role.length > 0 ? account.role[0] : "ATTENDEE";
  }

  await account.save();

  // 🔹 ALSO remove from invitation model (FINAL FIX)
  await invitation_model.deleteMany({
    eventId: eventId,
    email: account.email,
  });
  return {
    accountId,
    eventId,
    removedRole,
    activeRole: account.activeRole,
  };
};
// get details
const get_attendee_details_from_db = async (
  user: any,
  eventId: any,
  accountId: any,
) => {
  if (!user?.email) {
    throw new AppError("Unauthorized", httpStatus.UNAUTHORIZED);
  }

  const isSuperAdmin = user.activeRole === "SUPER_ADMIN";

  // ✅ super admin হলে ownership check নেই
  const eventQuery = isSuperAdmin
    ? { _id: eventId }
    : { _id: eventId, organizerEmails: user.email };

  const event = await Event_Model.findOne(eventQuery).select("participants");

  // const event = await Event_Model.findOne({
  //   _id: eventId,
  //   organizerEmails: user.email,
  // }).select("participants");

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const participant = event.participants.find(
    (p: any) => p.accountId.toString() === accountId.toString(),
  );

  if (!participant) {
    throw new AppError("Participant not found", httpStatus.NOT_FOUND);
  }

  const account = await Account_Model.findById(accountId).select(
    "email role activeRole",
  );

  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  const profile = await UserProfile_Model.findOne({
    accountId: accountId,
  });

  if (!profile) {
    throw new AppError("User profile not found", httpStatus.NOT_FOUND);
  }

  return {
    accountId,
    roleInEvent: participant.role,
    account: {
      email: account.email,
      roles: account.role,
      activeRole: account.activeRole,
    },
    profile: {
      name: profile.name,
      avatar: profile.avatar,
      about: profile.about,
      contact: profile.contact,
      location: profile.location,
      education: profile.education,
      affiliations: profile.affiliations,
      resume: profile.resume,
      socialLinks: profile.socialLinks,
      personalWebsites: profile.personalWebsites,
    },
  };
};

export const organizer_service = {
  get_my_events_from_db,
  update_my_event_in_db,
  get_all_register_from_db,
  remove_attendee_from_event,
  get_attendee_details_from_db,
};

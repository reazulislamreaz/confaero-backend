import mongoose from "mongoose";
import httpStatus from "http-status";
import { Account_Model } from "../auth/auth.schema";
import { Organizer_Model } from "./superAdmin.schema";
import { Event_Model } from "./event.schema";
import { AppError } from "../../utils/app_error";
import { UserProfile_Model } from "../user/user.schema";
import { isAccountExist } from "../../utils/isAccountExist";
import formatDateRange from "../../utils/formatDateRange";
import sendMail from "../../utils/mail_sender";
import { stripe } from "../../configs/stripe";
import { getCoordinatesFromMapUrl } from "../../utils/geocode.util";
import { attendee_model } from "../attendee/attendee.schema";
import { Attendance } from "../qr/qr.schema";
import { invitation_model } from "../invitation/invitation.schema";
import { sponsor_model } from "../sponsor/sponsor.schema";
import { booth_model, booth_staff_model } from "../booth/booth.schema";

type TCreateOrganizerPayload = {
  email: string;
  organizationName: string;
};

type TCreateEventPayload = {
  title: string;
  organizerEmails: string[];
  location: string;
  startDate: string;
  endDate: string;
  website?: string;
  googleMapLink?: string;
  expectedAttendee?: number;
  boothSlot?: number;
  details?: string;
  price?: number;
  bannerImageUrl?: string;
  // floorMapImageUrl?: string[];
  // agenda?: string[];
};

const create_new_organizer_into_db = async (
  payload: TCreateOrganizerPayload,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const account = await Account_Model.findOne(
      { email: payload.email },
      null,
      { session },
    );

    if (!account) {
      throw new AppError("Account not found", httpStatus.NOT_FOUND);
    }

    if (account.role?.includes("ORGANIZER")) {
      throw new AppError(
        "User is already an organizer",
        httpStatus.BAD_REQUEST,
      );
    }

    account.role!.push("ORGANIZER");
    account.activeRole = "ORGANIZER";
    await account.save({ session });

    await Organizer_Model.create(
      [
        {
          accountId: account._id,
          organizationName: payload.organizationName,
          verifiedBySuperAdmin: true,
          stripeAccountId: null,
          stripeConnected: false,
          stripeChargesEnabled: false,
          stripePayoutsEnabled: false,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      email: account.email,
      role: account.role,
      activeRole: account.activeRole,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const create_event_by_super_admin_into_db = async (
  payload: TCreateEventPayload,
) => {
  const session = await mongoose.startSession();
  let createdEvent: any;

  try {
    session.startTransaction();

    const existingEvent = await Event_Model.findOne({
      organizerEmails: { $in: payload.organizerEmails },
    }).session(session);

    if (existingEvent) {
      throw new AppError(
        "This organizer already has an event. One organizer can create only one event.",
        httpStatus.BAD_REQUEST,
      );
    }

    const organizerAccountIds: mongoose.Types.ObjectId[] = [];
    const uniqueEmails = new Set<string>();

    for (const email of payload.organizerEmails) {
      if (uniqueEmails.has(email)) {
        throw new AppError(
          `Duplicate organizer email: ${email}`,
          httpStatus.BAD_REQUEST,
        );
      }
      uniqueEmails.add(email);

      const account = await Account_Model.findOne({ email }, null, {
        session,
      });

      if (!account) {
        throw new AppError(
          `Account not found for email: ${email}`,
          httpStatus.NOT_FOUND,
        );
      }

      // safer role update
      if (!account.role?.includes("ORGANIZER")) {
        account.role = [...(account.role || []), "ORGANIZER"];
        account.activeRole = "ORGANIZER";

        await account.save({ session });

        await Organizer_Model.create(
          [
            {
              accountId: account._id,
              organizationName: payload.title,
              verifiedBySuperAdmin: true,
              stripeAccountId: null,
              stripeConnected: false,
              stripeChargesEnabled: false,
              stripePayoutsEnabled: false,
            },
          ],
          { session },
        );
      }

      organizerAccountIds.push(account._id);
    }

    const event = await Event_Model.create(
      [
        {
          title: payload.title,
          website: payload.website,
          location: payload.location,
          googleMapLink: payload.googleMapLink,
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          expectedAttendee: payload.expectedAttendee,
          boothSlot: payload.boothSlot,
          details: payload.details,
          organizers: organizerAccountIds,
          organizerEmails: payload.organizerEmails,
          price: payload.price ?? 0,
          bannerImageUrl: payload.bannerImageUrl ?? "",
          latitude: null, // 🔥 initially null
          longitude: null, // 🔥 initially null
        },
      ],
      { session },
    );

    createdEvent = event[0];

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  /* ================================
     🔥 Background Tasks (Non Blocking)
     ================================ */

  setImmediate(async () => {
    try {
      const dashboardUrl =
        process.env.FRONTEND_DASHBOARD_URL || "http://localhost:3000/dashboard";

      const emailTemplate = `
        <p>Your event has been successfully created.</p>
        <p>
          You can log in using your existing email and password:
        </p>
        <p>
          <a href="${dashboardUrl}" target="_blank">
            Go to Dashboard
          </a>
        </p>
        <p>Thank you for being part of our platform.</p>
      `;

      // ✅ Send Email
      await sendMail({
        to: payload.organizerEmails[0],
        subject: "Your Event has been created",
        textBody: "Your event has been successfully created.",
        htmlBody: emailTemplate,
      });

      // ✅ Geocode (if map link exists)
      if (payload.googleMapLink) {
        const coordinates = await getCoordinatesFromMapUrl(
          payload.googleMapLink,
        );

        await Event_Model.findByIdAndUpdate(createdEvent._id, {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
      }
    } catch (error) {
      console.error("Background task failed:", error);
    }
  });

  return createdEvent;
};
const get_all_organizers_from_db = async (limit?: number) => {
  const query = Organizer_Model.find()
    .populate({ path: "accountId", select: "email role activeRole" })
    .sort({ createdAt: -1 });

  if (limit) {
    query.limit(limit);
  }

  return query.lean();
};
const get_specific_organizer_from_db = async (organizerId: any) => {
  const organizer = await Organizer_Model.findById(organizerId)
    .populate({ path: "accountId", select: "email role activeRole" })
    .lean();

  if (!organizer) {
    throw new AppError("Organizer not found", httpStatus.NOT_FOUND);
  }

  return organizer;
};

const get_all_events_of_organizer_from_db = async (organizerId: any) => {
  const organizer = await Organizer_Model.findById(organizerId).lean();

  if (!organizer) {
    throw new AppError("Organizer not found", httpStatus.NOT_FOUND);
  }

  return Event_Model.find({
    organizers: organizer.accountId,
  })
    .select(
      "title location startDate endDate website expectedAttendee boothSlot",
    )
    .sort({ startDate: -1 })
    .lean();
};

const get_specific_event_of_organizer_from_db = async (
  organizerId: any,
  eventId: any,
) => {
  const organizer = await Organizer_Model.findById(organizerId).lean();

  if (!organizer) {
    throw new AppError("Organizer not found", httpStatus.NOT_FOUND);
  }

  const event = await Event_Model.findOne({
    _id: eventId,
    organizers: organizer.accountId,
  })
    .select(
      "title location startDate endDate website googleMapLink expectedAttendee boothSlot details",
    )
    .lean();

  if (!event) {
    throw new AppError(
      "Event not found or access denied",
      httpStatus.NOT_FOUND,
    );
  }

  return event;
};

const get_all_events_from_db = async (params: {
  search?: string;
  createdSort?: string;
  eventDate?: string;
  condition?: string;
  page?: number;
  limit?: number;
}) => {
  const {
    search,
    createdSort = "Recently",
    eventDate,
    condition,
    page = 1,
    limit = 10,
  } = params;

  const pipeline: any[] = [];
  const matchConditions: any[] = [];

  // 1. Search Logic
  if (search && search.trim()) {
    matchConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ],
    });
  }

  const now = new Date();

  // 2. Event Date Filter
  if (eventDate) {
    if (eventDate === "Recently") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      matchConditions.push({ createdAt: { $gte: sevenDaysAgo } });
    } else if (eventDate === "This Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      matchConditions.push({ startDate: { $gte: startOfMonth, $lte: endOfMonth } });
    } else if (eventDate === "Next Month") {
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      matchConditions.push({ startDate: { $gte: startOfNextMonth, $lte: endOfNextMonth } });
    }
  }

  // 3. Condition Filter
  if (condition) {
    if (condition === "Upcoming") {
      matchConditions.push({ startDate: { $gt: now } });
    } else if (condition === "Ongoing") {
      matchConditions.push({
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
    } else if (condition === "Completed") {
      matchConditions.push({ endDate: { $lt: now } });
    }
  }

  // Final Match Object
  const matchQuery = matchConditions.length > 0 ? { $and: matchConditions } : {};
  console.log("EVENT FILTER QUERY:", JSON.stringify(matchQuery, null, 2));
  pipeline.push({ $match: matchQuery });

  // 4. Registration Metric (Lookup from attendee collection)
  pipeline.push({
    $lookup: {
      from: "attendee_registrations",
      localField: "_id",
      foreignField: "event",
      as: "registration_data",
    },
  });

  // 5. Add Dynamic Fields
  pipeline.push({
    $addFields: {
      registrationCount: { $size: "$registration_data" },
      organizerCount: { $size: { $ifNull: ["$organizers", []] } },
    },
  });

  // 6. Sorting
  let sortField: any = { createdAt: -1 };
  if (createdSort === "Oldest") {
    sortField = { createdAt: 1 };
  } else if (createdSort === "Most Popular") {
    sortField = { registrationCount: -1 };
  }
  console.log("SORT:", JSON.stringify(sortField, null, 2));
  pipeline.push({ $sort: sortField });

  // 7. Pagination
  pipeline.push({ $skip: (page - 1) * limit });
  pipeline.push({ $limit: limit });

  // 8. Projection
  pipeline.push({
    $project: {
      title: 1,
      location: 1,
      startDate: 1,
      endDate: 1,
      expectedAttendee: 1,
      boothSlot: 1,
      bannerImageUrl: 1,
      website: 1,
      registrationCount: 1,
      organizerCount: 1,
      createdAt: 1,
    },
  });

  const result = await Event_Model.aggregate(pipeline);
  return result;
};

//
const get_event_details_from_db = async (eventId: any) => {
  const event = await Event_Model.findById(eventId).lean();

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  return event;
};

type TGetAllUsersParams = {
  limit?: number;
  page?: number;
  search?: string;
};

const get_all_users_from_db = async ({
  limit,
  page,
  search,
}: TGetAllUsersParams) => {
  const accounts = await Account_Model.find()
    .select("_id email activeRole createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const accountIds = accounts.map((acc) => acc._id);

  // const profiles = await User_Model.find({
  //   accountId: { $in: accountIds },
  // })
  //   .select("accountId name phone")
  //   .lean();

  const profiles = await UserProfile_Model.find({
    accountId: { $in: accountIds },
  })
    .select("accountId name location.address")
    .lean();

  const profileMap = new Map(
    profiles.map((profile) => [profile.accountId!.toString(), profile]),
  );

  return accounts.map((account) => ({
    ...account,
    profile: profileMap.get(account._id.toString()) || null,
  }));
};

const get_user_details_from_db = async (userId: any) => {
  const account = await Account_Model.findById(userId)
    .select("email role activeRole createdAt")
    .lean();

  if (!account) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const profile = await UserProfile_Model.findOne({
    accountId: account._id,
  })
    .select("-__v")
    .lean();

  return {
    account,
    profile,
  };
};

const suspend_user_from_db = async (email: any) => {
  const account = await isAccountExist(email);

  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }
  const deleteUser = await Account_Model.findOneAndDelete({ email });

  return deleteUser;
};

const delete_user_from_db = async (userId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const account = await Account_Model.findById(userId).session(session);

    if (!account) {
      throw new AppError("Account not found", httpStatus.NOT_FOUND);
    }

    // Safety check: Don't allow deleting another Super Admin from this route
    if (account.role?.includes("SUPER_ADMIN")) {
      throw new AppError(
        "Cannot delete another Super Admin.",
        httpStatus.BAD_REQUEST,
      );
    }

    // Delete Profile
    await UserProfile_Model.findOneAndDelete(
      { accountId: userId },
      { session },
    );

    // Delete Account
    const deletedAccount = await Account_Model.findByIdAndDelete(userId, {
      session,
    });

    await session.commitTransaction();
    return deletedAccount;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


const get_event_overview_from_db = async (eventId: any) => {
  const event = await Event_Model.findById(eventId)
    .select("title location startDate endDate expectedAttendee participants") // ✅ participants added
    .lean();

  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const [
    checkedInAttendees,
    exhibitors,
    pendingRequests,
    registrationTrend,
    recentRegs,
    topPartnersRaw,
  ] = await Promise.all([
    Attendance.countDocuments({ eventId }),
    invitation_model.countDocuments({
      eventId,
      role: "EXHIBITOR",
      status: "ACCEPTED",
    }),
    invitation_model.countDocuments({ eventId, status: "PENDING" }),
    attendee_model.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]),
    attendee_model
      .find({ event: eventId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("account", "email")
      .lean(),
    sponsor_model
      .find({ eventId, status: "approved" })
      .sort({ profileView: -1 })
      .limit(5)
      .select("companyName logoUrl profileView")
      .lean(),
  ]);

  // ✅ FIXED: total registrations from participants
  const totalRegistrations = event.participants?.length || 0;

  // Map user profiles for recent registrations
  const accountIds = recentRegs.map((r: any) => r.account?._id).filter(Boolean);

  const profiles = await UserProfile_Model.find({
    accountId: { $in: accountIds },
  })
    .select("accountId name avatar")
    .lean();

  const profileMap = new Map(
    profiles.map((p: any) => [p.accountId.toString(), p]),
  );

  const recentRegistrations = recentRegs.map((r: any) => {
    const accId = r.account?._id?.toString();

    return {
      id: r._id,
      name: accId ? profileMap.get(accId)?.name || "Anonymous" : "Anonymous",
      email: r.account?.email || "N/A",
      avatar: accId ? profileMap.get(accId)?.avatar || "" : "",
      role: "Attendee",
      createdAt: r.createdAt,
    };
  });

  const topPartners = topPartnersRaw.map((s: any) => ({
    id: s._id,
    name: s.companyName,
    logo: s.logoUrl,
    views: s.profileView || 0,
  }));

  return {
    eventInfo: {
      title: event.title,
      location: event.location,
      dateRange: {
        start: event.startDate,
        end: event.endDate,
      },
    },

    stats: {
      totalRegistrations, // ✅ correct now
      checkedInAttendees,
      exhibitors,
      pendingRequests,
    },

    registrationTrend,
    recentRegistrations,
    topPartners,
  };
};
// const get_event_overview_from_db = async (eventId: any) => {
//   const event = await Event_Model.findById(eventId)
//     .select("title location startDate endDate expectedAttendee")
//     .lean();

//   if (!event) {
//     throw new AppError("Event not found", httpStatus.NOT_FOUND);
//   }

//   const [
//     totalRegistrations,
//     checkedInAttendees,
//     exhibitors,
//     pendingRequests,
//     registrationTrend,
//     recentRegs,
//     topPartnersRaw,
//   ] = await Promise.all([
//     attendee_model.countDocuments({ event: eventId }),
//     Attendance.countDocuments({ eventId }),
//     invitation_model.countDocuments({
//       eventId,
//       role: "EXHIBITOR",
//       status: "ACCEPTED",
//     }),
//     invitation_model.countDocuments({ eventId, status: "PENDING" }),
//     attendee_model.aggregate([
//       { $match: { event: new mongoose.Types.ObjectId(eventId) } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//       { $project: { date: "$_id", count: 1, _id: 0 } },
//     ]),
//     attendee_model
//       .find({ event: eventId })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate("account", "email")
//       .lean(),
//     sponsor_model
//       .find({ eventId, status: "approved" })
//       .sort({ profileView: -1 })
//       .limit(5)
//       .select("companyName logoUrl profileView")
//       .lean(),
//   ]);

//   // Map user profiles for recent registrations
//   const accountIds = recentRegs.map((r: any) => r.account?._id);
//   const profiles = await UserProfile_Model.find({
//     accountId: { $in: accountIds },
//   })
//     .select("accountId name avatar")
//     .lean();

//   const profileMap = new Map(
//     profiles.map((p: any) => [p.accountId.toString(), p]),
//   );

//   const recentRegistrations = recentRegs.map((r: any) => ({
//     id: r._id,
//     name: profileMap.get(r.account?._id.toString())?.name || "Anonymous",
//     email: r.account?.email || "N/A",
//     avatar: profileMap.get(r.account?._id.toString())?.avatar || "",
//     role: "Attendee", // Default
//     createdAt: r.createdAt,
//   }));

//   const topPartners = topPartnersRaw.map((s: any) => ({
//     id: s._id,
//     name: s.companyName,
//     logo: s.logoUrl,
//     views: s.profileView || 0,
//   }));

//   return {
//     eventInfo: {
//       title: event.title,
//       location: event.location,
//       dateRange: {
//         start: event.startDate,
//         end: event.endDate,
//       },
//     },

//     stats: {
//       totalRegistrations: totalRegistrations || event.expectedAttendee || 0,
//       checkedInAttendees,
//       exhibitors,
//       pendingRequests,
//     },

//     registrationTrend,
//     recentRegistrations,
//     topPartners,
//   };
// };

// extra
type THeaderEvent = {
  id: string;
  title: string;
  location: string;
  dateRange: string | null;
};

type TLeanEvent = {
  _id: string;
  title: string;
  location: string;
  startDate?: Date;
  endDate?: Date;
};

// get header events
const get_header_events_from_db = async (): Promise<THeaderEvent[]> => {
  const now = new Date();

  const events = await Event_Model.find({
    $or: [
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        startDate: { $gt: now },
      },
    ],
  })
    .sort({ startDate: 1 })
    .limit(3)
    .select("title location startDate endDate")
    .lean<TLeanEvent[]>();

  return events.map((event) => ({
    id: event._id,
    title: event.title,
    location: event.location,
    dateRange: formatDateRange(event.startDate, event.endDate),
  }));
};

const get_dashboard_overview_from_db = async () => {
  const now = new Date();

  const [
    headerEvents,
    totalEvents,
    ongoingEvents,
    totalOrganizers,
    totalParticipants,
    recentEvents,
    latestOrganizers,
  ] = await Promise.all([
    get_header_events_from_db(),
    Event_Model.countDocuments(),
    Event_Model.countDocuments({
      startDate: { $lte: now },
      endDate: { $gte: now },
    }),
    Organizer_Model.countDocuments(),
    Account_Model.countDocuments({
      role: { $nin: ["SUPER_ADMIN", "ORGANIZER"] },
    }),
    Event_Model.find()
      .select("title location startDate endDate")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Organizer_Model.find()
      .populate({
        path: "accountId",
        select: "email",
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  return {
    headerEvents,

    stats: {
      totalEvents,
      ongoingEvents,
      totalOrganizers,
      totalParticipants,
    },

    recentEvents: recentEvents.map((e: any) => ({
      id: e._id.toString(),
      title: e.title,
      location: e.location,
      dateRange: formatDateRange(e.startDate, e.endDate),
    })),

    latestOrganizers: latestOrganizers.map((o: any) => ({
      id: o._id.toString(),
      email:
        typeof o.accountId === "object" &&
        o.accountId !== null &&
        "email" in o.accountId
          ? o.accountId.email
          : null,
    })),
  };
};

const get_single_event_details_from_db = async (eventId: any) => {
  const event = await Event_Model.findById(eventId).lean();
  console.log(event);
  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  return event;
};

const connect_organizer_stripe_account = async (accountId: any) => {
  const organizer = await Organizer_Model.findOne({ accountId });

  if (!organizer) {
    throw new AppError("Organizer not found", httpStatus.NOT_FOUND);
  }

  // ✅ Case-3: already fully connected
  if (organizer.stripeAccountId && organizer.stripeConnected) {
    throw new AppError("Stripe already connected", httpStatus.BAD_REQUEST);
  }

  let stripeAccountId = organizer.stripeAccountId;

  // ✅ Case-1: account not created yet
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "standard",
    });

    stripeAccountId = account.id;
    organizer.stripeAccountId = stripeAccountId;
    organizer.stripeConnected = false;
    await organizer.save();
  }

  // ✅ Case-2: account exists but onboarding incomplete
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `http://localhost:3000/dashboard/payment-management`,
    return_url: `http://localhost:3000/dashboard/payment-management`,
    type: "account_onboarding",
  });

  return {
    onboardingUrl: accountLink.url,
  };
};

const get_stripe_onboarding_link = async (accountId: any) => {
  const organizer = await Organizer_Model.findOne({ accountId });

  if (!organizer || !organizer.stripeAccountId) {
    throw new AppError("Stripe account not initiated yet", httpStatus.BAD_REQUEST);
  }

  const accountLink = await stripe.accountLinks.create({
    account: organizer.stripeAccountId,
    refresh_url: `http://localhost:3000/dashboard/payment-management`,
    return_url: `http://localhost:3000/dashboard/payment-management`,
    type: "account_onboarding",
  });

  return {
    onboardingUrl: accountLink.url,
  };
};

const get_organizer_stripe_status = async (accountId: any) => {
  const organizer = await Organizer_Model.findOne({ accountId });

  if (!organizer) {
    throw new AppError("Organizer not found", httpStatus.NOT_FOUND);
  }

  // ✅ Actively fetch from Stripe if account exists
  if (organizer.stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(organizer.stripeAccountId);
      
      organizer.stripeConnected = account.details_submitted;
      organizer.stripeChargesEnabled = account.charges_enabled;
      organizer.stripePayoutsEnabled = account.payouts_enabled;

      await organizer.save();
    } catch (err) {
      console.error("Failed to retrieve Stripe account status:", err);
    }
  }

  return {
    stripeAccountId: organizer.stripeAccountId,
    stripeConnected: organizer.stripeConnected,
    stripeChargesEnabled: organizer.stripeChargesEnabled || false,
    stripePayoutsEnabled: organizer.stripePayoutsEnabled || false,
  };
};
const get_global_event_trend_from_db = async () => {
  return Event_Model.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
};

const update_event_in_db = async (eventId: string, payload: any) => {
  const event = await Event_Model.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const isMapUrlChanged =
    payload.googleMapLink && payload.googleMapLink !== event.googleMapLink;

  const updateData: any = {};
  if (payload.title) updateData.title = payload.title;
  if (payload.location) updateData.location = payload.location;
  if (payload.startDate) updateData.startDate = new Date(payload.startDate);
  if (payload.endDate) updateData.endDate = new Date(payload.endDate);
  if (payload.website) updateData.website = payload.website;
  if (payload.description) updateData.details = payload.description;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.expectedParticipants)
    updateData.expectedAttendee = payload.expectedParticipants;
  if (payload.boothSlots) updateData.boothSlot = payload.boothSlots;
  if (payload.image) updateData.bannerImageUrl = payload.image;
  if (payload.status) updateData.status = payload.status;
  if (payload.googleMapLink) updateData.googleMapLink = payload.googleMapLink;
  if (payload.floorMapImageUrl)
    updateData.floorMapImageUrl = payload.floorMapImageUrl;
  if (payload.agenda) updateData.agenda = payload.agenda;

  if (isMapUrlChanged) {
    updateData.latitude = null;
    updateData.longitude = null;
  }

  const mongoUpdate: any = { $set: updateData };

  const result = await Event_Model.findByIdAndUpdate(eventId, mongoUpdate, {
    new: true,
    runValidators: true,
  });

  if (isMapUrlChanged) {
    setImmediate(async () => {
      try {
        const coordinates = await getCoordinatesFromMapUrl(
          payload.googleMapLink,
        );

        await Event_Model.findByIdAndUpdate(eventId, {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
      } catch (error) {
        console.error("Background geocode failed:", error);
      }
    });
  }

  return result;
};

const delete_event_from_db = async (eventId: string) => {
  const event = await Event_Model.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  // Cascading delete
  const relatedBooths = await booth_model.find({ eventId: eventId }).select("_id");
  const boothIds = relatedBooths.map((b) => b._id);
  
  await attendee_model.deleteMany({ event: eventId });
  await booth_model.deleteMany({ eventId: eventId });
  await booth_staff_model.deleteMany({ boothId: { $in: boothIds } });
  await invitation_model.deleteMany({ eventId: eventId });

  const result = await Event_Model.findByIdAndDelete(eventId);
  return result;
};

export const super_admin_service = {
  create_new_organizer_into_db,
  create_event_by_super_admin_into_db,
  get_all_organizers_from_db,
  get_specific_organizer_from_db,
  get_all_events_of_organizer_from_db,
  get_specific_event_of_organizer_from_db,
  get_all_events_from_db,
  get_user_details_from_db,
  get_all_users_from_db,
  suspend_user_from_db,
  delete_user_from_db,
  get_event_overview_from_db,
  get_dashboard_overview_from_db,
  get_event_details_from_db,
  get_single_event_details_from_db,
  connect_organizer_stripe_account,
  get_organizer_stripe_status,
  get_stripe_onboarding_link,
  get_global_event_trend_from_db,
  update_event_in_db,
  delete_event_from_db,
};

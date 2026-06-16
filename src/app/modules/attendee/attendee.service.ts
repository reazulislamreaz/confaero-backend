import { Event_Model } from "../superAdmin/event.schema";
import { attendee_model } from "./attendee.schema";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";
import { Organizer_Model } from "../superAdmin/superAdmin.schema";
import { stripe } from "../../configs/stripe";
import { verify_email_model } from "../verifyEmail/verifyEmail.schema";
import { configs } from "../../configs";
import { Account_Model } from "../auth/auth.schema";
import { ObjectId } from "mongodb";
import { invitation_model } from "../invitation/invitation.schema";

const get_all_upcoming_events_from_db = async () => {
  const now = new Date();

  return Event_Model.find(
    {
      endDate: { $gte: now },
    },
    {
      title: 1,
      bannerImageUrl: 1,
      startDate: 1,
      endDate: 1,
      location: 1,
    },
  )
    .sort({ startDate: 1 })
    .lean();
};

const get_all_events_from_db = async () => {
  return Event_Model.find()
    .sort({ startDate: -1 })
    .select(
      "title location startDate endDate website bannerImageUrl expectedAttendee boothSlot details",
    )
    .lean();
};

const initiate_attendee_registration = async (
  userId: Types.ObjectId,
  userEmail: any,
  eventId: Types.ObjectId,
) => {
  const event = await Event_Model.findById(eventId);
  if (!event) {
    throw new AppError("Event not found", httpStatus.NOT_FOUND);
  }

  const alreadyRegistered = await attendee_model.findOne({
    account: userId,
    event: eventId,
    status: "VERIFIED",
  });

  if (alreadyRegistered) {
    throw new AppError(
      "You already registered for this event",
      httpStatus.BAD_REQUEST,
    );
  }

  /* ======================================================
     🟢 STEP 1: GLOBAL EMAIL VERIFICATION CHECK
     ====================================================== */
  const verifyEmail = await verify_email_model.findOne({
    event: eventId,
    email: userEmail.toLowerCase(),
    isUsed: false,
  });

  if (verifyEmail) {
    // mark email as used
    verifyEmail.isUsed = true;
    verifyEmail.usedBy = userId;
    verifyEmail.usedAt = new Date();
    await verifyEmail.save();

    // direct registration (same as normal success)
    await Event_Model.findByIdAndUpdate(eventId, {
      $push: {
        participants: {
          accountId: userId,
          role: "ATTENDEE",
          sessionIndex: [],
        },
      },
    });
    await Account_Model.findByIdAndUpdate(
      { _id: new ObjectId(userId) },
      { activeRole: "ATTENDEE" },
    );
    return attendee_model.create({
      account: userId,
      event: eventId,
      status: "VERIFIED",
      paymentProvider: event.paymentType, // 🔑 keep original type
    });
  }

  /* ======================================================
     🟡 STEP 2: NORMAL FLOW (NO VERIFIED EMAIL)
     ====================================================== */

  // ---------- EXTERNAL ----------
  if (event.paymentType === "EXTERNAL") {
    const registration = await attendee_model.create({
      account: userId,
      event: eventId,
      status: "PENDING",
      paymentProvider: "EXTERNAL",
      referenceId: "u123456", // replace with uuid later
    });

    return {
      redirectUrl: `${event.externalPaymentUrl}?ref=${registration.referenceId}`,
    };
  }

  // ---------- STRIPE ----------
  if (event.paymentType === "STRIPE") {
    if (!event.price) {
      throw new AppError(
        "Paid event must have a valid price",
        httpStatus.BAD_REQUEST,
      );
    }

    const organizer = await Organizer_Model.findOne({
      accountId: { $in: event.organizers },
      stripeConnected: true,
    });

    if (!organizer || !organizer.stripeAccountId) {
      throw new AppError(
        "Organizer is not ready for Stripe payments",
        httpStatus.BAD_REQUEST,
      );
    }

    const amount = Math.round(Number(event.price) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: userId.toString(),
        eventId: eventId.toString(),
      },
      transfer_data: {
        destination: organizer.stripeAccountId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  /* ======================================================
     ❌ FALLBACK
     ====================================================== */
  throw new AppError(
    "Invalid event payment configuration",
    httpStatus.BAD_REQUEST,
  );
};

// register for create attendee after successful payment for webhook
export const finalize_attendee_registration = async (
  userId: string,
  eventId: string,
  paymentIntentId: string,
) => {
  const exists = await attendee_model.findOne({
    account: userId,
    event: eventId,
  });

  if (exists) return exists;

  await Event_Model.findByIdAndUpdate(eventId, {
    $push: {
      participants: {
        accountId: userId,
        role: "ATTENDEE",
        sessionIndex: [],
      },
    },
  });
  await Account_Model.findByIdAndUpdate(
    { _id: new ObjectId(userId) },
    { activeRole: "ATTENDEE" },
  );
  return attendee_model.create({
    account: userId,
    event: eventId,
    status: "VERIFIED",
    paymentProvider: "STRIPE",
    stripePaymentIntentId: paymentIntentId,
  });
};

//

const get_my_all_registered_events_from_db = async (userId: Types.ObjectId) => {
  const now = new Date();

  const result = await attendee_model
    .find(
      {
        account: userId,
        status: "VERIFIED",
      },
      {
        event: 1,
        status: 1,
      },
    )
    .populate({
      path: "event",
      match: {
        endDate: { $gte: now },
      },
      select: "title startDate endDate bannerImageUrl location",
    })
    .lean();

  if (!result?.length) return [];

  // populate match fail হলে event = null আসে → filter করা দরকার
  return result
    .filter((item) => item.event)
    .map((item) => ({
      event: item.event,
      status: item.status,
    }));
};
const get_my_registered_events_from_db = async (userId: Types.ObjectId) => {
  const now = new Date();

  const result = await attendee_model
    .find(
      {
        account: userId,
        status: "VERIFIED",
      },
      {
        event: 1,
        status: 1,
      },
    )
    .populate({
      path: "event",
      match: {
        endDate: { $gte: now },
      },
      select: "title startDate endDate bannerImageUrl location",
    })
    .lean();

  if (!result?.length) return [];

  // populate match fail হলে event = null আসে → filter করা দরকার
  return result
    .filter((item) => item.event)
    .map((item) => ({
      event: item.event,
      status: item.status,
    }));
};
//

const get_single_event_from_db = async (
  eventId: Types.ObjectId,
  id: string,
) => {
  const event = await Event_Model.findOne(
    {
      _id: eventId,
    },
    {
      title: 1,
      website: 1,
      location: 1,
      googleMapLink: 1,
      startDate: 1,
      endDate: 1,
      details: 1,
      bannerImageUrl: 1,
      expectedAttendee: 1,
      boothSlot: 1,
      eventType: 1,
      paymentType: 1,
      price: 1,
      createdAt: 1,
      latitude: 1,
      longitude: 1,
    },
  ).lean();
  if (!event) return null;

  let registrationStatus: "NOT_REGISTERED" | "PENDING" | "VERIFIED" =
    "NOT_REGISTERED";

  if (id) {
    const registration = await attendee_model
      .findOne({
        account: id,
        event: eventId,
      })
      .select("status");

    if (registration) {
      registrationStatus = registration.status as any;
    }
  }

  return {
    ...event,
    registrationStatus,
  };
};
const get_event_sessions_from_db = async (eventId: Types.ObjectId) => {
  const event = (await Event_Model.findById(eventId)
    .select("agenda")
    .lean()) as unknown as { agenda?: any[] };

  return event?.agenda || [];
};

const get_event_home_from_db = async (eventId: any) => {
  const event = await Event_Model.findById(eventId)
    .select("title bannerImageUrl location startDate endDate details")
    .lean();

  if (!event) return null;

  return {
    eventInfo: {
      title: event.title,
      banner: event.bannerImageUrl,
      venue: event.location,
      details: event.details,
      startDate: event.startDate,
      endDate: event.endDate,
    },
    // sponsors: event.sponsors || [],
  };
};

// const QR_SECRET = process.env.QR_SECRET as string;
const QR_SECRET =
  configs?.qr?.secret || "qr_super_secret_key_for_event_access_2026";
// QR Code r error handling
if (!QR_SECRET) {
  throw new Error("QR_SECRET is missing in configuration");
}
const generate_qr_token_from_db = async (
  attendeeId: Types.ObjectId,
  eventId: any,
) => {
  const payload = {
    attendeeId,
    eventId,
    type: "ATTENDEE_QR",
  };

  const token = jwt.sign(payload, QR_SECRET, {
    expiresIn: "12h", // event duration অনুযায়ী adjust করতে পারো
  });

  return {
    qrToken: token,
  };
};
const join_event_from_db = async (
  userId: Types.ObjectId,
  eventId: any,
  role?: any,
) => {
  const allowedRoles = [
    "ATTENDEE",
    "SPEAKER",
    "EXHIBITOR",
    "STAFF",
    "SPONSOR",
    "VOLUNTEER",
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR",
  ];
  const activeRole = allowedRoles.includes(role) ? role : "ATTENDEE";

  return Account_Model.findByIdAndUpdate(
    userId,
    { activeEvent: eventId, activeRole },
    { new: true },
  );
};

const get_my_unified_events_from_db = async (
  userId: Types.ObjectId,
  userEmail: string,
) => {
  const now = new Date();

  // 1️⃣ Fetch registered events
  const registeredEvents = await attendee_model
    .find(
      {
        account: userId,
        status: "VERIFIED",
      },
      { event: 1, status: 1 },
    )
    .populate({
      path: "event",
      match: { endDate: { $gte: now } },
      select: "title startDate endDate bannerImageUrl location",
    })
    .lean();

  // 2️⃣ Fetch invitations
  const invitations = await invitation_model
    .find({ email: userEmail.toLowerCase() })
    .populate({
      path: "eventId",
      select: "title startDate endDate location bannerImageUrl",
    })
    .lean();

  // 3️️ Build unified map (deduplicate by eventId)
  const eventMap = new Map<
    string,
    {
      event: any;
      status: "REGISTERED" | "INVITED";
      invitationRole?: string;
    }
  >();

  // Add registered events
  registeredEvents.forEach((item) => {
    if (item.event) {
      const eventId = item.event._id.toString();
      eventMap.set(eventId, {
        event: item.event,
        status: "REGISTERED",
      });
    }
  });

  // Add invitations (only if not already registered)
  invitations.forEach((inv) => {
    if (inv.eventId) {
      const eventId = inv.eventId._id.toString();
      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, {
          event: inv.eventId,
          status: "INVITED",
          invitationRole: inv.role,
        });
      }
    }
  });

  // 4️⃣ Convert to array
  return Array.from(eventMap.values());
};

export const attendee_service = {
  get_all_upcoming_events_from_db,
  get_all_events_from_db,
  get_my_all_registered_events_from_db,
  get_my_registered_events_from_db,
  get_single_event_from_db,
  get_event_sessions_from_db,
  get_event_home_from_db,
  generate_qr_token_from_db,
  initiate_attendee_registration,
  join_event_from_db,
  get_my_unified_events_from_db,
};

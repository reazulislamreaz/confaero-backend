import { UserProfile_Model } from "../user/user.schema";
import { Lead } from "./qr.schema";
import { Types } from "mongoose";

export const get_exhibitor_leads_service = async ({
  eventId,
  exhibitorId,
  filter = "all",
  search = "",
}: {
  eventId: string;
  exhibitorId: string;
  filter?: "all" | "hot" | "followup";
  search?: string;
}) => {
  const matchQuery: any = {
    eventId: new Types.ObjectId(eventId),
    exhibitorId: new Types.ObjectId(exhibitorId),
  };

  const normalizedFilter = filter.toLowerCase();
  if (normalizedFilter === "hot") {
    matchQuery.tags = { $in: ["hot"] };
  } else if (normalizedFilter === "followup") {
    matchQuery.tags = { $in: ["follow-up"] };
  }

  const aggregation: any[] = [
    { $match: matchQuery },
    {
      $lookup: {
        from: "accounts",
        localField: "attendeeId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $lookup: {
        from: "user_profiles",
        localField: "attendeeId",
        foreignField: "accountId",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
  ];

  // Apply search filter if provided
  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    aggregation.push({
      $match: {
        $or: [
          { "account.email": searchRegex },
          { "profile.name": searchRegex },
          { "profile.affiliations.company": searchRegex },
        ],
      },
    });
  }

  aggregation.push({ $sort: { createdAt: -1 } });

  const leads = await Lead.aggregate(aggregation);

  const formattedLeads = leads.map((lead: any) => {
    const affiliation = lead.profile?.affiliations?.[0];
    return {
      leadId: lead._id,
      attendeeId: lead.attendeeId,
      email: lead.account.email,
      name: lead.profile?.name || "Unknown",
      avatar: lead.profile?.avatar || null,
      designation: affiliation?.position || "Unknown",
      company: affiliation?.company || "Unknown",
      tags: lead.tags,
      note: lead.note,
      createdAt: lead.createdAt,
    };
  });

  return {
    total: formattedLeads.length,
    leads: formattedLeads,
  };
};

export const update_lead_note_service = async ({
  leadId,
  exhibitorId,
  note,
}: {
  leadId: any;
  exhibitorId: string;
  note: string;
}) => {
  const cleanedNote = note?.trim() || null;

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, exhibitorId },
    { note: cleanedNote },
    { new: true },
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  return {
    leadId: lead._id,
    note: lead.note,
  };
};

export const update_lead_tags_service = async ({
  leadId,
  exhibitorId,
  tags,
}: {
  leadId: any;
  exhibitorId: any;
  tags: string[];
}) => {
  // Normalize tags to lowercase
  const normalizedTags = tags.map(t => t.toLowerCase());

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, exhibitorId },
    { tags: normalizedTags },
    { new: true },
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  return {
    leadId: lead._id,
    tags: lead.tags,
  };
};

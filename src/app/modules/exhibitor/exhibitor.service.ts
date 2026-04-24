import { Types } from "mongoose";
import { Lead } from "../qr/qr.schema";
import { UserProfile_Model } from "../user/user.schema";

export const get_exhibitor_performance_service = async ({
  exhibitorId,
  eventId,
  interval = "daily",
  limit = 5,
}: {
  exhibitorId: string;
  eventId: string;
  interval?: "daily" | "weekly";
  limit?: number;
}) => {
  const matchQuery = {
    exhibitorId: new Types.ObjectId(exhibitorId),
    eventId: new Types.ObjectId(eventId),
  };

  // 1. Total Scans Count
  const totalScans = await Lead.countDocuments(matchQuery);

  // 2. Traffic Over Time (Analytics Graph)
  let dateFormat = "%Y-%m-%d";
  if (interval === "weekly") {
    dateFormat = "%Y-W%V";
  }

  const trafficOverTime = await Lead.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        scans: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        label: "$_id",
        scans: 1,
        _id: 0,
      },
    },
  ]);

  // 3. Recent Leads List
  const recentLeadsRaw = await Lead.find(matchQuery)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const attendeeIds = recentLeadsRaw.map((lead) => lead.attendeeId);
  
  const profiles = await UserProfile_Model.find({
    accountId: { $in: attendeeIds },
  }).lean();

  const profilesMap = profiles.reduce((acc: any, profile: any) => {
    acc[profile.accountId.toString()] = profile;
    return acc;
  }, {});

  const recentLeads = recentLeadsRaw.map((lead: any) => {
    const profile = profilesMap[lead.attendeeId.toString()];
    const affiliation = profile?.affiliations?.[0];
    
    return {
      id: lead._id,
      name: profile?.name || "Unknown",
      designation: affiliation?.position || "Unknown",
      company: affiliation?.company || "Unknown",
      avatar: profile?.avatar || null,
      scannedAt: lead.createdAt,
    };
  });

  return {
    totalScans,
    trafficOverTime: {
      interval,
      data: trafficOverTime,
    },
    recentLeads,
  };
};

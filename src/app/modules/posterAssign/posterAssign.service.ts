import { Types } from "mongoose";
import { poster_assign_model } from "./posterAssign.schema";
import { poster_model } from "../poster/poster.schema";
import { UserProfile_Model } from "../user/user.schema";
import { Event_Model } from "../superAdmin/event.schema";
import { Account_Model } from "../auth/auth.schema";
import sendMail from "../../utils/mail_sender";
type PopulatedAuthor = {
  _id: Types.ObjectId;
  name: string;
  email: string;
};

// ✅ Poster type with populated author
type PosterWithAuthor = {
  _id: Types.ObjectId;
  title: string;
  authorId: PopulatedAuthor;
  attachments: {
    _id: Types.ObjectId;
    [key: string]: any;
  }[];
  createdAt: Date;
};
const create_new_poster_assign_into_db = async (payload: {
  items: {
    posterId: string;
    attachmentId: string;
  }[];
  reviewerId: string;
  assignedBy: string;
  eventId: string;
  dueDate?: string;
}) => {
  const assignments = payload.items.map((item) => ({
    eventId: new Types.ObjectId(payload.eventId),
    posterId: new Types.ObjectId(item.posterId),
    attachmentId: new Types.ObjectId(item.attachmentId),
    reviewerId: new Types.ObjectId(payload.reviewerId),
    assignedBy: new Types.ObjectId(payload.assignedBy),
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    status: "assigned",
  }));

  // 1️⃣ create all assignments
  await poster_assign_model.insertMany(assignments);

  // 2️⃣ update all attachments status
  for (const item of payload.items) {
    await poster_model.updateOne(
      {
        _id: new Types.ObjectId(item.posterId),
        "attachments._id": new Types.ObjectId(item.attachmentId),
      },
      {
        $set: {
          "attachments.$.reviewStatus": "assigned",
        },
      },
    );
  }

  return {
    count: assignments.length,
    message: "Multiple posters assigned successfully",
  };
};
const reassign_poster_to_reviewer_into_db = async (payload: {
  eventId: string;
  items: {
    posterId: string;
    attachmentId: string;
  }[];
  reviewerId: string;
  assignedBy: string;
  dueDate?: string;
}) => {
  const results = [];

  for (const item of payload.items) {
    // 1️⃣ Find last assignment and update it
    const updated = await poster_assign_model.findOneAndUpdate(
      {
        eventId: new Types.ObjectId(payload.eventId),
        posterId: new Types.ObjectId(item.posterId),
        attachmentId: new Types.ObjectId(item.attachmentId),
      },
      {
        $set: {
          reviewerId: new Types.ObjectId(payload.reviewerId),
          assignedBy: new Types.ObjectId(payload.assignedBy),
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          status: "assigned",
          isReassigned: true,
        },
      },
      { new: true, sort: { createdAt: -1 } },
    );

    if (updated) {
      // 2️⃣ Update corresponding attachment status in poster model
      await poster_model.updateOne(
        {
          _id: new Types.ObjectId(item.posterId),
          "attachments._id": new Types.ObjectId(item.attachmentId),
        },
        {
          $set: {
            "attachments.$.reviewStatus": "assigned",
          },
        },
      );
      results.push(updated);
    }
  }

  return {
    count: results.length,
    message: "Multiple posters reassigned successfully",
  };
};

const get_unassigned_files = async (eventId: string) => {
  // ✅ get assigned attachment ids
  const assignedIds = await poster_assign_model.distinct("attachmentId", {
    eventId: new Types.ObjectId(eventId),
  });

  // ✅ O(1) lookup
  const assignedSet = new Set(assignedIds.map((id) => id.toString()));

  // ✅ fetch posters + populate author
  const posters = await poster_model
    .find(
      { eventId: new Types.ObjectId(eventId) },
      {
        title: 1,
        authorId: 1,
        attachments: 1,
        createdAt: 1,
      },
    )
    .populate({
      path: "authorId",
      select: "email",
    })
    .lean();

  // ✅ process data
  const result = posters
    .map((poster) => {
      const unassignedAttachments = poster.attachments.filter(
        (att: any) => !assignedSet.has(att._id.toString()),
      );

      if (!unassignedAttachments.length) return null;

      // ✅ safe cast (because union type)
      const author = poster.authorId as {
        _id: Types.ObjectId;
        email: string;
      };

      return {
        posterId: poster._id,
        title: poster.title,

        author: {
          _id: author?._id,
          email: author?.email || "",
        },

        attachments: unassignedAttachments,
        createdAt: poster.createdAt,
      };
    })
    .filter(Boolean);

  return result;
};
// const get_unassigned_files = async (eventId: any) => {
//   const assignedIds = await poster_assign_model.distinct("attachmentId", {
//     eventId: new Types.ObjectId(eventId),
//   });

//   const posters = await poster_model
//     .find(
//       { eventId: new Types.ObjectId(eventId) },
//       {
//         title: 1,
//         authorId: 1,
//         attachments: 1,
//         createdAt: 1,
//       },
//     )
//     .populate({
//       path: "authorId",
//       select: "name",
//     })
//     .lean();

//   return posters
//     .map((poster) => {
//       const unassignedAttachments = poster.attachments.filter(
//         (att: any) =>
//           !assignedIds.some((id: any) => id.toString() === att._id.toString()),
//       );

//       if (!unassignedAttachments.length) return null;

//       return {
//         posterId: poster._id,
//         title: poster.title,
//         authorId: poster.authorId,
//         attachments: unassignedAttachments,
//         createdAt: poster.createdAt,
//       };
//     })
//     .filter(Boolean);
// };

const get_assigned_files = async (eventId: any, type: "pdf" | "image") => {
  const assigns = await poster_assign_model
    .find({ eventId: new Types.ObjectId(eventId) })
    .sort({ createdAt: -1 })
    .lean();

  if (!assigns.length) return [];

  const posterIds = assigns.map((a) => a.posterId);
  const reviewerIds = assigns.map((a) => a.reviewerId);

  const posters = await poster_model
    .find(
      { _id: { $in: posterIds } },
      { title: 1, authorId: 1, attachments: 1 },
    )
    .lean();

  const posterMap = new Map(posters.map((p) => [p._id.toString(), p]));

  const authorIds = posters.map((p) => p.authorId);

  const profiles = await UserProfile_Model.find({
    accountId: { $in: [...authorIds, ...reviewerIds] },
  })
    .select("accountId name avatar")
    .lean();

  const profileMap = new Map(profiles.map((p) => [p.accountId.toString(), p]));

  return assigns
    .map((assign) => {
      const poster = posterMap.get(assign.posterId.toString());
      if (!poster) return null;

      const attachment = poster.attachments.find(
        (a: any) =>
          a._id.toString() === assign.attachmentId.toString() &&
          a.type === type,
      );

      if (!attachment) return null;

      /* -----------------------
         SCORE CALCULATION
      ----------------------- */
      let averageScore: number | null = null;

      if (
        attachment.reviewScore &&
        typeof attachment.reviewScore === "object"
      ) {
        const numericScores = Object.values(attachment.reviewScore).filter(
          (v) => typeof v === "number",
        );

        if (numericScores.length) {
          averageScore = Number(
            (
              numericScores.reduce((sum, v) => sum + v, 0) /
              numericScores.length
            ).toFixed(2),
          );
        }
      }

      /* -----------------------
         STATUS RESOLUTION
      ----------------------- */
      const status = assign.status === "assigned" ? "assigned" : "completed";

      const reviewStatus = attachment.reviewStatus;

      return {
        assignmentId: assign._id,
        posterId: poster._id,
        attachmentId: attachment._id,

        title: poster.title,

        author: profileMap.get(poster.authorId.toString()) || null,
        reviewer: profileMap.get(assign.reviewerId.toString()) || null,

        dueDate: assign.dueDate,

        status,
        reviewReason: attachment.reviewReason || null,

        file: {
          url: attachment.url,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          reviewStatus,
          score: averageScore,
        },

        createdAt: assign.createdAt,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const scoreA = a.file.score;
      const scoreB = b.file.score;

      if (scoreA === null && scoreB === null) return 0;
      if (scoreA === null) return 1; // null নিচে যাবে
      if (scoreB === null) return -1;

      return scoreB - scoreA; // বেশি score আগে
    });
};

/* REPORTED FILES */
const get_reported_files = async (eventId: any) => {
  const eventObjectId = new Types.ObjectId(eventId);

  const posters = await poster_model
    .find(
      {
        eventId: eventObjectId,
        "attachments.reviewStatus": {
          $in: ["rejected", "revised", "flagged"],
        },
      },
      {
        title: 1,
        authorId: 1,
        attachments: 1,
      },
    )
    .lean();

  const results: any[] = [];

  for (const poster of posters) {
    const author = await UserProfile_Model.findOne(
      { accountId: poster.authorId },
      { name: 1 },
    ).lean();

    for (const attachment of poster.attachments) {
      if (
        !["rejected", "revised", "flagged"].includes(attachment.reviewStatus)
      ) {
        continue;
      }

      const assign = await poster_assign_model
        .findOne(
          {
            posterId: poster._id,
            attachmentId: attachment._id,
          },
          {
            reviewerId: 1,
            reason: 1,
            dueDate: 1,
          },
        )
        .lean();

      const reviewer = assign
        ? await UserProfile_Model.findOne(
            { accountId: assign.reviewerId },
            { name: 1 },
          ).lean()
        : null;

      results.push({
        posterId: poster._id,
        attachmentId: attachment._id,
        fileType: attachment.type,
        title: attachment.name,
        reviewType: attachment.reviewStatus,
        reason: attachment.reviewReason,

        dueDate: assign?.dueDate || null,

        author: {
          author,
        },

        reviewer: {
          reviewer: assign?.reviewerId,
          name: reviewer?.name || "",
        },
      });
    }
  }

  return results;
};

const get_reviewer_stats = async (eventId: string) => {
  return poster_assign_model.aggregate([
    {
      $match: {
        eventId: new Types.ObjectId(eventId),
      },
    },

    {
      $lookup: {
        from: "posters",
        localField: "posterId",
        foreignField: "_id",
        as: "poster",
      },
    },
    {
      $unwind: {
        path: "$poster",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $addFields: {
        attachment: {
          $first: {
            $filter: {
              input: { $ifNull: ["$poster.attachments", []] },
              as: "a",
              cond: { $eq: ["$$a._id", "$attachmentId"] },
            },
          },
        },
      },
    },

    {
      $addFields: {
        numericScores: {
          $cond: [
            {
              $and: [
                { $eq: ["$status", "completed"] },
                { $ne: ["$attachment.reviewScore", null] },
              ],
            },
            {
              $map: {
                input: {
                  $filter: {
                    input: {
                      $objectToArray: {
                        $ifNull: ["$attachment.reviewScore", {}],
                      },
                    },
                    as: "kv",
                    cond: {
                      $in: [
                        { $type: "$$kv.v" },
                        ["int", "long", "double", "decimal"],
                      ],
                    },
                  },
                },
                as: "item",
                in: "$$item.v",
              },
            },
            [],
          ],
        },
      },
    },

    {
      $group: {
        _id: "$reviewerId",
        assigned: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
        allScores: {
          $push: { $ifNull: ["$numericScores", []] },
        },
      },
    },

    {
      $addFields: {
        flatScores: {
          $reduce: {
            input: { $ifNull: ["$allScores", []] },
            initialValue: [],
            in: {
              $concatArrays: ["$$value", { $ifNull: ["$$this", []] }],
            },
          },
        },
      },
    },

    {
      $addFields: {
        scoreCount: { $size: "$flatScores" },
        avgScore: {
          $cond: [
            { $eq: [{ $size: "$flatScores" }, 0] },
            null,
            { $round: [{ $avg: "$flatScores" }, 2] },
          ],
        },
      },
    },

    {
      $addFields: {
        progress: {
          $cond: [
            { $eq: ["$assigned", 0] },
            0,
            {
              $round: [
                {
                  $multiply: [{ $divide: ["$completed", "$assigned"] }, 100],
                },
                0,
              ],
            },
          ],
        },
      },
    },

    {
      $lookup: {
        from: "user_profiles",
        localField: "_id",
        foreignField: "accountId",
        as: "profile",
      },
    },
    {
      $unwind: {
        path: "$profile",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "accounts",
        localField: "_id",
        foreignField: "_id",
        as: "account",
      },
    },
    {
      $unwind: {
        path: "$account",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        reviewerId: "$_id",
        name: "$profile.name",
        avatar: "$profile.avatar",
        email: "$account.email",
        assigned: 1,
        completed: 1,
        progress: 1,
        avgScore: 1,
        _id: 0,
      },
    },

    {
      $sort: {
        avgScore: -1,
        completed: -1,
      },
    },
  ]);
};

const get_all_reviewers_by_event = async (
  eventId: any,
  search: string = "",
) => {
  const eventObjectId = new Types.ObjectId(eventId);

  // 1. Get eligible IDs from Event participants
  const event = await Event_Model.findById(eventId)
    .select("participants")
    .lean();

  const reviewerRoles = [
    "ABSTRACT_REVIEWER",
    "TRACK_CHAIR"
  ];

  const participantIds = (event?.participants || [])
    .filter((p: any) => p.accountId && reviewerRoles.includes(p.role))
    .map((p: any) => p.accountId.toString());

  // 2. Get IDs from existing assignments (to ensure we catch everyone)
  const assignedReviewerIds = await poster_assign_model.distinct("reviewerId", {
    eventId: eventObjectId,
  });

  const allEligibleIds = Array.from(
    new Set([
      ...participantIds,
      ...assignedReviewerIds.map((id) => id.toString()),
    ]),
  );

  if (!allEligibleIds.length) return [];

  const uniqueAccountIds = allEligibleIds.map((id) => new Types.ObjectId(id));

  let matchedAccountIds = uniqueAccountIds;

  if (search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };

    const [profiles, accounts] = await Promise.all([
      UserProfile_Model.find({
        accountId: { $in: uniqueAccountIds },
        name: searchRegex,
      })
        .select("accountId")
        .lean(),
      Account_Model.find({
        _id: { $in: uniqueAccountIds },
        email: searchRegex,
      })
        .select("_id")
        .lean(),
    ]);

    const filteredIds = new Set([
      ...profiles.map((p) => p.accountId.toString()),
      ...accounts.map((a) => a._id.toString()),
    ]);

    matchedAccountIds = Array.from(filteredIds).map(
      (id) => new Types.ObjectId(id),
    );
  }

  if (!matchedAccountIds.length) return [];

  // 3. Fetch final profile/account data
  const [finalProfiles, finalAccounts] = await Promise.all([
    UserProfile_Model.find({ accountId: { $in: matchedAccountIds } })
      .select("accountId name avatar")
      .lean(),
    Account_Model.find({ _id: { $in: matchedAccountIds } })
      .select("email")
      .lean(),
  ]);

  // 4. Fetch Stats (mirrored from reviewer-stats logic)
  const stats = await poster_assign_model.aggregate([
    {
      $match: {
        eventId: eventObjectId,
        reviewerId: { $in: matchedAccountIds },
      },
    },
    {
      $lookup: {
        from: "posters",
        localField: "posterId",
        foreignField: "_id",
        as: "poster",
      },
    },
    {
      $unwind: { path: "$poster", preserveNullAndEmptyArrays: false },
    },
    {
      $addFields: {
        attachment: {
          $first: {
            $filter: {
              input: { $ifNull: ["$poster.attachments", []] },
              as: "a",
              cond: { $eq: ["$$a._id", "$attachmentId"] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        numericScores: {
          $cond: [
            {
              $and: [
                { $eq: ["$status", "completed"] },
                { $ne: ["$attachment.reviewScore", null] },
              ],
            },
            {
              $map: {
                input: {
                  $filter: {
                    input: {
                      $objectToArray: {
                        $ifNull: ["$attachment.reviewScore", {}],
                      },
                    },
                    as: "kv",
                    cond: {
                      $in: [
                        { $type: "$$kv.v" },
                        ["int", "long", "double", "decimal"],
                      ],
                    },
                  },
                },
                as: "item",
                in: "$$item.v",
              },
            },
            [],
          ],
        },
      },
    },
    {
      $group: {
        _id: "$reviewerId",
        assigned: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        allScores: { $push: { $ifNull: ["$numericScores", []] } },
      },
    },
    {
      $addFields: {
        flatScores: {
          $reduce: {
            input: { $ifNull: ["$allScores", []] },
            initialValue: [],
            in: { $concatArrays: ["$$value", { $ifNull: ["$$this", []] }] },
          },
        },
      },
    },
    {
      $addFields: {
        avgScore: {
          $cond: [
            { $eq: [{ $size: "$flatScores" }, 0] },
            null,
            { $round: [{ $avg: "$flatScores" }, 2] },
          ],
        },
      },
    },
  ]);

  const profileMap = new Map(
    finalProfiles.map((p) => [p.accountId.toString(), p]),
  );
  const accountMap = new Map(
    finalAccounts.map((a) => [a._id.toString(), a.email]),
  );
  const statsMap = new Map(stats.map((s) => [s._id.toString(), s]));

  return matchedAccountIds.map((id) => {
    const userId = id.toString();
    const profile = profileMap.get(userId);
    const email = accountMap.get(userId);
    const userStats = statsMap.get(userId) || {
      assigned: 0,
      completed: 0,
      avgScore: null,
    };

    const assigned = userStats.assigned || 0;
    const completed = userStats.completed || 0;

    return {
      reviewerId: userId,
      name: profile?.name || "Anonymous",
      email: email || "N/A",
      avatar: profile?.avatar || "",
      stats: {
        assigned,
        completed,
        pending: assigned - completed,
        avgScore: userStats.avgScore,
        progress: assigned === 0 ? 0 : Math.round((completed / assigned) * 100),
      },
    };
  });
};
const search_unassigned_files_for_assign = async (params: {
  eventId: any;
  search?: string;
  type?: "pdf" | "image";
}) => {
  const { eventId, search = "", type } = params;

  const assignedIds = await poster_assign_model.distinct("attachmentId", {
    eventId: new Types.ObjectId(eventId),
  });

  const posters = await poster_model
    .find(
      {
        eventId: new Types.ObjectId(eventId),
        title: { $regex: search, $options: "i" },
      },
      { title: 1, authorId: 1, attachments: 1, createdAt: 1 },
    )
    .lean();

  return posters.flatMap((poster) =>
    poster.attachments
      .filter((att: any) => {
        if (type && att.type !== type) return false;

        return !assignedIds.some(
          (id: any) => id.toString() === att._id.toString(),
        );
      })
      .map((att: any) => ({
        posterId: poster._id,
        attachmentId: att._id,

        title: poster.title,
        authorId: poster.authorId,

        file: {
          type: att.type,
          name: att.name,
          size: att.size,
          url: att.url,
        },

        createdAt: poster.createdAt,
      })),
  );
};

const get_assigned_abstracts_by_reviewer_test = async (reviewerId: string) => {
  const reviewerObjectId = new Types.ObjectId(reviewerId);

  return await poster_assign_model.aggregate([
    {
      $match: {
        reviewerId: reviewerObjectId,
        status: "assigned",
      },
    },
    {
      $lookup: {
        from: "poster_attachments",
        localField: "attachmentId",
        foreignField: "_id",
        as: "attachment",
      },
    },
    { $unwind: "$attachment" },
    {
      $match: {
        "attachment.type": "PDF",
      },
    },
    {
      $project: {
        _id: 0,
        attachmentId: "$attachment._id",
        title: "$attachment.title",
        reviewStatus: "$attachment.reviewStatus",
        assignedAt: "$createdAt",
        dueDate: "$dueDate",
      },
    },
  ]);
};

// send remainder using mail
const send_review_reminder_into_db = async (assignmentId: any) => {
  // 1️⃣ assignment
  const assign = await poster_assign_model
    .findById(new Types.ObjectId(assignmentId))
    .lean();

  if (!assign) {
    throw new Error("Assignment not found");
  }

  // 2️⃣ attachment status check
  const poster = await poster_model
    .findOne(
      {
        _id: assign.posterId,
        "attachments._id": assign.attachmentId,
      },
      {
        attachments: { $elemMatch: { _id: assign.attachmentId } },
      },
    )
    .lean();

  if (!poster?.attachments?.length) {
    throw new Error("Attachment not found");
  }

  const attachment = poster.attachments[0];

  // if (attachment.reviewStatus !== "assigned") {
  //   throw new Error("Reminder can be sent only for pending reviews");
  // }

  // 3️⃣ reviewer email
  const reviewer = await Account_Model.findById(assign.reviewerId)
    .select("email")
    .lean();

  if (!reviewer?.email) {
    throw new Error("Reviewer email not found");
  }

  console.log(reviewer.email);

  // 4️⃣ send mail
  await sendMail({
    to: reviewer.email,
    subject: "Review Reminder",
    textBody: `
You have a pending review.

File: ${attachment.name}
Due Date: ${assign.dueDate ?? "N/A"}

    `,
    htmlBody: `
      <p>Please complete the review.</p>
    `,
  });
  return { assignmentId };
};

const get_top_posters_into_db = async (eventId: string, limit: number) => {
  const posters = await poster_model
    .find({
      eventId: new Types.ObjectId(eventId),
      "attachments.reviewScore": { $exists: true },
    })
    .lean();

  const results = posters.map((poster) => {
    // Calculate rating as average of all numeric sub-scores in any attachment
    let maxRating = 0;
    poster.attachments.forEach((att: any) => {
      if (att.reviewScore) {
        const scores = [
          att.reviewScore.originality,
          att.reviewScore.scientificRigor,
          att.reviewScore.clarity,
          att.reviewScore.visualDesign,
          att.reviewScore.impact,
          att.reviewScore.presentation,
        ].filter((s) => typeof s === "number");

        if (scores.length > 0) {
          const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
          if (avg > maxRating) maxRating = avg;
        }
      }
    });

    return {
      _id: poster._id,
      title: poster.title,
      authorId: poster.authorId,
      rating: Number(maxRating.toFixed(1)),
    };
  });

  // Sort by rating descending and limit
  const topPosters = results
    .sort((a, b) => b.rating - a.rating)
    .slice(0, Number(limit) || 3);

  // Populate author names
  const finalData = await Promise.all(
    topPosters.map(async (p) => {
      const profile = await UserProfile_Model.findOne({
        accountId: p.authorId,
      })
        .select("name")
        .lean();
      return {
        _id: p._id,
        title: p.title,
        authorName: profile?.name || "Unknown Author",
        rating: p.rating,
      };
    }),
  );

  return finalData;
};

export const poster_assign_service = {
  create_new_poster_assign_into_db,
  reassign_poster_to_reviewer_into_db,
  get_unassigned_files,
  get_assigned_files,
  get_reported_files,
  // submit_review,
  get_reviewer_stats,
  get_all_reviewers_by_event,
  search_unassigned_files_for_assign,
  get_assigned_abstracts_by_reviewer_test,

  send_review_reminder_into_db,
  get_top_posters_into_db,
};

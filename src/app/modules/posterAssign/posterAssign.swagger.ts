export const posterAssignSwaggerDocs = {
  "/api/v1/poster-assign/create/{eventId}": {
    post: {
      tags: ["Poster Assign"],
      summary: "Assign poster to reviewer",
      description: "Assign a poster submission to a reviewer for evaluation.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { posterId: { type: "string" }, reviewerId: { type: "string" } } } } },
      },
      responses: { 201: { description: "Poster assigned successfully" }, 400: { description: "Validation error" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/reassign/{eventId}": {
    post: {
      tags: ["Poster Assign"],
      summary: "Reassign poster",
      description: "Reassign a poster to a different reviewer.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", properties: { assignmentId: { type: "string" }, newReviewerId: { type: "string" } } } } },
      },
      responses: { 200: { description: "Poster reassigned successfully" }, 400: { description: "Validation error" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/unassigned/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get unassigned posters",
      description: "Get all poster submissions that haven't been assigned to reviewers yet.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Unassigned posters retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/assigned/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get assigned posters",
      description: "Get all poster submissions assigned to reviewers.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Assigned posters retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/reported/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get reported posters",
      description: "Get all poster submissions that have been flagged/reported.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Reported posters retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/reviewer-stats/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get reviewer stats",
      description: "Get statistics for all reviewers in an event.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Reviewer stats retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/reviewers/search/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Search reviewers",
      description: "Search for reviewers (Abstract Reviewer, Track Chair, Speaker) to assign as reviewers.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Search results retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/reviewers/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get all reviewers",
      description: "Get all potential reviewers (Abstract Reviewer, Track Chair, Speaker) for an event.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "All reviewers retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/unassigned/search/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Search unassigned",
      description: "Search through unassigned poster submissions.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Search results retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },

  "/api/v1/poster-assign/send-reminder/{assignmentId}": {
    post: {
      tags: ["Poster Assign"],
      summary: "Send reminder",
      description: "Send a review reminder to a reviewer.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "assignmentId", in: "path", required: true, schema: { type: "string" }, description: "Assignment ID" }],
      responses: { 200: { description: "Reminder sent successfully" }, 401: { description: "Unauthorized" }, 404: { description: "Assignment not found" } },
    },
  },

  "/api/v1/poster-assign/top-posters/{eventId}": {
    get: {
      tags: ["Poster Assign"],
      summary: "Get top posters",
      description: "Get top-rated poster submissions based on reviewer scores.",
      security: [{ AuthorizationToken: [] }],
      parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" }, description: "Event ID" }],
      responses: { 200: { description: "Top posters retrieved successfully" }, 401: { description: "Unauthorized" } },
    },
  },
};

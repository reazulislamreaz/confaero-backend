export const boothSwaggerDocs = {
  "/api/v1/booth/create": {
    post: {
      tags: ["Booth"],
      summary: "Create booth",
      description: "Create a new exhibition booth for an event.",
      security: [{ AuthorizationToken: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                eventId: { type: "string" },
                companyName: { type: "string" },
                description: { type: "string" },
                websiteUrl: { type: "string" },
                publicEmail: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Booth created successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/booth/me/{eventId}": {
    get: {
      tags: ["Booth"],
      summary: "Get my booth",
      description: "Get the booth owned by the authenticated exhibitor/staff for a specific event.",
      security: [{ AuthorizationToken: [] }],
      parameters: [
        {
          name: "eventId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Booth retrieved successfully" },
        401: { description: "Unauthorized" },
        404: { description: "Booth not found" },
      },
    },
    patch: {
      tags: ["Booth"],
      summary: "Update booth",
      description: "Update the exhibitor's booth details.",
      security: [{ AuthorizationToken: [] }],
      parameters: [
        {
          name: "eventId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                description: { type: "string" },
                offerTitle: { type: "string" },
                boothOpening: { type: "string" },
                websiteUrl: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Booth updated successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/booth/staff/{eventId}": {
    post: {
      tags: ["Booth"],
      summary: "Add booth staff",
      description: "Add staff members to a booth by email for a specific event.",
      security: [{ AuthorizationToken: [] }],
      parameters: [
        {
          name: "eventId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { email: { type: "string", format: "email" } },
            },
          },
        },
      },
      responses: {
        200: { description: "Staff added successfully" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
      },
    },
    get: {
      tags: ["Booth"],
      summary: "Get booth staff list",
      description: "Get all staff members assigned to the booth for a specific event.",
      security: [{ AuthorizationToken: [] }],
      parameters: [
        {
          name: "eventId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Staff list retrieved successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },
};

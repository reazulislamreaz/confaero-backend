export const exhibitorSwaggerDocs = {
  "/api/v1/exhibitor/performance/{eventId}": {
    get: {
      tags: ["Exhibitor"],
      summary: "Get exhibitor performance analytics",
      description: "Retrieve total scans, traffic over time, and recent leads for an exhibitor.",
      security: [{ AuthorizationToken: [] }],
      parameters: [
        {
          name: "eventId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Event ID",
        },
        {
          name: "interval",
          in: "query",
          required: false,
          schema: { 
            type: "string",
            enum: ["daily", "weekly"],
            default: "daily"
          },
          description: "Time interval for traffic data",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { 
            type: "integer",
            default: 5
          },
          description: "Limit for recent leads list",
        },
      ],
      responses: {
        200: {
          description: "Performance analytics retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Exhibitor performance analytics retrieved successfully" },
                  data: {
                    type: "object",
                    properties: {
                      totalScans: { type: "integer", example: 150 },
                      trafficOverTime: {
                        type: "object",
                        properties: {
                          interval: { type: "string", example: "daily" },
                          data: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                label: { type: "string", example: "2023-10-27" },
                                scans: { type: "integer", example: 10 }
                              }
                            }
                          }
                        }
                      },
                      recentLeads: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", example: "653b8f..." },
                            name: { type: "string", example: "John Doe" },
                            designation: { type: "string", example: "Software Engineer" },
                            company: { type: "string", example: "Tech Corp" },
                            avatar: { type: "string", example: "http://...", nullable: true },
                            scannedAt: { type: "string", example: "2023-10-27T10:00:00Z" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: "Unauthorized" },
      },
    },
  },
};

export const authSwaggerDocs = {
  "/api/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Create a new user account with email, phone number, password, and name. A verification email will be sent.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "name", "password", "confirmPassword"],
              properties: {
                name: { type: "string", example: "John Doe" },
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "123456",
                },
                confirmPassword: {
                  type: "string",
                  format: "password",
                  example: "123456",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  message: {
                    type: "string",
                    example: "User registered successfully",
                  },
                  data: { type: "object" },
                },
              },
            },
          },
        },
        400: { description: "Validation error or user already exists" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login a user",
      description:
        "Authenticate user with email and password. Returns access token and refresh token (in cookie).",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "secret123",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User logged in successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  message: { type: "string", example: "Login successful" },
                  data: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      user: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Invalid credentials" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/v1/auth/google": {
    post: {
      tags: ["Auth"],
      summary: "Sign up or sign in with Google",
      description:
        "Authenticate using a Firebase ID token from the client (user.getIdToken() after Google sign-in). **Do not** paste the Firebase service-account private_key here.\n\n**Swagger testing:** open `/dev/google-token` in the browser, sign in with Google, copy the idToken, then paste it below.\n\nCreates a new account + profile if the email is new, or signs in an existing user. Returns access/refresh tokens (refresh token also set in httpOnly cookie).",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["idToken"],
              properties: {
                idToken: {
                  type: "string",
                  description:
                    "JWT with three dot-separated parts (RS256). From user.getIdToken() — NOT private_key, NOT /login accessToken.",
                  example:
                    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY29uZmFlcm8tZGMyODQifQ.example",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Signed in with Google successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Signed in with Google successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      accessToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      },
                      refreshToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      },
                      activeRole: {
                        type: "string",
                        example: "ATTENDEE",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Google account did not provide an email address",
        },
        401: {
          description: "Invalid or expired Firebase ID token",
        },
        409: {
          description:
            "Email is already linked to a different Google account",
        },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/v1/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get logged-in user's profile",
      description:
        "Fetch the authenticated user's profile details including active role and permissions.",
      security: [{ AuthorizationToken: [] }],
      responses: {
        200: {
          description: "Profile data retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: { type: "object" },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Invalid or missing token" },
        403: { description: "Forbidden - Account suspended or inactive" },
      },
    },
  },

  "/api/v1/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Refresh JWT token",
      description:
        "Refresh the access token using a valid refresh token stored in HTTP-only cookie.",
      responses: {
        200: {
          description: "Token refreshed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Invalid or expired refresh token" },
      },
    },
  },

  "/api/v1/auth/change-password": {
    post: {
      tags: ["Auth"],
      summary: "Change password",
      description: "Change the authenticated user's password.",
      security: [{ AuthorizationToken: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["oldPassword", "newPassword"],
              properties: {
                oldPassword: {
                  type: "string",
                  format: "password",
                  example: "oldPass123",
                },
                newPassword: {
                  type: "string",
                  format: "password",
                  example: "newPass456",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password changed successfully" },
        400: { description: "Invalid old password or validation error" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request password reset",
      description: "Send a password reset OTP to the user's email address.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password reset OTP sent to email" },
        404: { description: "User not found" },
      },
    },
  },

  "/api/v1/auth/verify-reset-code": {
    post: {
      tags: ["Auth"],
      summary: "Verify password reset OTP",
      description:
        "Verify the OTP code sent to user's email for password reset.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "code"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
                code: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "OTP verified successfully" },
        400: { description: "Invalid or expired OTP" },
      },
    },
  },

  "/api/v1/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password using token",
      description: "Reset the user's password using a valid reset token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["token", "email", "newPassword", "confirmPassword"],
              properties: {
                token: { type: "string", example: "eyJhbGciOiJIUz..." },
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
                newPassword: {
                  type: "string",
                  format: "password",
                  example: "123456",
                },
                confirmPassword: {
                  type: "string",
                  format: "password",
                  example: "123456  ",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Password reset successfully" },
        400: { description: "Invalid or expired token" },
      },
    },
  },

  "/api/v1/auth/verified-account": {
    post: {
      tags: ["Auth"],
      summary: "Verify account using 6-digit code",
      description: "Verify a user's email account using a 6-digit verification code sent to their email.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "code"],
              properties: {
                email: { type: "string", format: "email", example: "user@example.com" },
                code: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Account verified successfully" },
        400: { description: "Invalid or expired code" },
      },
    },
  },

  "/api/v1/auth/new-verification-link": {
    post: {
      tags: ["Auth"],
      summary: "Request a new verification code",
      description: "Send a new 6-digit verification code to the user's email address.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Verification code resent successfully" },
        404: { description: "User not found or already verified" },
      },
    },
  },

  "/api/v1/auth/delete-account": {
    delete: {
      tags: ["Auth"],
      summary: "Delete user account",
      description:
        "Permanently delete the authenticated user's account. This action cannot be undone.",
      security: [{ AuthorizationToken: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword"],
              properties: {
                currentPassword: {
                  type: "string",
                  format: "password",
                  example: "myCurrentPass123",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Account deleted successfully" },
        400: { description: "Validation error or incorrect password" },
        401: { description: "Unauthorized" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/v1/auth/change-role": {
    post: {
      tags: ["Auth"],
      summary: "Switch active role",
      description:
        "Change the user's active role for role-based access control.",
      security: [{ AuthorizationToken: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["role"],
              properties: {
                role: {
                  type: "string",
                  enum: [
                    "ATTENDEE",
                    "SPEAKER",
                    "EXHIBITOR",
                    "STAFF",
                    "SPONSOR",
                    "VOLUNTEER",
                    "ABSTRACT_REVIEWER",
                    "TRACK_CHAIR",
                  ],
                  example: "SPEAKER",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Role changed successfully" },
        400: { description: "Invalid role or user doesn't have this role" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/auth/my-roles": {
    get: {
      tags: ["Auth"],
      summary: "Get all user roles",
      description: "Get all roles assigned to the authenticated user.",
      security: [{ AuthorizationToken: [] }],
      responses: {
        200: {
          description: "User roles retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  data: {
                    type: "array",
                    items: { type: "string" },
                    example: ["ATTENDEE", "SPEAKER"],
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/auth/notification": {
    patch: {
      tags: ["Auth"],
      summary: "Toggle email notifications",
      description:
        "Enable or disable email notifications for the authenticated user.",
      security: [{ AuthorizationToken: [] }],
      responses: {
        200: { description: "Notification preference updated successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },
};

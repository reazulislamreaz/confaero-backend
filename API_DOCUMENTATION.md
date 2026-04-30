# Confaero Backend API  Documentation

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Server:** Node.js + Express + TypeScript  
**Database:** MongoDB (Mongoose)  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Authentication System](#2-authentication-system)
3. [API List](#3-api-list)
4. [Module-wise API Documentation](#4-module-wise-api-documentation)
5. [API Flow Explanation](#5-api-flow-explanation)
6. [Database Models Summary](#6-database-models-summary)
7. [Integration Guide for Frontend Developers](#7-integration-guide-for-frontend-developers)
8. [Final API Summary Table](#8-final-api-summary-table)

---

## 1. Project Overview

**Confaero** is a comprehensive conference and event management platform that enables organizers to create, manage, and run events while providing attendees, speakers, exhibitors, sponsors, volunteers, and reviewers with a seamless experience.

### Main Modules/Features

| Module | Description |
|--------|-------------|
| **Auth** | User registration, login, password management, role switching |
| **User** | Profile management, resume upload |
| **Super Admin** | Platform-level management (organizers, events, users) |
| **Organizer** | Event creation, session management, attendee management |
| **Attendee** | Event registration, agenda, networking |
| **Invitation** | Role-based invitations (Speaker, Exhibitor, Volunteer, etc.) |
| **Message** | Real-time chat between users |
| **Message Organizer** | Organizer chat dashboard |
| **Connection** | Networking connections between attendees |
| **Booth** | Virtual booth management for exhibitors |
| **Sponsor** | Sponsor profile and management |
| **Poster** | Academic poster submission and review |
| **Poster Assign** | Assign posters to reviewers |
| **Reviewer** | Review poster/abstract submissions |
| **Document** | Document upload and approval |
| **Photo** | Event photo gallery |
| **Announcement** | Event announcements |
| **Resource** | QnA, Polls, Surveys |
| **Note** | Personal notes |
| **QR** | QR code generation/scanning for check-in and leads |
| **Volunteer** | Task assignment and management |
| **Report** | Task issue reporting |
| **Job** | Job board for events |
| **Event Live** | Live session management |
| **App Content** | Static app content management |
| **Verify Email** | Email verification for events |
| **Event Attendee** | Attendee browsing and bookmarking |

### User Roles

- **SUPER_ADMIN** - Platform administrator
- **ORGANIZER** - Event creator/manager
- **ATTENDEE** - Event participant
- **SPEAKER** - Session presenter
- **EXHIBITOR** - Booth owner
- **STAFF** - Event staff (supports exhibitor)
- **SPONSOR** - Event sponsor
- **VOLUNTEER** - Event volunteer
- **ABSTRACT_REVIEWER** - Reviews poster/abstract submissions
- **TRACK_CHAIR** - Manages session tracks

---

## 2. Authentication System

### Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Register  │────▶│ Verify Email │────▶│    Login    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                    ┌────────────────────────────┘
                    ▼
         ┌─────────────────────┐
         │  Access Token +     │
         │  Refresh Token      │
         └─────────────────────┘
```

### Token System

| Token Type | Expiry | Storage | Usage |
|------------|--------|---------|-------|
| **Access Token** | Configurable | Frontend (memory/localStorage) | API authorization (Bearer token) |
| **Refresh Token** | Configurable | HTTP-only cookie | Generate new access token |
| **Reset Token** | 10 minutes | Email code | Password reset |
| **Verification Code** | 10 minutes | Email code | Email verification |

### Authentication Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/auth/register` | POST | Register new account | Public |
| `/auth/login` | POST | Login with email/password | Public |
| `/auth/refresh-token` | POST | Refresh access token | Public (cookie) |
| `/auth/me` | GET | Get current user profile | Authenticated |
| `/auth/change-password` | POST | Change password | Authenticated |
| `/auth/forgot-password` | POST | Request password reset | Public |
| `/auth/verify-reset-code` | POST | Verify OTP code | Public |
| `/auth/reset-password` | POST | Reset password with token | Public |
| `/auth/verified-account` | POST | Verify email account | Public |
| `/auth/new-verification-link` | POST | Resend verification code | Public |
| `/auth/delete-account` | DELETE | Delete user account | Authenticated |
| `/auth/change-role` | POST | Switch active role | Authenticated |
| `/auth/my-roles` | GET | Get all user roles | Authenticated |
| `/auth/notification` | PATCH | Toggle email notifications | Authenticated |

### Authorization Header Format

```
Authorization: Bearer <access_token>
```

### Role-Based Access Control

All protected routes use the `auth()` middleware which:
1. Validates the Bearer token
2. Checks if the user's active role is allowed
3. Verifies account status (ACTIVE, not SUSPENDED, not DELETED)

---

## 3. API List

### 3.1 Auth Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/auth/register` | Register new user | Public |
| 2 | POST | `/auth/login` | Login user | Public |
| 3 | GET | `/auth/me` | Get my profile | All authenticated |
| 4 | POST | `/auth/refresh-token` | Refresh access token | Public (cookie) |
| 5 | POST | `/auth/change-password` | Change password | All authenticated |
| 6 | POST | `/auth/forgot-password` | Request password reset | Public |
| 7 | POST | `/auth/verify-reset-code` | Verify reset OTP | Public |
| 8 | POST | `/auth/reset-password` | Reset password | Public |
| 9 | POST | `/auth/verified-account` | Verify email | Public |
| 10 | POST | `/auth/new-verification-link` | Resend verification | Public |
| 11 | DELETE | `/auth/delete-account` | Delete account | All authenticated |
| 12 | POST | `/auth/change-role` | Switch role | All authenticated |
| 13 | GET | `/auth/my-roles` | Get roles | All authenticated |
| 14 | PATCH | `/auth/notification` | Toggle notifications | All authenticated |

### 3.2 User Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | PATCH | `/user/update-profile` | Update user profile | All authenticated |
| 2 | PATCH | `/user/update-profile/organizer` | Update organizer profile | ORGANIZER, SUPER_ADMIN |
| 3 | DELETE | `/user/delete-resume` | Delete resume | All authenticated |
| 4 | GET | `/user/my-profile` | Get my profile | All authenticated |
| 5 | GET | `/user/my-profile/organizer` | Get organizer profile | ORGANIZER, SUPER_ADMIN |

### 3.3 Super Admin Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/superAdmin/create/organizer` | Create organizer | SUPER_ADMIN |
| 2 | GET | `/superAdmin/organizers` | Get all organizers | SUPER_ADMIN |
| 3 | GET | `/superAdmin/organizers/:id` | Get specific organizer | SUPER_ADMIN |
| 4 | POST | `/superAdmin/create/event` | Create event | SUPER_ADMIN |
| 5 | GET | `/superAdmin/organizers/:id/events` | Get organizer events | SUPER_ADMIN |
| 6 | GET | `/superAdmin/events` | Get all events | Public |
| 7 | GET | `/superAdmin/events/:eventId` | Get event details | Public |
| 8 | PATCH | `/superAdmin/events/:eventId` | Update event | SUPER_ADMIN |
| 9 | DELETE | `/superAdmin/events/:eventId` | Delete event | SUPER_ADMIN |
| 10 | GET | `/superAdmin/organizers/:organizerId/events/:eventId` | Get specific event | SUPER_ADMIN |
| 11 | GET | `/superAdmin/users` | Get all users | SUPER_ADMIN |
| 12 | GET | `/superAdmin/users/:userId` | Get user details | SUPER_ADMIN |
| 13 | DELETE | `/superAdmin/users/:userId` | Delete user | SUPER_ADMIN |
| 14 | GET | `/superAdmin/singleEvent/:eventId/overview` | Get event overview | SUPER_ADMIN, ORGANIZER |
| 15 | GET | `/superAdmin/dashboard/overview` | Get dashboard overview | SUPER_ADMIN |
| 16 | GET | `/superAdmin/events-trend` | Get events trend | SUPER_ADMIN |
| 17 | GET | `/organizer/stripe/status` | Get Stripe status | ORGANIZER, SUPER_ADMIN |
| 18 | POST | `/organizer/stripe/connect` | Connect Stripe | ORGANIZER, SUPER_ADMIN |
| 19 | GET | `/organizer/stripe/onboarding-link` | Get Stripe onboarding link | ORGANIZER, SUPER_ADMIN |

### 3.4 Organizer Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/organizer/events` | Get my events | ORGANIZER, SUPER_ADMIN |
| 2 | GET | `/organizer/all-register/:eventId` | Get all registered users | ORGANIZER, SUPER_ADMIN |
| 3 | PATCH | `/organizer/events/:eventId` | Update event | ORGANIZER, SUPER_ADMIN |
| 4 | GET | `/organizer/events/:eventId/floormaps` | Get floor maps | All authenticated |
| 5 | DELETE | `/organizer/events/:eventId/floormaps/:floorMapId` | Delete floor map | ORGANIZER, SUPER_ADMIN |
| 6 | DELETE | `/organizer/attendee/:eventId/:accountId` | Remove attendee | ORGANIZER, SUPER_ADMIN |
| 7 | GET | `/organizer/attendee/:eventId/:accountId` | Get attendee details | ORGANIZER, SUPER_ADMIN |

### 3.5 Attendee Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/attendee/events` | Get upcoming events | All non-organizer roles |
| 2 | POST | `/attendee/events/:eventId/initiate-registration` | Register for event | All non-organizer roles |
| 3 | GET | `/attendee/my-event` | Get my registered events | All non-organizer roles |
| 4 | GET | `/attendee/my-events/:eventId` | Get my event details | All non-organizer roles |
| 5 | GET | `/attendee/events/:eventId` | Get single event | All non-organizer roles |
| 6 | GET | `/attendee/events/:eventId/sessions` | Get event sessions | All non-organizer roles |
| 7 | GET | `/attendee/events/:eventId/home` | Get event home data | All non-organizer roles |
| 8 | GET | `/attendee/events/:eventId/qr-token` | Generate QR token | All non-organizer roles |
| 9 | PATCH | `/attendee/event/:eventId/join` | Join event | All non-organizer roles |

### 3.6 Invitation Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/invitation/create/:eventId` | Send invitation | ORGANIZER, SUPER_ADMIN |
| 2 | PATCH | `/invitation/:invitationId/accept/:eventId` | Accept invitation | All non-organizer roles |
| 3 | PATCH | `/invitation/:invitationId/reject/:eventId` | Reject invitation | All non-organizer roles |
| 4 | GET | `/invitation/my-invitations` | Get my invitations | All non-organizer roles |
| 5 | GET | `/invitation/my-invitations/:invitedId` | Get invitation details | All non-organizer roles |
| 6 | GET | `/invitation/event/:eventId` | Get event invitations | ORGANIZER, SUPER_ADMIN |
| 7 | POST | `/invitation/:invitationId/resend/:eventId` | Resend invitation | ORGANIZER, SUPER_ADMIN |
| 8 | DELETE | `/invitation/:invitationId/:eventId` | Delete invitation | ORGANIZER, SUPER_ADMIN |
| 9 | GET | `/invitation/:eventId/sessions` | Get event sessions | ORGANIZER, SUPER_ADMIN |
| 10 | POST | `/invitation/:eventId/make-speaker` | Make speaker directly | ORGANIZER, SUPER_ADMIN |

### 3.7 Message Module (User Chat)

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/message/send/:eventId` | Send message | All non-organizer roles |
| 2 | GET | `/message/conversations/:eventId` | Get conversations | All non-organizer roles |
| 3 | GET | `/message/:conversationId/:eventId` | Get messages | All non-organizer roles |
| 4 | PATCH | `/message/seen/:conversationId/:eventId` | Mark as seen | All non-organizer roles |

### 3.8 Message Organizer Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/messageOrganizer/stats/:eventId` | Get chat stats | ORGANIZER, SUPER_ADMIN |
| 2 | GET | `/messageOrganizer/conversations/:eventId` | Get conversations | ORGANIZER, SUPER_ADMIN |
| 3 | GET | `/messageOrganizer/messages/:conversationId/:eventId` | Get messages | ORGANIZER, SUPER_ADMIN |
| 4 | PATCH | `/messageOrganizer/seen/:conversationId/:eventId` | Mark as seen | ORGANIZER, SUPER_ADMIN |
| 5 | GET | `/messageOrganizer/notifications/:eventId` | Get notifications | ORGANIZER, SUPER_ADMIN |
| 6 | PATCH | `/messageOrganizer/notifications/:id/:eventId` | Mark notification read | ORGANIZER, SUPER_ADMIN |
| 7 | GET | `/messageOrganizer/presence/:userId/:eventId` | Get user presence | All authenticated |

### 3.9 Connection Module (Networking)

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/connection/request/:eventId` | Send connection request | All non-organizer roles |
| 2 | GET | `/connection/requests` | Get incoming requests | All non-organizer roles |
| 3 | PATCH | `/connection/requests/:id/accept` | Accept request | All non-organizer roles |
| 4 | GET | `/connection/` | Get connections | All non-organizer roles |
| 5 | PATCH | `/connection/:id/bookmark` | Toggle bookmark | All non-organizer roles |
| 6 | GET | `/connection/:connectionId` | Get connection details | All non-organizer roles |

### 3.10 Booth Module (Exhibitor)

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/booth/create` | Create booth | EXHIBITOR, STAFF |
| 2 | GET | `/booth/me` | Get my booth | EXHIBITOR, STAFF |
| 3 | PATCH | `/booth/me` | Update booth | EXHIBITOR, STAFF |
| 4 | POST | `/booth/staff` | Add booth staff | EXHIBITOR, STAFF |
| 5 | GET | `/booth/staff` | Get booth staff list | EXHIBITOR, STAFF |

### 3.11 Organizer Booth Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/organizerBooth/events/:eventId/booths` | Get event booths | All authenticated |
| 2 | GET | `/organizerBooth/booths/:boothId` | Get booth details | All authenticated |
| 3 | PATCH | `/organizerBooth/booths/:boothId/number` | Update booth number | ORGANIZER, SUPER_ADMIN |
| 4 | PATCH | `/organizerBooth/booths/:boothId/accept` | Accept booth | ORGANIZER, SUPER_ADMIN |
| 5 | PATCH | `/organizerBooth/booths/:boothId/cancel` | Cancel booth | ORGANIZER, SUPER_ADMIN |

### 3.12 Sponsor Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/sponsor/create` | Create sponsor profile | SPONSOR |
| 2 | GET | `/sponsor/get-my-sponsor/:eventId` | Get my sponsor profile | SPONSOR |
| 3 | PATCH | `/sponsor/update/:sponsorId` | Update sponsor profile | SPONSOR |
| 4 | PATCH | `/sponsor/view/:sponsorProfileId` | Increment profile view | All authenticated |
| 5 | GET | `/sponsor/dashboard/:eventId` | Get sponsor dashboard | SPONSOR |

### 3.13 Organizer Sponsor Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/organizerSponsor/all-sponsors/:eventId` | Get all sponsors | All authenticated |
| 2 | GET | `/organizerSponsor/sponsor/:sponsorId` | Get sponsor details | All authenticated |
| 3 | PATCH | `/organizerSponsor/:sponsorId/approve` | Approve sponsor | ORGANIZER, SUPER_ADMIN |
| 4 | PATCH | `/organizerSponsor/:sponsorId/reject` | Reject sponsor | ORGANIZER, SUPER_ADMIN |

### 3.14 Poster Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/poster/upload-file` | Upload single file | ATTENDEE, SPEAKER |
| 2 | POST | `/poster/upload-files` | Upload multiple files | All authenticated |
| 3 | POST | `/poster/create/:eventId` | Create poster | ATTENDEE, SPEAKER |
| 4 | GET | `/poster/accepted` | Get accepted posters | Public |
| 5 | GET | `/poster/revised` | Get revised posters | ATTENDEE, SPEAKER |
| 6 | PATCH | `/poster/author/attachments/:attachmentId` | Update attachment | ATTENDEE, SPEAKER |
| 7 | GET | `/poster/accepted/:posterId` | Get single poster | Public |

### 3.15 Poster Assign Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/poster-assign/create/:eventId` | Assign poster to reviewer | ORGANIZER, SUPER_ADMIN |
| 2 | POST | `/poster-assign/reassign/:eventId` | Reassign poster | ORGANIZER, SUPER_ADMIN |
| 3 | GET | `/poster-assign/unassigned/:eventId` | Get unassigned posters | ORGANIZER, SUPER_ADMIN |
| 4 | GET | `/poster-assign/assigned/:eventId` | Get assigned posters | ORGANIZER, SUPER_ADMIN |
| 5 | GET | `/poster-assign/reported/:eventId` | Get reported posters | ORGANIZER, SUPER_ADMIN |
| 6 | GET | `/poster-assign/reviewer-stats/:eventId` | Get reviewer stats | ORGANIZER, SUPER_ADMIN |
| 7 | GET | `/poster-assign/speakers/search/:eventId` | Search speakers | ORGANIZER, SUPER_ADMIN |
| 8 | GET | `/poster-assign/unassigned/search/:eventId` | Search unassigned | ORGANIZER, SUPER_ADMIN |
| 9 | POST | `/poster-assign/send-reminder/:assignmentId` | Send reminder | ORGANIZER, SUPER_ADMIN |
| 10 | GET | `/poster-assign/top-posters/:eventId` | Get top posters | ORGANIZER, SUPER_ADMIN |

### 3.16 Reviewer Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/reviewer/dashboard/:eventId` | Get reviewer dashboard | ABSTRACT_REVIEWER, TRACK_CHAIR |
| 2 | GET | `/reviewer/authors/:eventId` | Get authors | ABSTRACT_REVIEWER, TRACK_CHAIR |
| 3 | GET | `/reviewer/authors/:authorId/submissions` | Get author submissions | ABSTRACT_REVIEWER, TRACK_CHAIR |
| 4 | GET | `/reviewer/attachments/:attachmentId` | Get attachment details | ABSTRACT_REVIEWER, TRACK_CHAIR |
| 5 | PATCH | `/reviewer/attachments/:attachmentId/approve` | Approve attachment | ORGANIZER, SUPER_ADMIN, ABSTRACT_REVIEWER, TRACK_CHAIR |
| 6 | PATCH | `/reviewer/attachments/:attachmentId/reject` | Reject attachment | ORGANIZER, SUPER_ADMIN, ABSTRACT_REVIEWER, TRACK_CHAIR |
| 7 | PATCH | `/reviewer/attachments/:attachmentId/revise` | Request revision | ORGANIZER, SUPER_ADMIN, ABSTRACT_REVIEWER, TRACK_CHAIR |
| 8 | PATCH | `/reviewer/attachments/:attachmentId/flag-admin` | Flag for admin | ORGANIZER, SUPER_ADMIN, ABSTRACT_REVIEWER, TRACK_CHAIR |
| 9 | POST | `/reviewer/attachments/:attachmentId/image-review` | Review image | ORGANIZER, SUPER_ADMIN, ABSTRACT_REVIEWER, TRACK_CHAIR |

### 3.17 Document Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/document/:eventId` | Upload document | ORGANIZER, SUPER_ADMIN, SPEAKER |
| 2 | GET | `/document/:eventId/my` | Get my documents | ORGANIZER, SUPER_ADMIN, SPEAKER |
| 3 | DELETE | `/document/my/:documentId` | Delete document | ORGANIZER, SUPER_ADMIN, SPEAKER |
| 4 | GET | `/document/:eventId/pending` | Get pending documents | ORGANIZER, SUPER_ADMIN |
| 5 | GET | `/document/:eventId` | Get all documents | ORGANIZER, SUPER_ADMIN |
| 6 | GET | `/document/:eventId/details/:documentId` | Get document details | All authenticated |
| 7 | PATCH | `/document/status/:documentId` | Update document status | ORGANIZER, SUPER_ADMIN |
| 8 | GET | `/document/:eventId/all` | Get all documents (view) | Public |

### 3.18 Photo Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/photo/events/:eventId/photos` | Create photo | Public |
| 2 | GET | `/photo/events/:eventId/photos` | Get event photos | Public |
| 3 | DELETE | `/photo/photos/:photoId` | Delete photo | Public |
| 4 | GET | `/photo/public/events/:eventId/photos` | Get public photos | Public |

### 3.19 Announcement Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/announcement/:eventId` | Create announcement | ORGANIZER |
| 2 | PATCH | `/announcement/:id/:eventId` | Update announcement | ORGANIZER |
| 3 | GET | `/announcement/get-all/:eventId` | Get all announcements | ORGANIZER |
| 4 | DELETE | `/announcement/:id/:eventId` | Delete announcement | ORGANIZER |
| 5 | GET | `/announcement/event/:eventId` | Get event announcements | All non-organizer roles |
| 6 | GET | `/announcement/:id/:eventId` | Get single announcement | All authenticated |

### 3.20 Resource Module (QnA, Polls, Surveys)

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/resource/qna/:eventId` | Create QnA | ORGANIZER, SUPER_ADMIN |
| 2 | PATCH | `/resource/qna/:id/:eventId` | Update QnA | ORGANIZER, SUPER_ADMIN |
| 3 | DELETE | `/resource/qna/:id/:eventId` | Delete QnA | ORGANIZER, SUPER_ADMIN |
| 4 | POST | `/resource/poll/:eventId` | Create poll | ORGANIZER, SUPER_ADMIN |
| 5 | PATCH | `/resource/poll/:pollId/:eventId` | Update poll | ORGANIZER, SUPER_ADMIN |
| 6 | DELETE | `/resource/poll/:pollId/:eventId` | Delete poll | ORGANIZER, SUPER_ADMIN |
| 7 | GET | `/resource/poll/:pollId/:eventId/votes` | View poll votes | ORGANIZER, SUPER_ADMIN |
| 8 | POST | `/resource/poll/:pollId/:eventId/submit` | Submit poll | All non-organizer roles |
| 9 | POST | `/resource/survey/:eventId/submit` | Submit survey | All non-organizer roles |
| 10 | GET | `/resource/survey/:eventId/analytics` | Get survey analytics | ORGANIZER, SUPER_ADMIN |
| 11 | GET | `/resource/event/qna/:eventId` | Get event QnA | All authenticated |
| 12 | GET | `/resource/event/poll/:eventId` | Get event polls | All authenticated |

### 3.21 Note Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/note/create` | Create note | All authenticated |
| 2 | GET | `/note/notes` | Get my notes | All authenticated |

### 3.22 QR Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/qr/generate/:eventId` | Generate QR | All authenticated |
| 2 | POST | `/qr/scan/:eventId` | Scan QR | All authenticated |
| 3 | GET | `/qr/volunteer/:eventId` | Get check-in history | VOLUNTEER |
| 4 | GET | `/qr/exhibitor/:eventId/leads` | Get leads | EXHIBITOR, STAFF |
| 5 | PATCH | `/qr/exhibitor/leads/:leadId/note` | Update lead note | EXHIBITOR, STAFF |
| 6 | PATCH | `/qr/exhibitor/leads/:leadId/tags` | Update lead tags | EXHIBITOR, STAFF |

### 3.23 Volunteer Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/volunteer/create` | Create task | SUPER_ADMIN, ORGANIZER |
| 2 | GET | `/volunteer/my-tasks` | Get my tasks | SUPER_ADMIN, ORGANIZER, VOLUNTEER |
| 3 | GET | `/volunteer/my-task/:taskId` | Get task details | SUPER_ADMIN, ORGANIZER, VOLUNTEER |
| 4 | PATCH | `/volunteer/:taskId/complete` | Complete task | VOLUNTEER |
| 5 | GET | `/volunteer/today-progress` | Get today's progress | VOLUNTEER |
| 6 | GET | `/volunteer/:eventId/volunteer/search` | Search volunteer | SUPER_ADMIN, ORGANIZER |
| 7 | GET | `/volunteer/volunteers` | Get volunteer dashboard | SUPER_ADMIN, ORGANIZER |
| 8 | GET | `/volunteer/:reportId` | View single report | SUPER_ADMIN, ORGANIZER |

### 3.24 Report Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/report/report` | Report task issue | VOLUNTEER |

### 3.25 Job Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/job/` | Create job | ORGANIZER, SUPER_ADMIN, EXHIBITOR, STAFF, SPONSOR |
| 2 | GET | `/job/my` | Get my jobs | ORGANIZER, SUPER_ADMIN |
| 3 | GET | `/job/review` | Review jobs | ORGANIZER, SUPER_ADMIN |
| 4 | GET | `/job/` | Get public jobs | Public |
| 5 | GET | `/job/:jobId` | Get job details | Public |
| 6 | PATCH | `/job/:jobId/status` | Update job status | ORGANIZER, SUPER_ADMIN |
| 7 | PATCH | `/job/:jobId` | Update job | ORGANIZER, SUPER_ADMIN |
| 8 | DELETE | `/job/:jobId` | Delete job | ORGANIZER, SUPER_ADMIN |
| 9 | GET | `/job/my/:jobId` | Get single job | ORGANIZER, SUPER_ADMIN |

### 3.26 Event Live Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/eventLive/start/:eventid` | Start live session | SPEAKER, ATTENDEE |
| 2 | POST | `/eventLive/join/:eventid` | Join live session | SPEAKER, ATTENDEE |
| 3 | POST | `/eventLive/end/:eventid` | End live session | SPEAKER, ATTENDEE |
| 4 | GET | `/eventLive/live/:eventid` | Get live sessions | All non-organizer roles |

### 3.27 Organizer Session Module (Agenda)

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/organizer-sessions/events/:eventId/sessions` | Get sessions | ORGANIZER, SUPER_ADMIN |
| 2 | GET | `/organizer-sessions/events/:eventId/sessions/:sessionId` | Get single session | ORGANIZER, SUPER_ADMIN |
| 3 | POST | `/organizer-sessions/events/:eventId/sessions` | Add session | ORGANIZER, SUPER_ADMIN |
| 4 | PATCH | `/organizer-sessions/events/:eventId/sessions/:sessionId` | Update session | ORGANIZER, SUPER_ADMIN |
| 5 | DELETE | `/organizer-sessions/events/:eventId/sessions/:sessionId` | Delete session | ORGANIZER, SUPER_ADMIN |
| 6 | POST | `/organizer-sessions/events/:eventId/sessions/upload-csv` | Upload sessions CSV | ORGANIZER, SUPER_ADMIN |
| 7 | GET | `/organizer-sessions/events/:eventId/agenda` | Get agenda | All non-organizer roles |
| 8 | GET | `/organizer-sessions/events/:eventId/my-agenda` | Get my agenda | All non-organizer roles |
| 9 | POST | `/organizer-sessions/events/:eventId/my-agenda/:sessionIndex` | Add to my agenda | All non-organizer roles |
| 10 | DELETE | `/organizer-sessions/events/:eventId/my-agenda/:sessionIndex` | Remove from agenda | All non-organizer roles |
| 11 | GET | `/organizer-sessions/events/:eventId/agenda/:sessionIndex` | Get single agenda | All non-organizer roles |
| 12 | GET | `/organizer-sessions/events/:eventId/speakers/:speakerId` | Get speaker profile | All non-organizer roles |
| 13 | PATCH | `/organizer-sessions/agenda/:eventId/:sessionIndex/toggle-like` | Toggle like | All non-organizer roles |
| 14 | POST | `/organizer-sessions/events/:eventId/agenda/:sessionIndex/speakers/:speakerId` | Assign speaker | ORGANIZER, SUPER_ADMIN, TRACK_CHAIR |
| 15 | DELETE | `/organizer-sessions/events/:eventId/agenda/:sessionIndex/speakers/:speakerId` | Remove speaker | ORGANIZER, SUPER_ADMIN, TRACK_CHAIR |
| 16 | GET | `/organizer-sessions/event/:eventId/speakers/search` | Search speaker | ORGANIZER, SUPER_ADMIN, TRACK_CHAIR |

### 3.28 App Content Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/appContent/create` | Create/update content | SUPER_ADMIN, ORGANIZER |
| 2 | GET | `/appContent/all` | Get all content | Public |
| 3 | GET | `/appContent/:type` | Get single content | Public |

### 3.29 Verify Email Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/organizer/verify-email/upload` | Upload verify email CSV | ORGANIZER, SUPER_ADMIN |
| 2 | GET | `/organizer/verify-email/list/:eventId` | Get verify emails | ORGANIZER, SUPER_ADMIN |
| 3 | DELETE | `/organizer/verify-email/:verifyEmailId` | Delete verify email | ORGANIZER, SUPER_ADMIN |
| 4 | POST | `/organizer/verify-email/add` | Add verified emails | ORGANIZER, SUPER_ADMIN |

### 3.30 Event Attendee Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | GET | `/eventAttendee/events/:eventId/attendees` | Get attendees | All non-organizer roles |
| 2 | GET | `/eventAttendee/events/:eventId/attendees/:accountId` | Get attendee detail | All non-organizer roles |
| 3 | PATCH | `/eventAttendee/events/:eventId/attendees/:accountId/bookmark` | Toggle bookmark | All non-organizer roles |

### 3.31 Upload Module

| # | Method | Endpoint | Description | Role |
|---|--------|----------|-------------|------|
| 1 | POST | `/upload/chat-attachment` | Upload chat attachment | All authenticated |

---

## 4. Module-wise API Documentation

### 4.1 Auth Module

#### Register User
- **Method:** POST
- **URL:** `/api/v1/auth/register`
- **Description:** Register a new user account
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "name": "John Doe"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Account created successful",
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "isVerified": false,
    "role": ["ATTENDEE"],
    "activeRole": "ATTENDEE"
  }
}
```

#### Login User
- **Method:** POST
- **URL:** `/api/v1/auth/login`
- **Description:** Login with email and password
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User is logged in successful !",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "activeRole": "ATTENDEE"
  }
}
```
- **Cookies:** `refreshToken` (HTTP-only)

#### Get My Profile
- **Method:** GET
- **URL:** `/api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User profile fetched successfully!",
  "data": {
    "account": {
      "_id": "...",
      "email": "user@example.com",
      "role": ["ATTENDEE"],
      "activeRole": "ATTENDEE",
      "isVerified": true
    },
    "profile": {
      "accountId": "...",
      "name": "John Doe",
      "avatar": "url",
      "about": "..."
    }
  }
}
```

#### Refresh Token
- **Method:** POST
- **URL:** `/api/v1/auth/refresh-token`
- **Cookies:** `refreshToken`
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Refresh token generated successfully!",
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

#### Change Password
- **Method:** POST
- **URL:** `/api/v1/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "oldPassword": "oldPass123",
  "newPassword": "newPass123",
  "currentPassword": "newPass123"
}
```

#### Forgot Password
- **Method:** POST
- **URL:** `/api/v1/auth/forgot-password`
- **Request Body:**
```json
{
  "email": "user@example.com"
}
```
- **Response:** OTP sent to email

#### Verify Reset Code
- **Method:** POST
- **URL:** `/api/v1/auth/verify-reset-code`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Code verified successfully",
  "data": {
    "resetToken": "eyJhbG..."
  }
}
```

#### Reset Password
- **Method:** POST
- **URL:** `/api/v1/auth/reset-password`
- **Request Body:**
```json
{
  "token": "eyJhbG...",
  "email": "user@example.com",
  "newPassword": "newPass123",
  "confirmPassword": "newPass123"
}
```

#### Change Role
- **Method:** POST
- **URL:** `/api/v1/auth/change-role`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "role": "SPEAKER"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Role changed successfully",
  "data": {
    "accessToken": "eyJhbG...",
    "activeRole": "SPEAKER"
  }
}
```

#### Verify Email
- **Method:** POST
- **URL:** `/api/v1/auth/verified-account`
- **Description:** Verify user email using 6-digit code
- **Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Account Verification successful.",
  "data": { ... }
}
```

#### Resend Verification Code
- **Method:** POST
- **URL:** `/api/v1/auth/new-verification-link`
- **Description:** Resend 6-digit verification code to email
- **Request Body:**
```json
{
  "email": "user@example.com"
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "New Verification code is send on email.",
  "data": null
}
```

---

### 4.2 User Module

#### Update Profile
- **Method:** PATCH
- **URL:** `/api/v1/user/update-profile`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `data` (JSON string): Profile data
  - `image` (file): Avatar image
  - `resume` (file): Resume PDF
- **Profile Data Structure:**
```json
{
  "name": "John Doe",
  "about": "Software Engineer",
  "location": {
    "address": "New York",
    "isCurrent": true
  },
  "contact": {
    "phone": "1234567890",
    "email": "john@example.com"
  },
  "affiliations": [...],
  "education": [...],
  "socialLinks": [...],
  "personalWebsites": [...]
}
```

#### Get My Profile
- **Method:** GET
- **URL:** `/api/v1/user/my-profile`
- **Headers:** `Authorization: Bearer <token>`

#### Update Organizer Profile
- **Method:** PATCH
- **URL:** `/api/v1/user/update-profile/organizer`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `image` (file): Organizer avatar

---

### 4.3 Super Admin Module

#### Create Organizer
- **Method:** POST
- **URL:** `/api/v1/superAdmin/create/organizer`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "email": "organizer@example.com",
  "password": "password123",
  "name": "Event Organizer"
}
```

#### Create Event
- **Method:** POST
- **URL:** `/api/v1/superAdmin/create/event`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Tech Conference 2024",
  "location": "New York",
  "googleMapLink": "https://maps.google.com/...",
  "eventType": "HYBRID",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-03T00:00:00Z",
  "expectedAttendee": 500,
  "boothSlot": 50,
  "details": "Conference details...",
  "paymentType": "STRIPE",
  "price": 99.99,
  "organizerEmails": ["organizer@example.com"]
}
```

#### Get All Events
- **Method:** GET
- **URL:** `/api/v1/superAdmin/events`
- **Query Params:**
  - `search` (string): Search term
  - `createdSort` (string): Sort by creation date
  - `eventDate` (string): Filter by date
  - `condition` (string): Filter condition
  - `page` (number): Page number
  - `limit` (number): Items per page

---

### 4.4 Organizer Module

#### Get My Events
- **Method:** GET
- **URL:** `/api/v1/organizer/events`
- **Headers:** `Authorization: Bearer <token>`

#### Update Event
- **Method:** PATCH
- **URL:** `/api/v1/organizer/events/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `banner` (file): Event banner
  - `floorMapImage` (file): Floor map image
  - Other event fields in body

#### Get All Registered Users
- **Method:** GET
- **URL:** `/api/v1/organizer/all-register/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:**
  - `page`, `limit`, `search`, `role`

---

### 4.5 Attendee Module

#### Get Upcoming Events
- **Method:** GET
- **URL:** `/api/v1/attendee/events`
- **Headers:** `Authorization: Bearer <token>`

#### Initiate Registration
- **Method:** POST
- **URL:** `/api/v1/attendee/events/:eventId/initiate-registration`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Event registration initiated successfully",
  "data": {
    "paymentType": "STRIPE",
    "clientSecret": "pi_xxx",
    "registrationId": "..."
  }
}
```

#### Get Event Home
- **Method:** GET
- **URL:** `/api/v1/attendee/events/:eventId/home`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Complete event home data (sessions, announcements, speakers, etc.)

#### Generate QR Token
- **Method:** GET
- **URL:** `/api/v1/attendee/events/:eventId/qr-token`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** QR code data for check-in

#### Join Event
- **Method:** PATCH
- **URL:** `/api/v1/attendee/event/:eventId/join`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `role` (optional)

---

### 4.6 Invitation Module

#### Create Invitation
- **Method:** POST
- **URL:** `/api/v1/invitation/create/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "email": "speaker@example.com",
  "role": "SPEAKER"
}
```

#### Accept Invitation
- **Method:** PATCH
- **URL:** `/api/v1/invitation/:invitationId/accept/:eventId`
- **Headers:** `Authorization: Bearer <token>`

#### Get My Invitations
- **Method:** GET
- **URL:** `/api/v1/invitation/my-invitations`
- **Headers:** `Authorization: Bearer <token>`

#### Make Speaker (Direct)
- **Method:** POST
- **URL:** `/api/v1/invitation/:eventId/make-speaker`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "email": "speaker@example.com",
  "sessionIndex": [0]
}
```

---

### 4.7 Message Module (Real-time Chat)

#### Send Message
- **Method:** POST
- **URL:** `/api/v1/message/send/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "receiverId": "userId...",
  "text": "Hello!"
}
```

#### Get Conversations
- **Method:** GET
- **URL:** `/api/v1/message/conversations/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`, `search`

#### Get Messages
- **Method:** GET
- **URL:** `/api/v1/message/:conversationId/:eventId`
- **Headers:** `Authorization: Bearer <token>`

#### Mark as Seen
- **Method:** PATCH
- **URL:** `/api/v1/message/seen/:conversationId/:eventId`
- **Headers:** `Authorization: Bearer <token>`

#### Socket.io Events
```javascript
// Connect to socket
const socket = io('http://localhost:5000', {
  auth: { token: 'Bearer <token>' }
});

// Join event room (automatic on connect)
socket.on('connect', () => {
  console.log('Connected to chat');
});

// Receive new message
socket.on('message:new', (message) => {
  console.log('New message:', message);
});

// Get active user count
socket.on('active-count', (count) => {
  console.log('Active users:', count);
});

// User online/offline
socket.on('user:online', ({ userId }));
socket.on('user:offline', ({ userId, lastSeen }));
```

---

### 4.8 Connection Module (Networking)

#### Send Connection Request
- **Method:** POST
- **URL:** `/api/v1/connection/request/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "receiverId": "userId..."
}
```

#### Get Incoming Requests
- **Method:** GET
- **URL:** `/api/v1/connection/requests`
- **Headers:** `Authorization: Bearer <token>`

#### Accept Connection Request
- **Method:** PATCH
- **URL:** `/api/v1/connection/requests/:id/accept`
- **Headers:** `Authorization: Bearer <token>`

#### Get Connections
- **Method:** GET
- **URL:** `/api/v1/connection/`
- **Headers:** `Authorization: Bearer <token>`

#### Toggle Bookmark
- **Method:** PATCH
- **URL:** `/api/v1/connection/:id/bookmark`
- **Headers:** `Authorization: Bearer <token>`

---

### 4.9 Booth Module (Exhibitor)

#### Create Booth
- **Method:** POST
- **URL:** `/api/v1/booth/create`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "eventId": "eventId...",
  "companyName": "Tech Corp",
  "description": "Company description...",
  "banner": "url...",
  "offerTitle": "Special Offer",
  "boothOpening": "Welcome to our booth!",
  "websiteUrl": "https://...",
  "publicEmail": "contact@techcorp.com",
  "resources": [...]
}
```

#### Get My Booth
- **Method:** GET
- **URL:** `/api/v1/booth/me`
- **Headers:** `Authorization: Bearer <token>`

#### Update Booth
- **Method:** PATCH
- **URL:** `/api/v1/booth/me`
- **Headers:** `Authorization: Bearer <token>`

#### Add Booth Staff
- **Method:** POST
- **URL:** `/api/v1/booth/staff`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "email": "staff@example.com"
}
```

---

### 4.10 Sponsor Module

#### Create Sponsor Profile
- **Method:** POST
- **URL:** `/api/v1/sponsor/create`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "eventId": "eventId...",
  "companyName": "Sponsor Corp",
  "description": "Sponsor description...",
  "logoUrl": "url...",
  "websiteUrl": "https://...",
  "publicEmail": "contact@sponsor.com"
}
```

#### Get Sponsor Dashboard
- **Method:** GET
- **URL:** `/api/v1/sponsor/dashboard/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Profile views, status, etc.

---

### 4.11 Poster Module

#### Upload Single File
- **Method:** POST
- **URL:** `/api/v1/poster/upload-file`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `file` (file): PDF or image
  - `folder` (query): Upload folder

#### Upload Multiple Files
- **Method:** POST
- **URL:** `/api/v1/poster/upload-files`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `files` (files): Multiple files (max 10)

#### Create Poster
- **Method:** POST
- **URL:** `/api/v1/poster/create/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Research Poster",
  "abstract": "Abstract text...",
  "banner": "url...",
  "tags": ["AI", "ML"],
  "presenters": [{"name": "John", "role": "Author"}],
  "videoLink": "https://youtube.com/...",
  "dueDate": "2024-06-01",
  "attachments": [...]
}
```

#### Get Revised Posters
- **Method:** GET
- **URL:** `/api/v1/poster/revised`
- **Headers:** `Authorization: Bearer <token>`

#### Update Revised Attachment
- **Method:** PATCH
- **URL:** `/api/v1/poster/author/attachments/:attachmentId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "url": "new-url...",
  "reviewStatus": "pending"
}
```

---

### 4.12 Reviewer Module

#### Get Reviewer Dashboard
- **Method:** GET
- **URL:** `/api/v1/reviewer/dashboard/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Assigned submissions count, pending reviews, etc.

#### Get Authors
- **Method:** GET
- **URL:** `/api/v1/reviewer/authors/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `type` (pdf/image)

#### Approve Attachment
- **Method:** PATCH
- **URL:** `/api/v1/reviewer/attachments/:attachmentId/approve`
- **Headers:** `Authorization: Bearer <token>`

#### Reject Attachment
- **Method:** PATCH
- **URL:** `/api/v1/reviewer/attachments/:attachmentId/reject`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "reason": "Rejection reason..."
}
```

#### Request Revision
- **Method:** PATCH
- **URL:** `/api/v1/reviewer/attachments/:attachmentId/revise`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "reason": "Revision needed because..."
}
```

#### Review Image Attachment
- **Method:** POST
- **URL:** `/api/v1/reviewer/attachments/:attachmentId/image-review`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "reviewScore": {
    "originality": 8,
    "scientificRigor": 9,
    "clarity": 7,
    "visualDesign": 8,
    "impact": 9,
    "presentation": 8,
    "overall": true
  }
}
```

---

### 4.13 Announcement Module

#### Create Announcement
- **Method:** POST
- **URL:** `/api/v1/announcement/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `file` (file): Image (optional)
  - `title`: Announcement title
  - `description`: Announcement description

#### Get Event Announcements
- **Method:** GET
- **URL:** `/api/v1/announcement/event/:eventId`
- **Headers:** `Authorization: Bearer <token>`

---

### 4.14 Resource Module (QnA, Polls, Surveys)

#### Create QnA
- **Method:** POST
- **URL:** `/api/v1/resource/qna/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "question": "Question text?",
  "answer": "Answer text"
}
```

#### Create Poll
- **Method:** POST
- **URL:** `/api/v1/resource/poll/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "question": "Poll question?",
  "options": ["Option 1", "Option 2"],
  "allowMultiple": false
}
```

#### Submit Poll
- **Method:** POST
- **URL:** `/api/v1/resource/poll/:pollId/:eventId/submit`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "selectedOptions": [0, 1]
}
```

#### Submit Survey
- **Method:** POST
- **URL:** `/api/v1/resource/survey/:eventId/submit`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "responses": [
    {"questionId": "...", "answer": "Response"}
  ]
}
```

---

### 4.15 QR Module

#### Generate QR
- **Method:** GET
- **URL:** `/api/v1/qr/generate/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** QR code data

#### Scan QR
- **Method:** POST
- **URL:** `/api/v1/qr/scan/:eventId`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "qrData": "scanned-qr-data"
}
```

#### Get Exhibitor Leads
- **Method:** GET
- **URL:** `/api/v1/qr/exhibitor/:eventId/leads`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `tags` (HOT/FOLLOW_UP/GENERAL)

#### Update Lead Note
- **Method:** PATCH
- **URL:** `/api/v1/qr/exhibitor/leads/:leadId/note`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "note": "Follow up next week"
}
```

#### Update Lead Tags
- **Method:** PATCH
- **URL:** `/api/v1/qr/exhibitor/leads/:leadId/tags`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "tags": ["HOT"]
}
```

---

### 4.16 Volunteer Module

#### Create Task
- **Method:** POST
- **URL:** `/api/v1/volunteer/create`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "eventId": "eventId...",
  "title": "Registration Desk",
  "date": "2024-06-01",
  "time": "09:00",
  "location": "Main Hall",
  "instruction": "Help with registration",
  "assignedVolunteer": "volunteerId..."
}
```

#### Get My Tasks
- **Method:** GET
- **URL:** `/api/v1/volunteer/my-tasks`
- **Headers:** `Authorization: Bearer <token>`

#### Complete Task
- **Method:** PATCH
- **URL:** `/api/v1/volunteer/:taskId/complete`
- **Headers:** `Authorization: Bearer <token>`

#### Get Today's Progress
- **Method:** GET
- **URL:** `/api/v1/volunteer/today-progress`
- **Headers:** `Authorization: Bearer <token>`

---

### 4.17 Report Module

#### Report Task Issue
- **Method:** POST
- **URL:** `/api/v1/report/report`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "taskId": "taskId...",
  "category": "Technical",
  "urgency": "High",
  "description": "Issue description...",
  "images": ["url1", "url2"]
}
```

---

### 4.18 Job Module

#### Create Job
- **Method:** POST
- **URL:** `/api/v1/job/`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "bannerImage": "url...",
  "description": "Job description...",
  "requirements": "Requirements...",
  "location": "New York",
  "locationUrl": "https://...",
  "type": "Full-time",
  "salary": "$100k-$150k",
  "benefits": ["Health insurance", "401k"],
  "applyLink": "https://apply.com",
  "eventId": "eventId..."
}
```

#### Get Public Jobs
- **Method:** GET
- **URL:** `/api/v1/job/`
- **Query Params:** `search`

#### Update Job Status
- **Method:** PATCH
- **URL:** `/api/v1/job/:jobId/status`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "status": "APPROVED"
}
```

---

### 4.19 Event Live Module

#### Start Live Session
- **Method:** POST
- **URL:** `/api/v1/eventLive/start/:eventid`
- **Headers:** `Authorization: Bearer <token>`

#### Join Live Session
- **Method:** POST
- **URL:** `/api/v1/eventLive/join/:eventid`
- **Headers:** `Authorization: Bearer <token>`

#### End Live Session
- **Method:** POST
- **URL:** `/api/v1/eventLive/end/:eventid`
- **Headers:** `Authorization: Bearer <token>`

#### Get Live Sessions
- **Method:** GET
- **URL:** `/api/v1/eventLive/live/:eventid`
- **Headers:** `Authorization: Bearer <token>`

---

### 4.20 Organizer Session Module (Agenda)

#### Add Session
- **Method:** POST
- **URL:** `/api/v1/organizer-sessions/events/:eventId/sessions`
- **Headers:** `Authorization: Bearer <token>`
- **Form Data:**
  - `floorMap` (file): Session floor map
  - Session data in body

#### Get Agenda
- **Method:** GET
- **URL:** `/api/v1/organizer-sessions/events/:eventId/agenda`
- **Headers:** `Authorization: Bearer <token>`

#### Add to My Agenda
- **Method:** POST
- **URL:** `/api/v1/organizer-sessions/events/:eventId/my-agenda/:sessionIndex`
- **Headers:** `Authorization: Bearer <token>`

#### Toggle Like Session
- **Method:** PATCH
- **URL:** `/api/v1/organizer-sessions/agenda/:eventId/:sessionIndex/toggle-like`
- **Headers:** `Authorization: Bearer <token>`

#### Assign Speaker to Session
- **Method:** POST
- **URL:** `/api/v1/organizer-sessions/events/:eventId/agenda/:sessionIndex/speakers/:speakerId`
- **Headers:** `Authorization: Bearer <token>`

---

## 5. API Flow Explanation

### 5.1 Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────┘

1. User enters email/password
         │
         ▼
2. POST /api/v1/auth/login
         │
         ▼
3. Server validates credentials
         │
         ▼
4. Server returns:
   - accessToken (for API calls)
   - refreshToken (HTTP-only cookie)
   - activeRole
         │
         ▼
5. Frontend stores accessToken
   (localStorage/memory)
         │
         ▼
6. Use accessToken in Authorization header
   for all protected API calls
```

### 5.2 Refresh Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   REFRESH TOKEN FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. accessToken expires (401 response)
         │
         ▼
2. Frontend calls POST /api/v1/auth/refresh-token
   (refreshToken sent automatically via cookie)
         │
         ▼
3. Server validates refreshToken
         │
         ▼
4. Server returns new accessToken
         │
         ▼
5. Frontend uses new accessToken for API calls
```

### 5.3 Event Creation Flow (Super Admin/Organizer)

```
┌─────────────────────────────────────────────────────────────┐
│                  EVENT CREATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Organizer creates event:
   POST /api/v1/superAdmin/create/event
   Body: { title, location, dates, ... }
         │
         ▼
2. Event created with status: UPCOMING
         │
         ▼
3. Organizer updates event with banner:
   PATCH /api/v1/organizer/events/:eventId
   Form: banner image, floor maps
         │
         ▼
4. Organizer adds sessions:
   POST /api/v1/organizer-sessions/events/:eventId/sessions
         │
         ▼
5. Organizer sends invitations:
   POST /api/v1/invitation/create/:eventId
   Body: { email, role }
         │
         ▼
6. Event is ready for attendees
```

### 5.4 Participant Invitation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                INVITATION FLOW                               │
└─────────────────────────────────────────────────────────────┘

1. Organizer sends invitation:
   POST /api/v1/invitation/create/:eventId
   Body: { email, role: "SPEAKER" }
         │
         ▼
2. System sends email to invitee
         │
         ▼
3. Invitee receives invitation:
   GET /api/v1/invitation/my-invitations
         │
         ▼
4. Invitee accepts:
   PATCH /api/v1/invitation/:invitationId/accept/:eventId
         │
         ▼
5. System adds role to user's account
   User can now switch to that role
```

### 5.5 Volunteer Task Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  VOLUNTEER TASK FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Organizer creates task:
   POST /api/v1/volunteer/create
   Body: { eventId, title, date, assignedVolunteer }
         │
         ▼
2. Volunteer sees task:
   GET /api/v1/volunteer/my-tasks
         │
         ▼
3. Volunteer completes task:
   PATCH /api/v1/volunteer/:taskId/complete
         │
         ▼
4. If issue occurs, volunteer reports:
   POST /api/v1/report/report
   Body: { taskId, category, description, images }
         │
         ▼
5. Organizer views report:
   GET /api/v1/volunteer/:reportId
```

### 5.6 Report Submission Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 REPORT SUBMISSION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. Volunteer encounters issue during task
         │
         ▼
2. Volunteer submits report:
   POST /api/v1/report/report
   Body: { taskId, category, urgency, description, images }
         │
         ▼
3. Report status changes to REPORTED
         │
         ▼
4. Organizer views reported tasks:
   GET /api/v1/volunteer/:reportId
         │
         ▼
5. Organizer takes action (reassign, resolve, etc.)
```

### 5.7 Chat/Messaging Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   CHAT/MESSAGING FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. User connects to Socket.io with auth token
         │
         ▼
2. Socket joins event room: event:{eventId}
         │
         ▼
3. User sends message via REST API:
   POST /api/v1/message/send/:eventId
   Body: { receiverId, text }
         │
         ▼
4. Server saves message to database
         │
         ▼
5. Server emits via socket:
   io.emit('message:new', message)
         │
         ▼
6. All users in event room receive message
         │
         ▼
7. Users see online/offline status:
   - user:online event
   - user:offline event
```

### 5.8 File Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Frontend prepares file (image, PDF, etc.)
         │
         ▼
2. Upload to S3 via:
   POST /api/v1/upload/chat-attachment
   Form: { file }
         │
         ▼
3. Server uploads to AWS S3
         │
         ▼
4. Server returns S3 URL:
   { url: "https://s3.amazonaws.com/..." }
         │
         ▼
5. Frontend uses URL in:
   - Poster attachments
   - Chat messages
   - Profile images
   - Event banners
```

### 5.9 Poster Review Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  POSTER REVIEW FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Author creates poster:
   POST /api/v1/poster/create/:eventId
   With attachments (PDF/images)
         │
         ▼
2. Organizer assigns reviewer:
   POST /api/v1/poster-assign/create/:eventId
         │
         ▼
3. Reviewer sees assigned submissions:
   GET /api/v1/reviewer/authors/:eventId
         │
         ▼
4. Reviewer reviews attachment:
   - View: GET /api/v1/reviewer/attachments/:attachmentId
   - Score: POST /api/v1/reviewer/attachments/:attachmentId/image-review
         │
         ▼
5. Reviewer decision:
   - Approve: PATCH /approve
   - Reject: PATCH /reject (with reason)
   - Revise: PATCH /revise (with reason)
   - Flag: PATCH /flag-admin
         │
         ▼
6. Author notified of decision
   If revised, author updates attachment
```

---

## 6. Database Models Summary

### 6.1 Account (User Authentication)

```typescript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed),
  lastPasswordChange: Date,
  isDeleted: Boolean (default: false),
  accountStatus: String (ACTIVE/SUSPENDED/INACTIVE),
  role: [String] (multiple roles possible),
  activeRole: String (current active role),
  refreshToken: String,
  isVerified: Boolean,
  resetPasswordCode: String (OTP),
  resetPasswordExpire: Date,
  activeEvent: ObjectId (ref: Event),
  emailNotificationOn: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 User Profile

```typescript
{
  _id: ObjectId,
  accountId: ObjectId (ref: account, unique),
  name: String,
  avatar: String (URL),
  affiliations: [{
    company: String,
    position: String,
    from: String,
    to: String,
    isCurrent: Boolean
  }],
  education: [{
    institute: String,
    degree: String,
    major: String,
    from: String,
    to: String,
    isCurrent: Boolean
  }],
  location: {
    address: String,
    isCurrent: Boolean
  },
  contact: {
    phone: String,
    mobile: String,
    email: String
  },
  resume: {
    url: String,
    updatedAt: Date
  },
  about: String,
  socialLinks: [{
    platform: String,
    url: String
  }],
  personalWebsites: [String],
  lastSeen: Date
}
```

### 6.3 Event

```typescript
{
  _id: ObjectId,
  title: String (required),
  website: String,
  location: String (required),
  googleMapLink: String,
  eventType: String (OFFLINE/ONLINE/HYBRID),
  status: String (UPCOMING/ONGOING/COMPLETED/CANCELLED),
  price: Number,
  startDate: Date (required),
  endDate: Date (required),
  expectedAttendee: Number,
  boothSlot: Number,
  details: String,
  paymentType: String (STRIPE/EXTERNAL/EMAIL_VERIFICATION),
  externalPaymentUrl: String,
  organizers: [ObjectId] (ref: Account),
  organizerEmails: [String],
  bannerImageUrl: String,
  latitude: Number,
  longitude: Number,
  floorMaps: [{
    title: String,
    imageUrl: String,
    order: Number
  }],
  agenda: {
    sessions: [{
      title: String,
      floorMapLocation: String,
      date: String,
      time: String,
      details: String,
      bookmarkCount: Number,
      likesCount: Number,
      isOnline: Boolean,
      liveProvider: String,
      roomId: String,
      liveStatus: String,
      startedAt: Date,
      endedAt: Date
    }]
  },
  participants: [{
    accountId: ObjectId,
    role: String,
    sessionIndex: [Number]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 6.4 Invitation

```typescript
{
  _id: ObjectId,
  eventId: ObjectId (ref: Event),
  organizerId: ObjectId (ref: account),
  email: String,
  role: String (SPEAKER/STAFF/EXHIBITOR/VOLUNTEER/etc.),
  status: String (PENDING/ACCEPTED/REJECTED),
  createdAt: Date,
  updatedAt: Date
}
```

### 6.5 Message

```typescript
{
  _id: ObjectId,
  eventId: ObjectId (ref: event),
  conversationId: ObjectId (ref: conversation),
  senderId: ObjectId (ref: account),
  text: String,
  readBy: [ObjectId] (ref: account),
  attachments: [{
    url: String,
    name: String,
    size: Number,
    mimeType: String
  }],
  createdAt: Date
}
```

### 6.6 Connection

```typescript
{
  _id: ObjectId,
  ownerAccountId: ObjectId (ref: account),
  connectedAccountId: ObjectId (ref: account),
  status: String (pending/accepted/rejected),
  isBookmarked: Boolean,
  events: [{
    eventId: ObjectId,
    role: String,
    sessionsCount: Number
  }],
  lastConnectedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.7 Booth

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  exhibitorId: ObjectId,
  companyName: String,
  banner: String,
  offerTitle: String,
  boothOpening: String,
  description: String,
  boothNumber: String,
  websiteUrl: String,
  publicEmail: String,
  resources: [{
    name: String,
    url: String,
    type: String (pdf/image/link)
  }],
  status: String (active/inactive),
  isAccepted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.8 Sponsor

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  sponsorId: ObjectId,
  companyName: String,
  description: String,
  logoUrl: String,
  websiteUrl: String,
  publicEmail: String,
  profileView: Number,
  status: String (pending/approved/rejected),
  isApproved: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.9 Poster

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  authorId: ObjectId,
  title: String,
  abstract: String,
  banner: String,
  tags: [String],
  presenters: [{
    name: String,
    role: String
  }],
  videoLink: String,
  dueDate: String,
  attachments: [{
    url: String,
    type: String (pdf/image),
    name: String,
    size: Number,
    reviewStatus: String,
    reviewReason: String,
    reviewScore: {
      originality: Number,
      scientificRigor: Number,
      clarity: Number,
      visualDesign: Number,
      impact: Number,
      presentation: Number,
      overall: Boolean
    }
  }],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.10 Task (Volunteer)

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  title: String,
  date: String,
  time: String,
  location: String,
  instruction: String,
  referenceImage: String,
  assignedVolunteer: ObjectId,
  status: String (ASSIGNED/COMPLETED/REPORTED),
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.11 Report

```typescript
{
  _id: ObjectId,
  taskId: ObjectId (ref: task),
  volunteerId: ObjectId (ref: account),
  category: String,
  urgency: String,
  description: String,
  images: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 6.12 Job

```typescript
{
  _id: ObjectId,
  title: String,
  company: String,
  bannerImage: String,
  description: String,
  requirements: String,
  location: String,
  locationUrl: String,
  position: String,
  qualification: String,
  experience: String,
  jobExpire: Date,
  type: String,
  salary: String,
  benefits: [String],
  applyLink: String,
  status: String (PENDING/APPROVED/REJECTED),
  postedBy: ObjectId,
  posterRole: String,
  eventId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.13 Announcement

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  title: String,
  description: String,
  image: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.14 Document

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  uploadedBy: ObjectId,
  documentType: String,
  documentUrl: String,
  documentName: String,
  status: String (pending/approved/rejected),
  createdAt: Date,
  updatedAt: Date
}
```

### 6.15 Photo

```typescript
{
  _id: ObjectId,
  eventId: ObjectId,
  imageUrl: String,
  type: String,
  uploadedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.16 Note

```typescript
{
  _id: ObjectId,
  accountId: ObjectId,
  content: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.17 QR (Attendance & Lead)

```typescript
// Attendance
{
  _id: ObjectId,
  eventId: ObjectId,
  attendeeId: ObjectId,
  checkedInBy: ObjectId,
  checkedInAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Lead
{
  _id: ObjectId,
  eventId: ObjectId,
  exhibitorId: ObjectId,
  attendeeId: ObjectId,
  source: String (QR_SCAN),
  tags: [String] (HOT/FOLLOW_UP/GENERAL),
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 7. Integration Guide for Frontend Developers

### 7.1 Initial Setup

#### Base Configuration

```javascript
// config.js
const API_BASE_URL = 'http://your-backend-url/api/v1';
const WS_URL = 'http://your-backend-url';

// Role constants
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORGANIZER: 'ORGANIZER',
  ATTENDEE: 'ATTENDEE',
  SPEAKER: 'SPEAKER',
  EXHIBITOR: 'EXHIBITOR',
  STAFF: 'STAFF',
  SPONSOR: 'SPONSOR',
  VOLUNTEER: 'VOLUNTEER',
  ABSTRACT_REVIEWER: 'ABSTRACT_REVIEWER',
  TRACK_CHAIR: 'TRACK_CHAIR'
};
```

### 7.2 Authentication Setup

#### API Client Setup

```javascript
// apiClient.js
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401) {
        await this.refreshToken();
        return this.request(endpoint, options);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include', // Send cookies
      });
      const data = await response.json();
      
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      // Redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success) {
      this.accessToken = response.data.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
    }
    
    return response;
  }

  async register(email, password, confirmPassword, name) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword, name }),
    });
  }

  async logout() {
    localStorage.removeItem('accessToken');
    this.accessToken = null;
  }
}

export const api = new ApiClient();
```

### 7.3 Socket.io Setup

```javascript
// socketClient.js
import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
  }

  connect(token, eventId, userId) {
    this.socket = io(WS_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat');
    });

    this.socket.on('message:new', (message) => {
      // Handle new message
      console.log('New message:', message);
    });

    this.socket.on('user:online', ({ userId }) => {
      // User came online
    });

    this.socket.on('user:offline', ({ userId, lastSeen }) => {
      // User went offline
    });

    this.socket.on('active-count', (count) => {
      // Active users count
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socket = new SocketClient();
```

### 7.4 Page-wise API Integration

#### Login Page (`/login`)

```javascript
// On form submit
const handleLogin = async (email, password) => {
  try {
    const response = await api.login(email, password);
    
    if (response.success) {
      // Store user info
      localStorage.setItem('activeRole', response.data.activeRole);
      
      // Redirect based on role
      const role = response.data.activeRole;
      if (role === 'ORGANIZER') {
        window.location.href = '/organizer/dashboard';
      } else if (role === 'ATTENDEE') {
        window.location.href = '/attendee/events';
      }
      // ... other roles
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### Registration Page (`/register`)

```javascript
const handleRegister = async (formData) => {
  try {
    const response = await api.register(
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.name
    );
    
    if (response.success) {
      // Redirect to verification page
      window.location.href = '/verify-email';
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

#### Event List Page (`/attendee/events`)

```javascript
// Fetch upcoming events
const fetchEvents = async () => {
  const response = await api.request('/attendee/events');
  return response.data;
};

// Usage in component
useEffect(() => {
  fetchEvents().then(setEvents);
}, []);
```

#### Event Detail Page (`/attendee/events/:eventId`)

```javascript
// Fetch event details
const fetchEventDetails = async (eventId) => {
  const response = await api.request(`/attendee/events/${eventId}`);
  return response.data;
};

// Register for event
const registerForEvent = async (eventId) => {
  const response = await api.request(
    `/attendee/events/${eventId}/initiate-registration`,
    { method: 'POST' }
  );
  
  // Handle payment if needed
  if (response.data.paymentType === 'STRIPE') {
    // Initialize Stripe payment
    initializeStripe(response.data.clientSecret);
  }
};
```

#### Chat Page (`/chat/:eventId`)

```javascript
// Initialize chat
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  socket.connect(token, eventId, userId);
  
  // Load conversations
  loadConversations();
  
  return () => socket.disconnect();
}, [eventId]);

// Load conversations
const loadConversations = async () => {
  const response = await api.request(`/message/conversations/${eventId}`);
  setConversations(response.data);
};

// Send message
const sendMessage = async (receiverId, text) => {
  await api.request(`/message/send/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ receiverId, text }),
  });
  // Message will appear via socket
};

// Mark as seen
const markAsSeen = async (conversationId) => {
  await api.request(`/message/seen/${conversationId}/${eventId}`, {
    method: 'PATCH',
  });
};
```

#### Organizer Dashboard (`/organizer/dashboard`)

```javascript
// Get organizer events
const fetchOrganizerEvents = async () => {
  const response = await api.request('/organizer/events');
  return response.data;
};

// Create announcement
const createAnnouncement = async (eventId, title, description, image) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  if (image) formData.append('file', image);
  
  const response = await api.request(`/announcement/${eventId}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response;
};
```

#### Poster Submission Page (`/poster/create`)

```javascript
// Upload file first
const uploadFile = async (file, folder = 'posters') => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.request(`/poster/upload-file?folder=${folder}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.url;
};

// Create poster
const createPoster = async (eventId, posterData) => {
  const response = await api.request(`/poster/create/${eventId}`, {
    method: 'POST',
    body: JSON.stringify(posterData),
  });
  
  return response;
};
```

#### Volunteer Task Page (`/volunteer/tasks`)

```javascript
// Get my tasks
const fetchTasks = async () => {
  const response = await api.request('/volunteer/my-tasks');
  return response.data;
};

// Complete task
const completeTask = async (taskId) => {
  const response = await api.request(`/volunteer/${taskId}/complete`, {
    method: 'PATCH',
  });
  
  return response;
};

// Report issue
const reportIssue = async (taskId, category, urgency, description, images) => {
  const response = await api.request('/report/report', {
    method: 'POST',
    body: JSON.stringify({
      taskId,
      category,
      urgency,
      description,
      images,
    }),
  });
  
  return response;
};
```

### 7.5 File Upload Helper

```javascript
// uploadHelper.js
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.request(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadMultipleFiles = async (files, endpoint) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await api.request(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};
```

### 7.6 Error Handling

```javascript
// errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Bad request';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An error occurred';
    }
  }
  
  return 'Network error. Please check your connection.';
};
```

---

## 8. Final API Summary Table

| Method | URL | Module | Description | Role |
|--------|-----|--------|-------------|------|
| POST | `/auth/register` | Auth | Register new user | Public |
| POST | `/auth/login` | Auth | Login user | Public |
| GET | `/auth/me` | Auth | Get my profile | All |
| POST | `/auth/refresh-token` | Auth | Refresh token | Public |
| POST | `/auth/change-password` | Auth | Change password | All |
| POST | `/auth/forgot-password` | Auth | Request reset | Public |
| POST | `/auth/verify-reset-code` | Auth | Verify OTP | Public |
| POST | `/auth/reset-password` | Auth | Reset password | Public |
| POST | `/auth/verified-account` | Auth | Verify email | Public |
| POST | `/auth/new-verification-link` | Auth | Resend verification | Public |
| DELETE | `/auth/delete-account` | Auth | Delete account | All |
| POST | `/auth/change-role` | Auth | Switch role | All |
| GET | `/auth/my-roles` | Auth | Get roles | All |
| PATCH | `/auth/notification` | Auth | Toggle notifications | All |
| PATCH | `/user/update-profile` | User | Update profile | All |
| PATCH | `/user/update-profile/organizer` | User | Update organizer profile | ORGANIZER, SUPER_ADMIN |
| DELETE | `/user/delete-resume` | User | Delete resume | All |
| GET | `/user/my-profile` | User | Get my profile | All |
| GET | `/user/my-profile/organizer` | User | Get organizer profile | ORGANIZER, SUPER_ADMIN |
| POST | `/superAdmin/create/organizer` | SuperAdmin | Create organizer | SUPER_ADMIN |
| GET | `/superAdmin/organizers` | SuperAdmin | Get all organizers | SUPER_ADMIN |
| POST | `/superAdmin/create/event` | SuperAdmin | Create event | SUPER_ADMIN |
| GET | `/superAdmin/events` | SuperAdmin | Get all events | Public |
| PATCH | `/superAdmin/events/:eventId` | SuperAdmin | Update event | SUPER_ADMIN |
| DELETE | `/superAdmin/events/:eventId` | SuperAdmin | Delete event | SUPER_ADMIN |
| GET | `/superAdmin/users` | SuperAdmin | Get all users | SUPER_ADMIN |
| DELETE | `/superAdmin/users/:userId` | SuperAdmin | Delete user | SUPER_ADMIN |
| GET | `/organizer/events` | Organizer | Get my events | ORGANIZER, SUPER_ADMIN |
| PATCH | `/organizer/events/:eventId` | Organizer | Update event | ORGANIZER, SUPER_ADMIN |
| GET | `/organizer/all-register/:eventId` | Organizer | Get registered users | ORGANIZER, SUPER_ADMIN |
| DELETE | `/organizer/attendee/:eventId/:accountId` | Organizer | Remove attendee | ORGANIZER, SUPER_ADMIN |
| GET | `/attendee/events` | Attendee | Get upcoming events | All non-organizer |
| POST | `/attendee/events/:eventId/initiate-registration` | Attendee | Register for event | All non-organizer |
| GET | `/attendee/my-event` | Attendee | Get my events | All non-organizer |
| GET | `/attendee/events/:eventId/home` | Attendee | Get event home | All non-organizer |
| POST | `/invitation/create/:eventId` | Invitation | Send invitation | ORGANIZER, SUPER_ADMIN |
| PATCH | `/invitation/:invitationId/accept/:eventId` | Invitation | Accept invitation | All non-organizer |
| GET | `/invitation/my-invitations` | Invitation | Get my invitations | All non-organizer |
| POST | `/message/send/:eventId` | Message | Send message | All non-organizer |
| GET | `/message/conversations/:eventId` | Message | Get conversations | All non-organizer |
| POST | `/connection/request/:eventId` | Connection | Send connection request | All non-organizer |
| GET | `/connection/requests` | Connection | Get incoming requests | All non-organizer |
| PATCH | `/connection/requests/:id/accept` | Connection | Accept connection | All non-organizer |
| POST | `/booth/create` | Booth | Create booth | EXHIBITOR, STAFF |
| GET | `/booth/me` | Booth | Get my booth | EXHIBITOR, STAFF |
| PATCH | `/booth/me` | Booth | Update booth | EXHIBITOR, STAFF |
| POST | `/sponsor/create` | Sponsor | Create sponsor profile | SPONSOR |
| GET | `/sponsor/dashboard/:eventId` | Sponsor | Get sponsor dashboard | SPONSOR |
| GET | `/organizerSponsor/all-sponsors/:eventId` | OrganizerSponsor | Get all sponsors | All |
| PATCH | `/organizerSponsor/:sponsorId/approve` | OrganizerSponsor | Approve sponsor | ORGANIZER, SUPER_ADMIN |
| POST | `/poster/upload-file` | Poster | Upload single file | ATTENDEE, SPEAKER |
| POST | `/poster/create/:eventId` | Poster | Create poster | ATTENDEE, SPEAKER |
| GET | `/poster/accepted` | Poster | Get accepted posters | Public |
| POST | `/poster-assign/create/:eventId` | PosterAssign | Assign poster | ORGANIZER, SUPER_ADMIN |
| GET | `/reviewer/dashboard/:eventId` | Reviewer | Get reviewer dashboard | ABSTRACT_REVIEWER, TRACK_CHAIR |
| PATCH | `/reviewer/attachments/:attachmentId/approve` | Reviewer | Approve attachment | ORGANIZER, SUPER_ADMIN, REVIEWER |
| POST | `/document/:eventId` | Document | Upload document | ORGANIZER, SUPER_ADMIN, SPEAKER |
| GET | `/document/:eventId` | Document | Get all documents | ORGANIZER, SUPER_ADMIN |
| POST | `/photo/events/:eventId/photos` | Photo | Create photo | Public |
| POST | `/announcement/:eventId` | Announcement | Create announcement | ORGANIZER |
| GET | `/announcement/event/:eventId` | Announcement | Get event announcements | All non-organizer |
| POST | `/resource/qna/:eventId` | Resource | Create QnA | ORGANIZER, SUPER_ADMIN |
| POST | `/resource/poll/:eventId` | Resource | Create poll | ORGANIZER, SUPER_ADMIN |
| POST | `/resource/poll/:pollId/:eventId/submit` | Resource | Submit poll | All non-organizer |
| POST | `/note/create` | Note | Create note | All |
| GET | `/qr/generate/:eventId` | QR | Generate QR | All |
| POST | `/qr/scan/:eventId` | QR | Scan QR | All |
| GET | `/qr/exhibitor/:eventId/leads` | QR | Get leads | EXHIBITOR, STAFF |
| POST | `/volunteer/create` | Volunteer | Create task | SUPER_ADMIN, ORGANIZER |
| GET | `/volunteer/my-tasks` | Volunteer | Get my tasks | VOLUNTEER, ORGANIZER, SUPER_ADMIN |
| PATCH | `/volunteer/:taskId/complete` | Volunteer | Complete task | VOLUNTEER |
| POST | `/report/report` | Report | Report issue | VOLUNTEER |
| POST | `/job/` | Job | Create job | ORGANIZER, SUPER_ADMIN, EXHIBITOR, STAFF, SPONSOR |
| GET | `/job/` | Job | Get public jobs | Public |
| POST | `/eventLive/start/:eventid` | EventLive | Start live session | SPEAKER, ATTENDEE |
| GET | `/organizer-sessions/events/:eventId/agenda` | OrganizerSession | Get agenda | All non-organizer |
| POST | `/organizer-sessions/events/:eventId/sessions` | OrganizerSession | Add session | ORGANIZER, SUPER_ADMIN |
| POST | `/appContent/create` | AppContent | Create content | SUPER_ADMIN, ORGANIZER |
| GET | `/appContent/all` | AppContent | Get all content | Public |
| POST | `/organizer/verify-email/upload` | VerifyEmail | Upload verify emails | ORGANIZER, SUPER_ADMIN |
| GET | `/eventAttendee/events/:eventId/attendees` | EventAttendee | Get attendees | All non-organizer |
| POST | `/upload/chat-attachment` | Upload | Upload attachment | All |

---

## Appendix

### Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "statusCode": 400
}
```

### Success Response Format

```json
{
  "success": true,
  "message": "Success message",
  "statusCode": 200,
  "data": { ... }
}
```

### Rate Limiting

Currently no rate limiting is implemented. Consider adding for production.

### CORS Configuration

Currently allows all origins (`*`). Restrict to specific frontend URLs in production.

---

**Documentation Version:** 1.0.1  
**Last Updated:** April 2026  
**Contact:** Backend Team

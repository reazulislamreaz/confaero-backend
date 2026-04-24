import path from "path";
import { configs } from "./app/configs";
import { authSwaggerDocs } from "./app/modules/auth/auth.swagger";
import { userSwaggerDocs } from "./app/modules/user/user.swagger";
import { superAdminSwaggerDocs } from "./app/modules/superAdmin/superAdmin.swagger";
import { organizerSwaggerDocs } from "./app/modules/organizer/organizer.swagger";
import { organizerSessionSwaggerDocs } from "./app/modules/organizer/organizer.session.swagger";
import { attendeeSwaggerDocs } from "./app/modules/attendee/attendee.swagger";
import { qrSwaggerDocs } from "./app/modules/qr/qr.swagger";
import { invitationSwaggerDocs } from "./app/modules/invitation/invitation.swagger";
import { noteSwaggerDocs } from "./app/modules/note/note.swagger";
import { resouceSwaggerDocs } from "./app/modules/resouce/resouce.swagger";
import { announcementSwaggerDocs } from "./app/modules/announcement/announcement.swagger";
import { messageSwaggerDocs } from "./app/modules/message/message.swagger";
import { connectionSwaggerDocs } from "./app/modules/connection/connection.swagger";
import { eventAttendeeSwaggerDocs } from "./app/modules/eventAttendee/eventAttendee.swagger";
import { messageOrganizerSwaggerDocs } from "./app/modules/messageOrganizer/messageOrganizer.swagger";
import { uploadSwaggerDocs } from "./app/modules/upload/upload.swagger";
import { posterSwaggerDocs } from "./app/modules/poster/poster.swagger";
import { reviewerSwaggerDocs } from "./app/modules/reviewer/reviewer.swagger";
import { posterAssignSwaggerDocs } from "./app/modules/posterAssign/posterAssign.swagger";
import { boothSwaggerDocs } from "./app/modules/booth/booth.swagger";
import { organizerBoothSwaggerDocs } from "./app/modules/organizerBooth/organizerBooth.swagger";
import { sponsorSwaggerDocs } from "./app/modules/sponsor/sponsor.swagger";
import { organizerSponsorSwaggerDocs } from "./app/modules/organizerSponsor/organizerSponsor.swagger";
import { documentSwaggerDocs } from "./app/modules/document/document.swagger";
import { photoSwaggerDocs } from "./app/modules/photo/photo.swagger";
import { volunteerSwaggerDocs } from "./app/modules/volunteer/volunteer.swagger";
import { reportSwaggerDocs } from "./app/modules/report/report.swagger";
import { jobSwaggerDocs } from "./app/modules/job/job.swagger";
import { eventLiveSwaggerDocs } from "./app/modules/eventLive/eventLive.swagger";
import { appContentSwaggerDocs } from "./app/modules/appContent/appContent.swagger";
import { verifyEmailSwaggerDocs } from "./app/modules/verifyEmail/verifyEmail.swagger";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Doc - Build with Express CLI",
      version: "1.0.0-Mahid",
      description: "Express API with auto-generated Swagger docs",
    },
    paths: {
      ...authSwaggerDocs,
      ...userSwaggerDocs,
      ...superAdminSwaggerDocs,
      ...organizerSwaggerDocs,
      ...organizerSessionSwaggerDocs,
      ...attendeeSwaggerDocs,
      ...qrSwaggerDocs,
      ...invitationSwaggerDocs,
      ...noteSwaggerDocs,
      ...resouceSwaggerDocs,
      ...announcementSwaggerDocs,
      ...messageSwaggerDocs,
      ...connectionSwaggerDocs,
      ...eventAttendeeSwaggerDocs,
      ...messageOrganizerSwaggerDocs,
      ...uploadSwaggerDocs,
      ...posterSwaggerDocs,
      ...reviewerSwaggerDocs,
      ...posterAssignSwaggerDocs,
      ...boothSwaggerDocs,
      ...organizerBoothSwaggerDocs,
      ...sponsorSwaggerDocs,
      ...organizerSponsorSwaggerDocs,
      ...documentSwaggerDocs,
      ...photoSwaggerDocs,
      ...volunteerSwaggerDocs,
      ...reportSwaggerDocs,
      ...jobSwaggerDocs,
      ...appContentSwaggerDocs,
      ...verifyEmailSwaggerDocs,
    },
    servers:
      configs.env === "production"
        ? [
            { url: "http://10.10.11.30:8081" },
            { url: "https://reazul8078.suplify.life" },
          ]
        : [
            { url: "https://reazul8078.suplify.life" },
            { url: "http://10.10.11.30:8081" },
          ],
    components: {
      securitySchemes: {
        AuthorizationToken: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Put your accessToken here",
        },
      },
    },
    security: [
      {
        AuthorizationToken: [],
      },
    ],
  },
  apis: ["./src/app.ts"],
};

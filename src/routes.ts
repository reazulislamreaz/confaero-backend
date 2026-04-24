import { Router } from "express";
import authRoute from "./app/modules/auth/auth.route";
import userRoute from "./app/modules/user/user.route";
import superAdminRoute from "./app/modules/superAdmin/superAdmin.route";
import organizerSessionRoute from "./app/modules/organizer/organizer.session.route";
import organizerRoute from "./app/modules/organizer/organizer.route";
import attendeeRoute from "./app/modules/attendee/attendee.route";
import qrRoute from "./app/modules/qr/qr.route";
import invitationRoute from "./app/modules/invitation/invitation.route";
import noteRoute from "./app/modules/note/note.route";
import resouceRoute from "./app/modules/resouce/resouce.route";
import announcementRoute from "./app/modules/announcement/announcement.route";
import messageRoute from "./app/modules/message/message.route";
import connectionRoute from "./app/modules/connection/connection.route";
import eventAttendeeRoute from "./app/modules/eventAttendee/eventAttendee.route";
import messageOrganizerRoute from "./app/modules/messageOrganizer/messageOrganizer.route";
import uploadRoute from "./app/modules/upload/upload.route";
import posterRoute from "./app/modules/poster/poster.route";
import reviewerRoute from "./app/modules/reviewer/reviewer.route";
import posterAssignRoute from "./app/modules/posterAssign/posterAssign.route";
import boothRoute from "./app/modules/booth/booth.route";
import organizerBoothRoute from "./app/modules/organizerBooth/organizerBooth.route";
import sponsorRoute from "./app/modules/sponsor/sponsor.route";
import organizerSponsorRoute from "./app/modules/organizerSponsor/organizerSponsor.route";
import documentRoute from "./app/modules/document/document.route";
import photoRoute from "./app/modules/photo/photo.route";
import volunteerRoute from "./app/modules/volunteer/volunteer.route";
import reportRoute from "./app/modules/report/report.route";
import jobRoute from "./app/modules/job/job.route";
import eventLiveRoute from "./app/modules/eventLive/eventLive.route";
import appContentRoute from "./app/modules/appContent/appContent.route";
import verifyEmailRoute from "./app/modules/verifyEmail/verifyEmail.route";
import { ExhibitorRoutes } from "./app/modules/exhibitor/exhibitor.route";

const appRouter = Router();

const moduleRoutes = [
  { path: "/exhibitor", route: ExhibitorRoutes },
  { path: "/organizer/verify-email", route: verifyEmailRoute },
  { path: "/appContent", route: appContentRoute },
  { path: "/eventLive", route: eventLiveRoute },
  { path: "/job", route: jobRoute },
  { path: "/report", route: reportRoute },
  { path: "/volunteer", route: volunteerRoute },
  { path: "/photo", route: photoRoute },
  { path: "/document", route: documentRoute },
  { path: "/organizerSponsor", route: organizerSponsorRoute },
  { path: "/sponsor", route: sponsorRoute },
  { path: "/organizerBooth", route: organizerBoothRoute },
  { path: "/booth", route: boothRoute },
  { path: "/reviewer", route: reviewerRoute },
  { path: "/poster-assign", route: posterAssignRoute },
  { path: "/poster", route: posterRoute },
  { path: "/upload", route: uploadRoute },
  { path: "/messageOrganizer", route: messageOrganizerRoute },
  { path: "/eventAttendee", route: eventAttendeeRoute },
  { path: "/connection", route: connectionRoute },
  { path: "/message", route: messageRoute },
  { path: "/announcement", route: announcementRoute },
  { path: "/resouce", route: resouceRoute },
  { path: "/note", route: noteRoute },
  { path: "/invitation", route: invitationRoute },
  { path: "/qr", route: qrRoute },
  { path: "/attendee", route: attendeeRoute },
  { path: "/organizer", route: organizerRoute },
  { path: "/organizer-sessions", route: organizerSessionRoute },
  { path: "/superAdmin", route: superAdminRoute },
  { path: "/auth", route: authRoute },
  { path: "/user", route: userRoute },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));
export default appRouter;

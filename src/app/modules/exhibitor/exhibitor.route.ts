import { Router } from "express";
import auth from "../../middlewares/auth";
import { ExhibitorController } from "./exhibitor.controller";

const router = Router();

router.get(
  "/performance/:eventId",
  auth("EXHIBITOR", "STAFF"),
  ExhibitorController.get_exhibitor_performance,
);

export const ExhibitorRoutes = router;

import { Types } from "mongoose";

export type T_Task = {
  eventId: Types.ObjectId;
  title: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  instruction: string;
  referenceImage?: string;
  assignedVolunteer: Types.ObjectId;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DUE" | "REPORTED";
  createdBy: Types.ObjectId;
};

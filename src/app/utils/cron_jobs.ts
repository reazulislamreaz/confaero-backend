import cron from "node-cron";
import { task_model } from "../modules/volunteer/volunteer.schema";

export const startCronJobs = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[CRON] Checking for overdue volunteer tasks...");
      const today = new Date().toISOString().split("T")[0];

      // Find tasks that are pending or in progress and endDate is prior to today
      // String comparison works for YYYY-MM-DD
      const result = await task_model.updateMany(
        {
          status: { $in: ["PENDING", "IN_PROGRESS"] },
          endDate: { $lt: today },
        },
        {
          $set: { status: "DUE" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[CRON] Updated ${result.modifiedCount} overdue tasks to DUE status.`);
      }
    } catch (error) {
      console.error("[CRON] Error during task check:", error);
    }
  });
};

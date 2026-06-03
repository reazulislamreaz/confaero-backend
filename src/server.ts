import mongoose from "mongoose";
import app from "./app";
import { configs } from "./app/configs";
import seedSuperAdmin from "./app/utils/seeders/superAdmin.seeder";
import http from "http";
import { initSocket } from "./app/socket/socket";
import { startCronJobs } from "./app/utils/cron_jobs";
import { getFirebaseAdmin, isFirebaseAdminReady } from "./app/config/firebase";

async function main() {
  await mongoose.connect(configs.db_url!);

  try {
    getFirebaseAdmin();
    console.log("[Firebase] Admin SDK ready");
  } catch (error) {
    console.warn(
      "[Firebase] Admin SDK not configured — /auth/google and /auth/firebase-login will return 503:",
      (error as Error).message,
    );
  }

  const server = http.createServer(app);
  //  init socket connection
  initSocket(server);

  // start background cron jobs
  startCronJobs();

  // await seedSuperAdmin(); // runs once safely
  // app.listen(configs.port, () => {
  //   console.log(`Server listening on port ${configs.port}`);
  // });
  // server.listen(configs.port, configs.ip.backend_ip as any, () => {

  server.listen(configs.port, configs.ip.backend_ip as any, () => {
    // server.listen(configs.port, () => {
    console.log(`Server listening on port ${configs.port}`);
  });
}
main().catch((err) => console.log(err));

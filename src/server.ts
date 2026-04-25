import mongoose from "mongoose";
import app from "./app";
import { configs } from "./app/configs";
import seedSuperAdmin from "./app/utils/seeders/superAdmin.seeder";
import http from "http";
import { initSocket } from "./app/socket/socket";
import { startCronJobs } from "./app/utils/cron_jobs";

async function main() {
  await mongoose.connect(configs.db_url!);

  const server = http.createServer(app);
  //  init socket
  initSocket(server);
  
  // start background cron jobs
  startCronJobs();

  // await seedSuperAdmin(); // runs once safely
  // app.listen(configs.port, () => {
  //   console.log(`Server listening on port ${configs.port}`);
  // });
  // server.listen(configs.port, configs.ip.backend_ip as any, () => {

  server.listen(configs.port, configs.ip.backend_ip as any, () => {
    console.log(`Server listening on port ${configs.port}`);
  });
}
main().catch((err) => console.log(err));

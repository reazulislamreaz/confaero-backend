import "dotenv/config";

export const configs = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  jwt: {
    access_token: process.env.ACCESS_TOKEN,
    refresh_token: process.env.REFRESH_TOKEN,
    access_expires: process.env.ACCESS_EXPIRES,
    refresh_expires: process.env.REFRESH_EXPIRES,
    reset_secret: process.env.RESET_SECRET,
    reset_expires: process.env.RESET_EXPIRES,
    front_end_url: process.env.FRONT_END_URL,
    verified_token: process.env.VERIFIED_TOKEN,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  },
  db_url: process.env.DB_URL,
  email: {
    app_email: process.env.APP_USER_EMAIL,
    app_password: process.env.APP_PASSWORD,
  },
  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    cloud_api_key: process.env.CLOUD_API_KEY,
    cloud_api_secret: process.env.CLOUD_API_SECRET,
  },

  aws: {
    region: process.env.AWS_REGION,
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    bucket_name: process.env.AWS_BUCKET_NAME,
  },
  new: {
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  qr: {
    secret: process.env.QR_SECRET,
  },
  api: {
    google_map_api: process.env.GOOGLE_MAPS_API_KEY,
  },
  firebase: {
    service_account_path: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    web: {
      api_key: process.env.FIREBASE_WEB_API_KEY,
      auth_domain: process.env.FIREBASE_AUTH_DOMAIN,
      storage_bucket: process.env.FIREBASE_STORAGE_BUCKET,
      messaging_sender_id: process.env.FIREBASE_MESSAGING_SENDER_ID,
      app_id: process.env.FIREBASE_APP_ID,
      measurement_id: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },
  ip: {
    backend_ip: process.env.BACKEND_IP,
  },
};

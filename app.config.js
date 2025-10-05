// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      // fallback to a local file for dev; in EAS cloud we will provide
      // a secret file via the environment variable GOOGLE_SERVICES_JSON
      android: {
        ...(config.expo?.android ?? {}),
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./android/app/google-services.json",
      },
    },
  };
};

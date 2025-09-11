import dotenv from "dotenv";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

dotenv.config();

const ENV = process.env.NODE_ENV || "development";
const REGION = process.env.AWS_REGION || "us-east-1";
const SECRET_NAME = "color-secret";
const secretsManager = new SecretsManagerClient({ region: REGION });

const loadConfig = async () => {
  if (ENV === "production") {
    try {
      const response = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: SECRET_NAME })
      );

      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);

        return {
          PORT: secrets.PORT || 7878,
          DB_URI: secrets.DB_URI,
          ACCESS_TOKEN_SECRET: secrets.ACCESS_TOKEN_SECRET,
          REFRESH_TOKEN_SECRET: secrets.REFRESH_TOKEN_SECRET,
          AWS_REGION: secrets.AWS_REGION || "us-east-1",
          SECRET_NAME: SECRET_NAME,
          EMAIL_USER: secrets.EMAIL_USER,
          EMAIL_PASS: secrets.EMAIL_PASS,
          AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
          STRIPE_SECRET_KEY: secrets.STRIPE_SECRET_KEY,
          S3_BUCKET: "bucket-rtyu",
        };
      }

      console.warn("No SecretString found, falling back to .env");
    } catch (error) {
      console.error("AWS Secrets Fetch Error:", error.message);
      console.warn("Falling back to environment variables");
    }
  }

  // fallback (used in development OR if AWS fails)
  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 7878,
    DB_URI: process.env.DB_URI,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
    SECRET_NAME: process.env.SECRET_NAME || "color-secret",
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.S3_BUCKET || "bucket-rtyu",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ,
  };
};

export { loadConfig };

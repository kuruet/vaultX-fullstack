// backend/lib/r2Client.js
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
} = process.env;

// Warn if any env var is missing
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_REGION) {
  console.warn("R2 env vars missing. r2Client will not be fully configured.");
}

export const r2Client = new S3Client({
  region: R2_REGION || "auto",      // ensure region is set
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

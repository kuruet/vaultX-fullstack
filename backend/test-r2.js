// backend/lib/test-r2.js
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2Client } from "./r2Client.js";
import dotenv from "dotenv";

dotenv.config();

async function testR2() {
  try {
    console.log("🔍 Checking objects in:", process.env.R2_BUCKET);
    const objects = await r2Client.send(
      new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET })
    );
    console.log("📂 Objects:", objects.Contents || []);
  } catch (err) {
    console.error("❌ R2 test failed:", err);
  }
}

testR2();

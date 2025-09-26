// backend/routes/uploadRouter.js
import express from "express";
import { r2Client } from "../r2Client.js"; // your Cloudflare R2 client
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import Entry from '../models/Entry.js';
import {  ListObjectsV2Command } from "@aws-sdk/client-s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

// Parse JSON body (if not done globally in index.js)
router.use(express.json());

// POST /api/presign
router.post("/api/presign", async (req, res) => {
  try {
    // 1️⃣ Debug: log incoming request body
    console.log("Request body:", req.body);

    if (!req.body || !req.body.files || !Array.isArray(req.body.files)) {
      console.error("❌ req.body.files is missing or invalid");
      return res.status(400).json({ error: "No files provided in request" });
    }

    const uploads = [];

    // 2️⃣ Generate presigned URL for each file
    for (const file of req.body.files) {
      console.log("Processing file:", file);

      const fileKey = `uploads/${Date.now()}-${file.name}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileKey,
        ContentType: "application/octet-stream", // default for unknown files
      });

      let uploadUrl;
      try {
        uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });
        console.log("Presigned URL generated for:", file.name);
      } catch (err) {
        console.error("❌ Error generating presigned URL for", file.name, err);
        return res.status(500).json({ error: "Failed to generate presigned URL" });
      }

      uploads.push({
        name: file.name,
        key: fileKey,
        uploadUrl,
        expiresIn: 900,
      });
    }

    // 3️⃣ Send response
    console.log("Sending presign response:", uploads);
    res.json({ uploads });
  } catch (err) {
    console.error("❌ Error in /api/presign route:", err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/presign-download?key=<s3Key>
router.get("/api/presign-download", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "key query param required" });

    // Optional: verify this key exists in DB (recommended)
    const exists = await Entry.findOne({ "files.storage.s3Key": key }).lean();
    if (!exists) {
      // you can allow download anyway, or return 404. Returning 404 is safer.
      return res.status(404).json({ error: "File not found" });
    }

    const bucket = process.env.R2_BUCKET;
    if (!bucket) return res.status(500).json({ error: "R2_BUCKET not configured" });

    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });

    // expiresIn seconds (24h = 86400). Adjust if needed.
    const expiresIn = 86400;
    const downloadUrl = await getSignedUrl(r2Client, getCmd, { expiresIn });

    return res.json({ downloadUrl, expiresIn });
  } catch (err) {
    console.error("presign-download error:", err);
    return res.status(500).json({ error: err.message });
  }
});


// generate presigned URL for download
router.get("/presign-download", async (req, res) => {
  try {
    const { key } = req.query; // file key stored in MongoDB
    if (!key) {
      return res.status(400).json({ error: "File key is required" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 min

    res.json({ url });
  } catch (err) {
    console.error("❌ Error generating download URL:", err);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
});

router.post("/presign-download", async (req, res) => {
  try {
    const { key } = req.body; // frontend will send file key (e.g., uploads/filename.pdf)

    if (!key) {
      return res.status(400).json({ error: "Missing file key" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 min

    res.json({ downloadUrl });
  } catch (err) {
    console.error("❌ Error creating download presign:", err);
    res.status(500).json({ error: "Failed to generate download link" });
  }
});

router.get("/files", async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      Prefix: "uploads/", // adjust if files go to "uploads/"
    });

    const result = await r2Client.send(command);

    const files = (result.Contents || []).map((file) => ({
      name: file.Key.replace("uploads/", ""),
      key: file.Key,
    }));

    console.log("📂 Files from R2:", files);
    res.json(files);
  } catch (err) {
    console.error("❌ Error listing files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Route: GET /api/download/entries
// Returns all entries (text + files), latest first
router.get("/entries", async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }); // latest first

    const formattedEntries = [];

    for (const entry of entries) {
      if (entry.type === "text") {
        formattedEntries.push({
          _id: entry._id,
          type: "text",
          text: entry.text,
          createdAt: entry.createdAt,
        });
      } else if (entry.type === "file") {
        // Each file in entry.files
        entry.files.forEach((file) => {
          formattedEntries.push({
            _id: entry._id,
            type: "file",
            name: file.name,
            key: file.storage.localPath || file.storage.s3Key, // works for Phase2 (local) or Phase3 (R2)
            createdAt: entry.createdAt,
          });
        });
      }
    }

    res.json(formattedEntries);
  } catch (err) {
    console.error("❌ Error fetching entries:", err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});


router.delete("/delete/:id", async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    // If entry is a file, delete from R2
    if (entry.type === "file") {
      for (const file of entry.files) {
        if (file.storage.s3Key) {
          const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: file.storage.s3Key,
          });
          await r2Client.send(command);
        }
      }
    }

    // Delete from MongoDB
    await Entry.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Entry deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting entry:", err);
    res.status(500).json({ error: err.message });
  }
});



export default router;

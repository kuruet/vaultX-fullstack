import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Entry from "./models/Entry.js";
import upload from "./middlewares/upload.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client} from "./r2Client.js"
 import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import File from "./models/file.js"; 
import uploadRouter from "./routes/UploadRouter.js";
  // import s3 from "./s3.js";



dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(uploadRouter);

app.use((err, req, res, next)=>{
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Something Went Wrong"})
});

app.post("/api/save-file", async (req, res) => {
  try {
    const { name, size, mime, key } = req.body;

    if (!name || !size || !mime || !key) {
      return res.status(400).json({ error: "Missing file metadata" });
    }

    // Create new DB entry
    const entry = new Entry({
      type: "file",
      files: [
        {
          name,
          size,
          mime,
          storage: { s3Key: key }, // Phase 3: store R2 key
        },
      ],
    });

    await entry.save();

    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.use("/api", uploadRouter);

app.get("/api/test-s3", async (req, res) => {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Helper: make unique key
// ---------------------------
function makeKey(originalName) {
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  return `uploads/${Date.now()}-${id}-${originalName.replace(/\s+/g, "_")}`;
}

// ---------------------------
// POST /api/presign
// Request body: { files: [{ name, size, mime }] }
// Returns: { uploads: [{ name, key, uploadUrl, expiresIn }] }
// ---------------------------
app.post("/api/presign", async (req, res) => {
  console.log("Request body:" , req.body);
  const {files} = req.body;
  
  if(!files || files.length === 0){
    return res.status(400).json({ error: "no files provided"});
  }
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files array required" });
    }

    const bucket = process.env.R2_BUCKET;
    if (!bucket) return res.status(500).json({ error: "R2_BUCKET not configured" });

    const uploads = [];

    for (const f of files) {
      if (!f.name || !f.size || !f.mime) {
        return res.status(400).json({ error: "each file needs name, size, mime" });
      }
      if (f.size > 100 * 1024 * 1024) {
        return res.status(400).json({ error: `File ${f.name} exceeds 100MB limit` });
      }

      const key = makeKey(f.name);
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: f.mime,
        // keep ACL/private; we'll use presigned URLs
      });

      // presigned PUT valid for 15 minutes
      const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 900 });

      uploads.push({ name: f.name, key, uploadUrl, expiresIn: 900 });
    }

    return res.json({ uploads });
  } catch (err) {
    console.error("presign error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// POST /api/entry
// Body for text: { type: "text", text: "..." }
// Body for files: { type: "file", files: [{ key, name, size, mime }] }
// ---------------------------
app.post("/api/entry", async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: "type required" });

    if (type === "text") {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "text required" });
      const entry = await Entry.create({ type: "text", text });
      return res.json({ success: true, entry });
    }

    if (type === "file") {
      const { files } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "files array required" });
      }

      // Map incoming files into entry.files schema shape
      const filesMeta = files.map((f) => ({
        name: f.name,
        size: f.size,
        mime: f.mime,
        storage: { s3Key: f.key },
      }));

      const entry = await Entry.create({ type: "file", files: filesMeta });
      return res.json({ success: true, entry });
    }

    return res.status(400).json({ error: "invalid type" });
  } catch (err) {
    console.error("entry error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// GET /api/presign-download?key=<s3Key>
// Returns presigned GET URL (expires in 24h)
// ---------------------------
app.get("/api/presign-download", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "key required" });

    const bucket = process.env.R2_BUCKET;
    if (!bucket) return res.status(500).json({ error: "R2_BUCKET not configured" });

    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    // presigned GET valid 24h = 86400s
    const downloadUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 86400 });

    return res.json({ downloadUrl, expiresIn: 86400 });
  } catch (err) {
    console.error("presign-download error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Update DELETE route to remove from R2 when file entry
// ---------------------------
app.delete("/delete/:id", async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    if (entry.type === "file") {
      const bucket = process.env.R2_BUCKET;
      if (!bucket) return res.status(500).json({ error: "R2_BUCKET not configured" });

      for (const file of entry.files) {
        const key = file.storage?.s3Key;
        if (!key) continue;

        try {
          await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        } catch (e) {
          console.warn("delete object failed", key, e.message);
        }
      }
    }

    await Entry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("delete error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))


app.post("/upload/text", async (req, res)=>{
  try{
    const { text} = req.body;
    if(!text) return res.status(400).json({ error: "Text is required"});

    const entry = await Entry.create({ type: "text", text});
    res.json({ success: true, entry});
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
})

app.post("/upload/file", upload.array("files"), async(req, res)=>{
  try{
    if(!req.files || req.files.length === 0){
      return res.status(400).json({ error: "No files uploaded"});
    }

    const filesMeta = req.files.map((file)=>({
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
      storage: { localpath: file.filename},
    }));

    const entry = await Entry.create({ type: "file", files: filesMeta});
    res.json({ success: true,entry});

  } catch(err){
    res.status(500).json({ error: err.message});
  }
})

app.get("/download", async(req, res)=>{
  try{
    const entries = await Entry.find().sort({ createdAt: -1});
    res.json({ success: true, entries});

  } catch (err){
  res.status(500).json({ error: err.message})
  }
})

app.delete("/delete/:id", async(req, res)=>{
  try{
    const entry = await Entry.findById(req.params.id);
    if(!entry) return res.status(404).json({ error: "Entry not found"});

    if (entry.type === "file"){
      for (const file of entry.files){
        const filepath = path.join("./uploads", file.storage.localPath);
        if(fs.existSync(filepath)){
          fs.unlinkSync(filepath);
        }
      }
    }
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ success: true});

  } catch(err){
    res.status(500).json({ error: err.message});
  }
})






mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

import messageRoutes from "./routes/messageRoutes.js";
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

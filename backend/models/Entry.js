import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  mime: { type: String, required: true },
  storage: {
    localPath: { type: String }, // Phase 2: local storage
    s3Key: { type: String },     // Phase 3: AWS S3
  },
});

const entrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    files: [fileSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// index for reverse chronological queries
entrySchema.index({ createdAt: -1 });

export default mongoose.model("Entry", entrySchema);

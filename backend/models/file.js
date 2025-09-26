import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: String,
  key: String,
  contentType: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("File", fileSchema);

// testmodel.js
require('dotenv').config();
const mongoose = require('mongoose');

// Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Connection error:", err));

// Schema
const messageSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['text', 'file'] },
  content: { type: String }, // text messages
  fileUrl: { type: String }, // file link
  createdAt: { type: Date, default: Date.now }
});

// Model
const Message = mongoose.model('Message', messageSchema);

async function run() {
  try {
    // Insert sample text
    const textMsg = await Message.create({
      type: 'text',
      content: 'Hello from Phase 1'
    });

    // Insert sample file (dummy url)
    const fileMsg = await Message.create({
      type: 'file',
      fileUrl: 'https://example.com/sample.pdf'
    });

    console.log("Inserted:", textMsg, fileMsg);

    // Fetch all
    const allMsgs = await Message.find().sort({ createdAt: -1 });
    console.log("Fetched records:", allMsgs);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

run();

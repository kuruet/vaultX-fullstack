import dotenv from "dotenv";
dotenv.config();


console.log("R2_ACCESS_KEY_ID:", process.env.R2_ACCESS_KEY_ID);
console.log("R2_SECRET_ACCESS_KEY:", process.env.R2_SECRET_ACCESS_KEY ? "Loaded ✅" : "Missing ❌");
console.log("R2_ENDPOINT:", process.env.R2_ENDPOINT);
console.log("R2_BUCKET:", process.env.R2_BUCKET);

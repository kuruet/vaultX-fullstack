//  import React, { useState } from "react";
 
//  export default function UploadPage() {
//    const [textInput, setTextInput] = useState("");
//    const [selectedFiles, setSelectedFiles] = useState([]);
//    const [popupMessage, setPopupMessage] = useState("");
 
//    // Handle file selection
//    const handleFileChange = (e) => {
//      setSelectedFiles(Array.from(e.target.files));
//    };
 
//    // Show popup for 3 seconds
//    const showPopup = (msg) => {
//      setPopupMessage(msg);
//      setTimeout(() => setPopupMessage(""), 3000);
//    };
 
//    // Handle send button
//    const handleSend = async () => {
//      // 1️⃣ Send text
//      if (textInput.trim()) {
//        try {
//          const res = await fetch("http://localhost:5000/upload/text", {
//            method: "POST",
//            headers: { "Content-Type": "application/json" },
//            body: JSON.stringify({ text: textInput }),
//          });
 
//          if (!res.ok) throw new Error("Text upload failed");
 
//          showPopup("Text sent!");
//          setTextInput("");
//        } catch (err) {
//          console.error(err);
//          showPopup("Text failed!");
//        }
//      }
 
//      // 2️⃣ Send files
//      if (selectedFiles.length > 0) {
//        const filesPayload = selectedFiles
//          .filter((f) => f.name)
//          .map((f) => ({ name: f.name }));
 
//        if (filesPayload.length === 0) {
//          showPopup("No valid files to upload!");
//          return;
//        }
 
//        for (const file of selectedFiles) {
//          if (!file.name) continue; // skip invalid files
 
//          console.log("Selected files:", selectedFiles);
//          const filesPayload = selectedFiles.map(f => ({ name: f.name}));
//          console.log("payload to /api/presign:", JSON.stringify({files: filesPayload}));
 
//          try {
//            // Request presigned URL
//            const presignRes = await fetch("http://localhost:5000/api/presign", {
//              method: "POST",
//              headers: { "Content-Type": "application/json" },
//              body: JSON.stringify({ files: [{ name: file.name }] }),
//            });
 
//            if (!presignRes.ok) {
//              showPopup(`${file.name} presign failed!`);
//              continue;
//            }
 
//            const data = await presignRes.json();
//            if (!data.uploads || data.uploads.length === 0) {
//              showPopup(`${file.name} presign returned empty uploads`);
//              continue;
//            }
 
//            const { uploadUrl, key } = data.uploads[0];
 
//            // Upload to R2
//            const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file });
//            if (!uploadRes.ok) {
//              showPopup(`${file.name} upload failed`);
//              continue;
//            }
 
//            // Save metadata in MongoDB
//            const saveRes = await fetch("http://localhost:5000/api/save-file", {
//              method: "POST",
//              headers: { "Content-Type": "application/json" },
//              body: JSON.stringify({
//                name: file.name,
//                size: file.size,
//                mime: file.type,
//                key,
//              }),
//            });
 
//            if (!saveRes.ok) {
//              showPopup(`${file.name} metadata save failed`);
//              continue;
//            }
 
//            showPopup(`${file.name} uploaded successfully!`);
//          } catch (err) {
//            console.error(err);
//            showPopup(`${file.name} failed!`);
//          }
//        }
 
//        // Clear selected files
//        setSelectedFiles([]);
//      }
//    };
 
//    return (
//      <div className="upload-container">
//        {/* Popup */}
//        {popupMessage && <div className="popup">{popupMessage}</div>}
 
//        {/* Text input */}
//        <input
//          type="text"
//          placeholder="Type your message..."
//          value={textInput}
//          onChange={(e) => setTextInput(e.target.value)}
//        />
 
//        {/* File input */}
//        <input type="file" multiple onChange={handleFileChange} />
 
//        {/* Send button */}
//        <button onClick={handleSend}>Send</button>
//      </div>
//    );
//  }
 
import React, { useState, useRef } from "react";

export default function UploadPage() {
  const [textInput, setTextInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState(""); // success, error, info
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  // Show popup for 3 seconds
  const showPopup = (msg, type = "info") => {
    setPopupMessage(msg);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, 3000);
  };

  // Handle send button
  const handleSend = async () => {
    if (!textInput.trim() && selectedFiles.length === 0) {
      showPopup("Please enter text or select files to upload", "error");
      return;
    }

    // 1️⃣ Send text
    if (textInput.trim()) {
      try {
        const res = await fetch("https://vaultx-fullstack.onrender.com/upload/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });

        if (!res.ok) throw new Error("Text upload failed");

        showPopup("Text sent successfully!", "success");
        setTextInput("");
      } catch (err) {
        console.error(err);
        showPopup("Failed to send text!", "error");
      }
    }

    // 2️⃣ Send files
    if (selectedFiles.length > 0) {
      const filesPayload = selectedFiles
        .filter((f) => f.name)
        .map((f) => ({ name: f.name }));

      if (filesPayload.length === 0) {
        showPopup("No valid files to upload!", "error");
        return;
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (!file.name) continue;

        // Set progress for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        try {
          // Request presigned URL
          const presignRes = await fetch("https://vaultx-fullstack.onrender.com/api/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: [{ name: file.name }] }),
          });

          if (!presignRes.ok) {
            showPopup(`${file.name} presign failed!`, "error");
            continue;
          }

          const data = await presignRes.json();
          if (!data.uploads || data.uploads.length === 0) {
            showPopup(`${file.name} presign returned empty uploads`, "error");
            continue;
          }

          const { uploadUrl, key } = data.uploads[0];

          // Simulate progress (since fetch doesn't support upload progress)
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

          // Upload to R2
          const uploadRes = await fetch(uploadUrl, { method: "PUT", body: file });
          if (!uploadRes.ok) {
            showPopup(`${file.name} upload failed`, "error");
            continue;
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 75 }));

          // Save metadata in MongoDB
          const saveRes = await fetch("https://vaultx-fullstack.onrender.com/api/save-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              mime: file.type,
              key,
            }),
          });

          if (!saveRes.ok) {
            showPopup(`${file.name} metadata save failed`, "error");
            continue;
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          showPopup(`${file.name} uploaded successfully!`, "success");
        } catch (err) {
          console.error(err);
          showPopup(`${file.name} failed!`, "error");
        }
      }

      // Clear after all uploads
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
      }, 1000);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        .upload-container {
          min-height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow-x: hidden;
        }
        
        .popup-notification {
          position: fixed;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 1000;
          min-width: 200px;
        }
        
        .popup-notification.visible {
          animation: slideDown 0.3s ease forwards;
          top: 20px;
          opacity: 1;
        }
        
        .popup-notification.success {
          background: #48bb78;
          color: white;
        }
        
        .popup-notification.error {
          background: #f56565;
          color: white;
        }
        
        .upload-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          animation: fadeIn 0.5s ease;
        }
        
        .title {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .subtitle {
          font-size: 16px;
          color: #718096;
          margin-bottom: 32px;
          text-align: center;
        }
        
        .input-section {
          margin-bottom: 24px;
        }
        
        .label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
        }
        
        .text-input-wrapper {
          position: relative;
          width: 100%;
        }
        
        .text-input {
          width: 100%;
          padding: 12px 44px 12px 16px;
          font-size: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        
        .text-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .input-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
        }
        
        .drop-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f7fafc;
        }
        
        .drop-zone.active {
          border-color: #667eea;
          background: #edf2ff;
          transform: scale(1.02);
        }
        
        .drop-zone-content {
          pointer-events: none;
        }
        
        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .drop-text {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }
        
        .drop-subtext {
          font-size: 14px;
          color: #718096;
          margin-bottom: 16px;
        }
        
        .browse-button {
          padding: 8px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          fontSize: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          pointer-events: auto;
        }
        
        .browse-button:hover {
          background: #5a67d8;
          transform: translateY(-1px);
        }
        
        .hidden-input {
          display: none;
        }
        
        .files-section {
          margin-bottom: 24px;
        }
        
        .files-list {
          max-height: 240px;
          overflow-y: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s ease;
        }
        
        .file-item:hover {
          background: #f7fafc;
        }
        
        .file-item:last-child {
          border-bottom: none;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }
        
        .file-icon {
          font-size: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .file-details {
          flex: 1;
          min-width: 0;
        }
        
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 4px 0;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        .file-size {
          font-size: 12px;
          color: #718096;
          margin: 0;
        }
        
        .progress-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
        }
        
        .progress-bar {
          flex: 1;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: #48bb78;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: #718096;
          min-width: 35px;
        }
        
        .remove-button {
          padding: 4px 8px;
          background: #feb2b2;
          color: #c53030;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .remove-button:hover {
          background: #fc8181;
        }
        
        .send-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(102, 126, 234, 0.25);
        }
        
        .send-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
        }
        
        .send-button:active {
          transform: translateY(0);
        }
        
        .send-icon {
          font-size: 20px;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
          .upload-card {
            padding: 24px;
            border-radius: 16px;
          }
          
          .title {
            font-size: 24px;
          }
          
          .subtitle {
            font-size: 14px;
          }
          
          .drop-zone {
            padding: 24px;
          }
          
          .upload-icon {
            font-size: 36px;
          }
          
          .drop-text {
            font-size: 16px;
          }
          
          .send-button {
            font-size: 16px;
            padding: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .upload-container {
            padding: 16px;
          }
          
          .upload-card {
            padding: 20px;
          }
          
          .title {
            font-size: 20px;
          }
          
          .file-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .progress-wrapper,
          .remove-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="upload-container">
        {/* Popup Notification */}
        <div className={`popup-notification ${popupMessage ? 'visible' : ''} ${popupType}`}>
          <span className="popup-icon">
            {popupType === 'success' ? '✓' : popupType === 'error' ? '✕' : 'ℹ'}
          </span>
          {popupMessage}
        </div>

        <div className="upload-card">
          <h1 className="title">Upload Center</h1>
          <p className="subtitle">Share your files and messages seamlessly</p>

          {/* Text Input Section */}
          <div className="input-section">
            <label className="label">Message</label>
            <div className="text-input-wrapper">
              <input
                type="text"
                className="text-input"
                placeholder="Type your message here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <span className="input-icon">💬</span>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="input-section">
            <label className="label">Files</label>
            <div
              className={`drop-zone ${isDragging ? 'active' : ''}`}
              onDrop={handleDrop}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden-input"
              />
              <div className="drop-zone-content">
                <div className="upload-icon">📁</div>
                <p className="drop-text">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="drop-subtext">or</p>
                <button 
                  className="browse-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            </div>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="files-section">
              <label className="label">Selected Files ({selectedFiles.length})</label>
              <div className="files-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(file.type)}</span>
                      <div className="file-details">
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {uploadProgress[file.name] !== undefined ? (
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                        <span className="progress-text">{uploadProgress[file.name]}%</span>
                      </div>
                    ) : (
                      <button
                        className="remove-button"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            className="send-button"
          >
            <span className="send-icon"></span>
            Send All 
          </button>
        </div>
      </div>
    </>
  );
}
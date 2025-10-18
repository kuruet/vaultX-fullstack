import { useEffect, useState } from "react";
import SwiftShareLoader from "../components/loader"; // adjust path if different

const DownloadPage = () => {
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true); // initial fetch loading
  const [actionLoading, setActionLoading] = useState(false); // per-action (download) loading
  const [copiedID, setCopiedID] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setEntriesLoading(true);
      try {
        const res = await fetch("https://vaultx-fullstack.onrender.com/api/entries");
        const data = await res.json();

        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEntries(data);
      } catch (err) {
        console.error("❌ Error fetching entries:", err);
      } finally {
        setEntriesLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedID(id);
    setTimeout(() => setCopiedID(null), 2000);
  };

  const handleDownload = async (fileKey) => {
    try {
      setActionLoading(true);
      const res = await fetch("https://vaultx-fullstack.onrender.com/api/presign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileKey }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      if (data.downloadUrl) window.open(data.downloadUrl, "_blank");
      else alert("❌ No download link received");
    } catch (err) {
      console.error("❌ Error downloading file:", err);
      alert("Download failed. Check console.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry ?")) return;
    try {
      const res = await fetch(`https://vaultx-fullstack.onrender.com/api/delete/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      alert("✅ Entry deleted successfully!");

      setEntries((prev) => prev.filter((entry) => entry._id !== id));
    } catch (err) {
      console.log("Error deleting entry:", err);
      alert("Delete failed. check console for details");
    }
  };

  // Loader callbacks
  const onLoaderCancel = () => {
    // If user cancels initial loading, stop loading and leave entries empty
    setEntriesLoading(false);
  };

  const onLoaderRetry = () => {
    // re-run fetch
    setEntriesLoading(true);
    (async () => {
      try {
        const res = await fetch("https://vaultx-fullstack.onrender.com/api/entries");
        const data = await res.json();
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEntries(data);
      } catch (err) {
        console.error("❌ Error fetching entries on retry:", err);
      } finally {
        setEntriesLoading(false);
      }
    })();
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Documents
      </h1>

      {/* Show the full-page loader while initial entries are loading */}
      <SwiftShareLoader
        isLoading={entriesLoading}
        onCancel={onLoaderCancel}
        onRetry={onLoaderRetry}
      />

      {/* If not loading and no entries */}
      {!entriesLoading && entries.length === 0 && (
        <p style={{ textAlign: "center" }}>No entries yet.</p>
      )}

      {/* Show table only when entries loaded */}
      {!entriesLoading && entries.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "400px",
            }}
          >
            <thead>
              <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Type</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Content</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {entry.type}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {entry.type === "text" ? entry.text : entry.name}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    {entry.type === "text" ? (
                      <>
                        <button
                          onClick={() => handleCopy(entry.text, entry._id)}
                          style={{
                            backgroundColor: "gold",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Copy
                        </button>
                        {copiedID === entry._id && (
                          <span style={{ color: "green" }}>Copied!</span>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleDownload(entry.key)}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: "dodgerblue",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "5px",
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          color: "white",
                        }}
                      >
                        {actionLoading ? "Processing..." : "Download"}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(entry._id)}
                      style={{
                        backgroundColor: "red",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DownloadPage;

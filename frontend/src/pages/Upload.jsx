import { useState } from "react";
import axios from "axios";

export default function Upload() {
  const [text, setText] = useState("");
  const [popup, setPopup] = useState("");

  const sendMessage = async () => {
    if (!text.trim()) return;
    await axios.post(`${import.meta.env.VITE_API_URL}/messages/text`, {
      content: text,
    });
    setText("");
    setPopup("Message sent!");
    setTimeout(() => setPopup(""), 3000);
  };

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      {popup && <div>{popup}</div>}
    </div>
  );
}

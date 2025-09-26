import { useEffect, useState } from "react";
import axios from "axios";

export default function Download() {
  const [msgs, setMsgs] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/messages`)
      .then(res => setMsgs(res.data));
  }, []);

  return (
    <div>
      {msgs.map(m => (
        <div key={m._id}>{m.content}</div>
      ))}
    </div>
  );
}

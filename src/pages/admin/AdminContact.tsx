import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; // ✅ Import Toaster

const AdminContact: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
const API_URL = import.meta.env.VITE_API_URL;
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/contact/admin`, {
        withCredentials: true,
      });
      setMessages(res.data);
    } catch {
      toast.error("Failed to load messages");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleRespond = async (id: string) => {
    if (!replyText[id] || replyText[id].trim() === "") {
      toast.error("Response cannot be empty");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/contact/admin/respond/${id}`,
        { response: replyText[id] },
        { withCredentials: true }
      );

      if (res.data.success) {
        // ✅ Success toast message
        toast.success("Response sent!");
        setReplyText({ ...replyText, [id]: "" });
        fetchMessages();
      } else {
        // ✅ Error toast for backend errors
        toast.error(res.data.message || "Failed to respond");
      }
    } catch (err) {
      // ✅ Error toast for network/server errors
      toast.error("Server error while responding");
    }
  };

  return (
    <div className="p-6">
      <Toaster /> {/* ✅ Add Toaster component here */}
      <h1 className="text-2xl font-bold mb-6">Contact Messages</h1>
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg._id} className="p-4 border rounded bg-white">
            <h2 className="font-semibold">{msg.subject}</h2>
            <p className="text-sm text-gray-600">From: {msg.name} ({msg.email})</p>
            <p className="mt-2">{msg.message}</p>

            {msg.adminResponse ? (
              <p className="mt-2 text-green-600">✅ Responded: {msg.adminResponse}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <textarea
                  className="w-full border p-2 rounded"
                  placeholder="Write response..."
                  value={replyText[msg._id] || ""}
                  onChange={(e) =>
                    setReplyText({ ...replyText, [msg._id]: e.target.value })
                  }
                />
                <button
                  onClick={() => handleRespond(msg._id)}
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                >
                  Send Response
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminContact;
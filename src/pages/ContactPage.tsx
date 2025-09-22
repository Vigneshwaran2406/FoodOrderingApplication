import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const fetchMessages = async () => {
    if (!user) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/contact/my`, { withCredentials: true });
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      toast.error("Failed to load your messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Frontend validation for guests
    if (!user) {
      if (!formData.name || !formData.email) {
        toast.error("Please provide your name and email.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/contact`, {
        ...formData,
        userId: user?._id || null,
      });

      if (res.data.success) {
        toast.success("Message sent successfully!");
        setFormData({ ...formData, subject: "", message: "" });
        fetchMessages(); // Refresh messages after submitting
      } else {
        toast.error(res.data.msg || "Failed to send message.");
      }
    } catch (err) {
      console.error("Error submitting contact form:", err);
      toast.error("Server error. Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Toaster />
      <div className="flex flex-col md:flex-row gap-8">
        {/* Contact Form */}
        <div className="md:w-1/2 bg-white p-6 rounded shadow-md">
          <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                disabled={user}
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                disabled={user}
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-gray-700">Subject</label>
              <input
                type="text"
                name="subject"
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700">Message</label>
              <textarea
                name="message"
                id="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                required
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white py-2 rounded-md ${
                submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* User's Message History */}
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">My Messages</h2>
          {loading ? (
            <p className="text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-500">No messages found.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg._id} className="bg-white p-4 rounded shadow-md">
                  <h3 className="font-semibold text-lg">{msg.subject}</h3>
                  <p className="text-gray-600 text-sm">Sent on: {new Date(msg.createdAt).toLocaleDateString()}</p>
                  <p className="mt-2 text-gray-800">{msg.message}</p>
                  
                  {msg.response && msg.response.text && (
                    <div className="mt-4 p-3 border-l-4 border-blue-500 bg-blue-50">
                      <p className="font-semibold text-blue-800">Admin's Response:</p>
                      <p className="mt-1 text-blue-700">{msg.response.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

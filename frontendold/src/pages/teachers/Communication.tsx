

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiMessageSquare, FiX } from "react-icons/fi";

const API = `${API_BASE_URL}/api`;

interface Message {
  id: string;
  title: string;
  message: string;
  senderType: string;
  senderName: string;
  createdAt: string;
}

const Communication = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    senderType: "ADMIN",
  });
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/communication`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMessages(res.data.data?.data || []);
      }
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.message.trim()) return toast.error("Message is required");

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/communication`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Message sent successfully");
        setShowModal(false);
        setFormData({ title: "", message: "", senderType: "ADMIN" });
        fetchMessages();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await axios.delete(`${API}/communication/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Message deleted");
        fetchMessages();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const getSenderBadge = (type: string) => {
    switch (type) {
      case "ADMIN": return "bg-primary-100 text-primary-700";
      case "PRINCIPAL": return "bg-purple-100 text-purple-700";
      case "SYSTEM": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Communication</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <FiPlus size={18} /> New Message
        </button>
      </div>

      {/* Notice Board */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FiMessageSquare className="text-primary-600" /> Notice Board
          </h2>
        </div>

        <div className="divide-y">
          {messages.map((msg) => (
            <div key={msg.id} className="p-5 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">{msg.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getSenderBadge(msg.senderType)}`}>
                      {msg.senderType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>By: {msg.senderName}</span>
                    <span>{formatDate(msg.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="p-12 text-center">
              <FiMessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No messages yet</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">New Message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter message title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Type</label>
                <select
                  value={formData.senderType}
                  onChange={(e) => setFormData({ ...formData, senderType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Enter your message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;


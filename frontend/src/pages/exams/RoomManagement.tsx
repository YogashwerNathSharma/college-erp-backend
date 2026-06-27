import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  X,
  DoorOpen,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

const RoomManagement: React.FC = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formLocation, setFormLocation] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/room", { headers });
      setRooms(res.data?.data || res.data || []);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormName("");
    setFormCapacity(30);
    setFormLocation("");
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormCapacity(room.capacity);
    setFormLocation(room.location || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Room name is required");
      return;
    }
    if (!formCapacity || formCapacity < 1) {
      toast.error("Capacity must be at least 1");
      return;
    }

    setSaving(true);
    try {
      if (editingRoom) {
        // Update
        await axios.put(
          `/api/room/${editingRoom.id}`,
          { name: formName.trim(), capacity: formCapacity, location: formLocation.trim() || null },
          { headers }
        );
        toast.success("Room updated successfully");
      } else {
        // Create
        await axios.post(
          "/api/room",
          { name: formName.trim(), capacity: formCapacity, location: formLocation.trim() || null },
          { headers }
        );
        toast.success("Room created successfully");
      }
      setShowModal(false);
      fetchRooms();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save room";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"? This action cannot be undone.`)) return;

    try {
      await axios.delete(`/api/room/${room.id}`, { headers });
      toast.success("Room deleted");
      fetchRooms();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to delete room";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DoorOpen className="w-6 h-6 text-indigo-600" />
              Room Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage exam rooms and classrooms for seating arrangements
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DoorOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Rooms</p>
                <p className="text-xl font-bold text-gray-900">{rooms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Capacity</p>
                <p className="text-xl font-bold text-gray-900">
                  {rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Capacity</p>
                <p className="text-xl font-bold text-gray-900">
                  {rooms.length > 0
                    ? Math.round(rooms.reduce((sum, r) => sum + (r.capacity || 0), 0) / rooms.length)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-gray-500">Loading rooms...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20">
              <DoorOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No rooms found</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Room" to create your first room</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Room Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, idx) => (
                  <tr
                    key={room.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <DoorOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{room.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                        <Users className="w-3 h-3" />
                        {room.capacity} seats
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {room.location || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-indigo-600" />
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Room 1, Hall A, Lab 3"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (seats) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  placeholder="e.g., 30"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., Ground Floor, Block B"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRoom ? "Update Room" : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;

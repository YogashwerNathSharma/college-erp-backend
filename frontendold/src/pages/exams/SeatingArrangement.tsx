

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Grid3X3,
  RefreshCw,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Exam {
  id: string;
  name: string;
}

interface ScheduleItem {
  id: string;
  subjectName: string;
  date: string;
  startTime: string;
  roomName: string;
}

interface Room {
  id: string;
  name: string;
  capacity?: number;
}

interface Seat {
  seatNumber: string;
  studentId?: string;
  studentName?: string;
  rollNo?: string;
  assigned: boolean;
}

interface SeatingStats {
  totalCapacity: number;
  assigned: number;
  available: number;
}

const SeatingArrangement: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [stats, setStats] = useState<SeatingStats>({
    totalCapacity: 0,
    assigned: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules();
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchSeating();
    }
  }, [selectedSchedule]);

  const fetchExams = async () => {
    try {
      const res = await axios.get("/api/exam", { headers });
      setExams(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load exams");
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/room", { headers });
      setRooms(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load rooms");
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(
        `/api/exam/${selectedExam}/schedule`,
        { headers }
      );
      setSchedules(res.data?.data || res.data || []);
    } catch (error) {
      toast.error("Failed to load schedules");
    }
  };

  const fetchSeating = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/exam/seating/${selectedSchedule}`,
        { headers }
      );
      const data = res.data?.data || res.data || [];
      const seatingData: Seat[] = Array.isArray(data) ? data : data.seats || [];
      setSeats(seatingData);

      const assigned = seatingData.filter((s) => s.assigned).length;
      setStats({
        totalCapacity: seatingData.length,
        assigned,
        available: seatingData.length - assigned,
      });
    } catch (error) {
      setSeats([]);
      setStats({ totalCapacity: 0, assigned: 0, available: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSchedule) {
      toast.error("Please select an exam schedule");
      return;
    }
    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }

    setGenerating(true);
    try {
      await axios.post(
        "/api/exam/seating/generate",
        { examScheduleId: selectedSchedule, roomId: selectedRoom },
        { headers }
      );
      toast.success("Seating arrangement generated successfully");
      fetchSeating();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to generate seating arrangement";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/exams")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Seating Arrangement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Auto-generate and manage exam seating plans
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setSelectedSchedule("");
                  setSeats([]);
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">-- Select Exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Schedule
              </label>
              <select
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                disabled={!selectedExam}
              >
                <option value="">-- Select Schedule --</option>
                {schedules.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.subjectName} - {new Date(sch.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Room
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">-- Select Room --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.capacity ? `(Cap: ${room.capacity})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedSchedule || !selectedRoom}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generate Seating
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {seats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Capacity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalCapacity}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.assigned}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.available}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seating Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Seating Layout
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-500">Loading seating...</span>
            </div>
          ) : seats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Grid3X3 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No seating data
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a schedule and room, then generate the seating arrangement
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {seats.map((seat, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      seat.assigned
                        ? "bg-green-50 border-green-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-bold ${
                        seat.assigned ? "text-green-800" : "text-gray-500"
                      }`}
                    >
                      {seat.seatNumber}
                    </div>
                    {seat.assigned && seat.studentName && (
                      <div className="mt-1">
                        <div className="text-xs text-green-700 font-medium truncate">
                          {seat.studentName}
                        </div>
                        {seat.rollNo && (
                          <div className="text-xs text-green-600">
                            {seat.rollNo}
                          </div>
                        )}
                      </div>
                    )}
                    {!seat.assigned && (
                      <div className="mt-1 text-xs text-gray-400">Empty</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-500"></div>
                  <span className="text-sm text-gray-600">Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingArrangement;


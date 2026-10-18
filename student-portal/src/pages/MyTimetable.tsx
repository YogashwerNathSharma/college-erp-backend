import { useState, useEffect } from "react";
import { portalService } from "../services/portal.service";

//////////////////////////////////////////////////////
// 📋 MY TIMETABLE PAGE
//////////////////////////////////////////////////////

interface TimetableSlot {
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room?: string;
}

interface TimetableData {
  [day: string]: TimetableSlot[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MyTimetable() {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const data = await portalService.getTimetable();
        setTimetable(data);
      } catch (error) {
        console.error("Timetable fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const today = DAYS[new Date().getDay() - 1] || "Monday";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>

      <div className="space-y-4">
        {DAYS.map((day) => (
          <div
            key={day}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              day === today ? "ring-2 ring-primary-500" : ""
            }`}
          >
            <div className={`px-6 py-3 font-semibold text-sm ${
              day === today ? "bg-primary-50 text-primary-700" : "bg-gray-50 text-gray-700"
            }`}>
              {day} {day === today && "(Today)"}
            </div>
            <div className="divide-y divide-gray-100">
              {timetable?.[day]?.length ? (
                timetable[day].map((slot) => (
                  <div key={slot.period} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-400 w-20">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="font-medium text-gray-900">{slot.subject}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {slot.teacher} {slot.room && `• ${slot.room}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-400 text-sm">No classes</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

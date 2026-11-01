import { useState, useEffect } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { FiAlertCircle } from "react-icons/fi";

interface TimetableEntry { id?: string; day: string; period: number; subject?: { id: string; name: string }; class?: { id: string; name: string }; section?: { id: string; name: string }; }

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}
function normalizeId(item: any): string { return item?.id || item?._id || ""; }
function Spinner() { return (<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>); }

export default function MyTimetablePage() {
  const days = ["MON","TUE","WED","THU","FRI","SAT"];
  const dayLabels = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const periods = [
    { time: "08:00 - 09:00", label: "Period 1", num: 1 },
    { time: "09:00 - 10:00", label: "Period 2", num: 2 },
    { time: "10:00 - 11:00", label: "Period 3", num: 3 },
    { time: "11:00 - 12:00", label: "Period 4", num: 4 },
    { time: "12:00 - 01:00", label: "Lunch Break", num: 0 },
    { time: "01:00 - 02:00", label: "Period 5", num: 5 },
    { time: "02:00 - 03:00", label: "Period 6", num: 6 },
    { time: "03:00 - 04:00", label: "Period 7", num: 7 },
  ];

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(getFullUrl("/api/timetable"), { headers: getAuthHeaders() })
      .then((res) => {
        const data = res.data?.data?.data || res.data?.data || [];
        setTimetable(Array.isArray(data) ? data : []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function getEntry(day: string, periodNum: number): TimetableEntry | undefined {
    return timetable.find((t) => t.day === day && t.period === periodNum);
  }

  if (loading) return <Spinner />;

  const hasTimetableData = timetable.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">My Timetable</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                {dayLabels.map((day) => (<th key={day} className="text-center px-4 py-3 font-medium text-gray-600">{day}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map((period, i) => {
                const isBreak = period.num === 0;
                return (
                  <tr key={i} className={isBreak ? "bg-amber-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3"><p className="font-medium text-gray-800">{period.label}</p><p className="text-xs text-gray-500">{period.time}</p></td>
                    {days.map((day) => {
                      if (isBreak) return (<td key={day} className="px-4 py-3 text-center"><span className="text-xs text-amber-600 font-medium">Break</span></td>);
                      const entry = getEntry(day, period.num);
                      return (
                        <td key={day} className="px-4 py-3 text-center">
                          {entry?.subject?.name ? (
                            <div><p className="text-xs font-medium text-indigo-700">{entry.subject.name}</p>{entry.class?.name && <p className="text-xs text-gray-500">{entry.class.name}</p>}</div>
                          ) : (<span className="text-xs text-gray-400">-</span>)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!hasTimetableData && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50"><p className="text-xs text-gray-500"><FiAlertCircle className="inline mr-1" />Timetable data will be populated when configured by administration.</p></div>
        )}
      </div>
    </div>
  );
}

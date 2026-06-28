import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { getFullUrl } from "../../utils/url";
import { useNavigate } from "react-router-dom";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock,
  BookOpen, PartyPopper, Trophy, GraduationCap,
  Sun, Filter, X, CalendarDays, AlertCircle,
  Briefcase, RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: "ACADEMIC" | "HOLIDAY" | "EXAM" | "EVENT" | "SPORTS" | "CULTURAL";
  startDate: string;
  endDate: string;
  venue?: string;
  isPublic: boolean;
}

interface CalendarStats {
  totalEvents: number;
  holidaysThisMonth: number;
  workingDays: number;
  examDays: number;
}

// ─────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────

const EVENT_TYPES = {
  ACADEMIC: { label: "Academic", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-900/20", icon: BookOpen },
  HOLIDAY: { label: "Holiday", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", bgLight: "bg-red-50 dark:bg-red-900/20", icon: Sun },
  EXAM: { label: "Exam", color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400", bgLight: "bg-orange-50 dark:bg-orange-900/20", icon: GraduationCap },
  EVENT: { label: "Event", color: "bg-green-500", textColor: "text-green-600 dark:text-green-400", bgLight: "bg-green-50 dark:bg-green-900/20", icon: PartyPopper },
  SPORTS: { label: "Sports", color: "bg-purple-500", textColor: "text-purple-600 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-900/20", icon: Trophy },
  CULTURAL: { label: "Cultural", color: "bg-pink-500", textColor: "text-pink-600 dark:text-pink-400", bgLight: "bg-pink-50 dark:bg-pink-900/20", icon: PartyPopper },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function AcademicCalendar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    totalEvents: 0,
    holidaysThisMonth: 0,
    workingDays: 0,
    examDays: 0,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "ACADEMIC" as keyof typeof EVENT_TYPES,
    startDate: "",
    endDate: "",
    venue: "",
    isPublic: true,
  });

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const res = await axios.get(getFullUrl(`/api/academic/calendar?year=${year}&month=${month}`), { headers });
      setEvents(res.data.events || []);
      setStats(res.data.stats || { totalEvents: 0, holidaysThisMonth: 0, workingDays: 0, examDays: 0 });
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
      // Fallback demo data
      setEvents([
        { id: "1", title: "Summer Vacation Ends", type: "HOLIDAY", startDate: "2026-06-30", endDate: "2026-06-30", isPublic: true },
        { id: "2", title: "Unit Test 1 Begins", type: "EXAM", startDate: "2026-07-15", endDate: "2026-07-20", isPublic: true },
        { id: "3", title: "Independence Day", type: "HOLIDAY", startDate: "2026-08-15", endDate: "2026-08-15", isPublic: true },
        { id: "4", title: "Science Fair", type: "EVENT", startDate: "2026-07-10", endDate: "2026-07-10", venue: "Main Hall", isPublic: true },
        { id: "5", title: "Parent Teacher Meeting", type: "ACADEMIC", startDate: "2026-07-05", endDate: "2026-07-05", isPublic: true },
        { id: "6", title: "Sports Day", type: "SPORTS", startDate: "2026-07-22", endDate: "2026-07-22", venue: "Ground", isPublic: true },
        { id: "7", title: "Annual Day Rehearsal", type: "CULTURAL", startDate: "2026-07-25", endDate: "2026-07-28", isPublic: true },
      ]);
      setStats({ totalEvents: 7, holidaysThisMonth: 2, workingDays: 22, examDays: 5 });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // CALENDAR LOGIC
  // ─────────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: number; month: "prev" | "current" | "next"; fullDate: Date }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        month: "prev",
        fullDate: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        month: "current",
        fullDate: new Date(year, month, i),
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        month: "next",
        fullDate: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const d = new Date(date);
      d.setHours(12, 0, 0, 0);
      return d >= start && d <= end;
    });
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter((e) => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 7);
  }, [events]);

  const filteredEvents = filterType === "ALL" ? events : events.filter((e) => e.type === filterType);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleAddEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(getFullUrl("/api/academic/calendar/events"), newEvent, { headers });
      setShowAddModal(false);
      setNewEvent({ title: "", description: "", type: "ACADEMIC", startDate: "", endDate: "", venue: "", isPublic: true });
      fetchCalendarData();
    } catch (err) {
      console.error("Failed to add event:", err);
      alert("Failed to add event");
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // ─────────────────────────────────────────────────────
  // STAT CARD
  // ─────────────────────────────────────────────────────

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    };
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Calendar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage events, holidays, and important dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={stats.totalEvents} icon={Calendar} color="blue" />
        <StatCard title="Holidays This Month" value={stats.holidaysThisMonth} icon={Sun} color="red" />
        <StatCard title="Working Days" value={stats.workingDays} icon={Briefcase} color="green" />
        <StatCard title="Exam Days" value={stats.examDays} icon={GraduationCap} color="orange" />
      </div>

      {/* Main Content - Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ALL">All Events</option>
                <option value="ACADEMIC">Academic</option>
                <option value="HOLIDAY">Holidays</option>
                <option value="EXAM">Exams</option>
                <option value="EVENT">Events</option>
                <option value="SPORTS">Sports</option>
                <option value="CULTURAL">Cultural</option>
              </select>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day.fullDate);
              const isCurrentMonth = day.month === "current";
              const isTodayDate = isToday(day.fullDate);
              const isSelected = selectedDate && day.fullDate.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day.fullDate)}
                  className={`min-h-[90px] p-2 border-b border-r border-gray-50 dark:border-slate-700/50 cursor-pointer transition-colors
                    ${!isCurrentMonth ? "bg-gray-50/50 dark:bg-slate-800/50" : "hover:bg-gray-50 dark:hover:bg-slate-700/30"}
                    ${isSelected ? "bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-700" : ""}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                    ${isTodayDate ? "bg-indigo-600 text-white" : ""}
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}
                  `}>
                    {day.date}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => {
                      const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];
                      return (
                        <div
                          key={event.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${eventType?.bgLight} ${eventType?.textColor}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-4">
            {Object.entries(EVENT_TYPES).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${value.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{value.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No events on this day</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => {
                    const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];
                    const EventIcon = eventType?.icon || Calendar;
                    return (
                      <div key={event.id} className={`p-3 rounded-lg ${eventType?.bgLight} border border-gray-100 dark:border-slate-600`}>
                        <div className="flex items-center gap-2 mb-1">
                          <EventIcon className={`w-3.5 h-3.5 ${eventType?.textColor}`} />
                          <span className={`text-xs font-medium ${eventType?.textColor}`}>{eventType?.label}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                        {event.venue && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📍 {event.venue}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Upcoming Events
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => {
                  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];
                  const EventIcon = eventType?.icon || Calendar;
                  return (
                    <div key={event.id} className="flex items-start gap-3 group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${eventType?.bgLight}`}>
                        <EventIcon className={`w-4 h-4 ${eventType?.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {event.startDate !== event.endDate && ` - ${new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type *</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EXAM">Exam</option>
                    <option value="EVENT">Event</option>
                    <option value="SPORTS">Sports</option>
                    <option value="CULTURAL">Cultural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                  <input
                    type="text"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Location"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newEvent.isPublic}
                  onChange={(e) => setNewEvent({ ...newEvent, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Visible to all (Public event)
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.startDate || !newEvent.endDate}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

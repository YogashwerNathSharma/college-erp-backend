import { useState, useEffect } from "react";
import axios from "axios";
import {
  UtensilsCrossed, Coffee, Sun, Moon, Plus, Save, Trash2,
  Home, ChevronRight, Loader2, X, AlertCircle, Edit2
} from "lucide-react";

interface MenuItem {
  id?: string;
  name: string;
}

interface DayMenu {
  id?: string;
  day: string;
  breakfast: MenuItem[];
  lunch: MenuItem[];
  dinner: MenuItem[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type MealType = "breakfast" | "lunch" | "dinner";

export default function MessManage() {
  const [menu, setMenu] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
  const [newItem, setNewItem] = useState("");
  const [editMode, setEditMode] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/hostel/mess-menu", { headers });
      const data = res.data.data || [];
      if (data.length > 0) {
        setMenu(data);
      } else {
        setMenu(DAYS.map(day => ({ day, breakfast: [], lunch: [], dinner: [] })));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch menu");
      setMenu(DAYS.map(day => ({ day, breakfast: [], lunch: [], dinner: [] })));
    } finally {
      setLoading(false);
    }
  };

  const currentDayMenu = menu.find(m => m.day === selectedDay) || { day: selectedDay, breakfast: [], lunch: [], dinner: [] };

  const addItem = () => {
    if (!newItem.trim()) return;
    setMenu(prev => prev.map(m => {
      if (m.day === selectedDay) {
        return { ...m, [activeMeal]: [...m[activeMeal], { name: newItem.trim() }] };
      }
      return m;
    }));
    setNewItem("");
  };

  const removeItem = (mealType: MealType, index: number) => {
    setMenu(prev => prev.map(m => {
      if (m.day === selectedDay) {
        return { ...m, [mealType]: m[mealType].filter((_, i) => i !== index) };
      }
      return m;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/hostel/mess-menu", { menu }, { headers });
      setSuccess("Menu saved successfully!");
      setEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  const mealTabs: { key: MealType; label: string; icon: any }[] = [
    { key: "breakfast", label: "Breakfast", icon: Coffee },
    { key: "lunch", label: "Lunch", icon: Sun },
    { key: "dinner", label: "Dinner", icon: Moon },
  ];

  const getMealIcon = (meal: MealType) => {
    const icons = { breakfast: Coffee, lunch: Sun, dinner: Moon };
    const Icon = icons[meal];
    return <Icon size={14} />;
  };

  return (
    <div className="page-container p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 gap-1">
        <Home size={14} /> <ChevronRight size={14} /> <span>Hostel</span> <ChevronRight size={14} /> <span className="text-gray-900 font-medium">Mess Management</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mess Management</h1>
        <div className="flex gap-2">
          {!editMode ? (
            <button onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">
              <Edit2 size={16} /> Edit Menu
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Menu
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16} /> {error} <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <UtensilsCrossed size={16} /> {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Overview Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><UtensilsCrossed size={16} /> Weekly Menu Overview</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Day</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Breakfast</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Lunch</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {menu.map(dayMenu => (
                      <tr key={dayMenu.day} className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedDay === dayMenu.day ? "bg-indigo-50" : ""}`}
                        onClick={() => setSelectedDay(dayMenu.day)}>
                        <td className="px-3 py-2.5">
                          <span className={`text-sm font-medium ${selectedDay === dayMenu.day ? "text-indigo-700" : "text-gray-900"}`}>
                            {dayMenu.day.slice(0, 3)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{dayMenu.breakfast.map(i => i.name).join(", ") || "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{dayMenu.lunch.map(i => i.name).join(", ") || "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{dayMenu.dinner.map(i => i.name).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Day Editor Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>

              {/* Meal Type Tabs */}
              <div className="flex border-b">
                {mealTabs.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setActiveMeal(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      activeMeal === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {currentDayMenu[activeMeal].length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No items added yet</p>
                ) : currentDayMenu[activeMeal].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    {editMode && (
                      <button onClick={() => removeItem(activeMeal, idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Item */}
              {editMode && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      placeholder="Add item..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <button onClick={addItem}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Menu Highlight */}
      {!loading && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><UtensilsCrossed size={18} /> Today's Menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["breakfast", "lunch", "dinner"] as MealType[]).map(meal => {
              const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
              const todayMenu = menu.find(m => m.day === today);
              return (
                <div key={meal} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-2 text-white/90 text-xs font-medium uppercase">
                    {getMealIcon(meal)} {meal}
                  </div>
                  <p className="text-sm text-white/80">
                    {todayMenu?.[meal]?.map(i => i.name).join(", ") || "Not configured"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

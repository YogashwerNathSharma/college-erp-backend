import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const COLORS = ["#e9a63a", "#4f9cf9", "#63e6be", "#ff6b6b", "#a78bfa", "#f59e0b"];

export default function ReportsPage() {
  const stats = useQuery(api.students.dashboardStats, {});

  if (!stats) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
    </div>
  );

  const classData = Object.entries(stats.classCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const genderData = [
    { name: "Male", value: stats.male },
    { name: "Female", value: stats.female },
    { name: "Other", value: stats.total - stats.male - stats.female },
  ].filter((d) => d.value > 0);

  const statusData = [
    { name: "Active", value: stats.active },
    { name: "Pending", value: stats.pending },
    { name: "Transferred", value: stats.transferred },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Comprehensive student analytics and reports</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.total, color: "text-primary" },
          { label: "Active", value: stats.active, color: "text-green-400" },
          { label: "Male", value: stats.male, color: "text-blue-400" },
          { label: "Female", value: stats.female, color: "text-pink-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Class-wise Distribution</CardTitle></CardHeader>
          <CardContent>
            {classData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b9ab2" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8b9ab2" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1e2436", border: "1px solid #2a3150", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#e9a63a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center gap-8">
            {genderData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm w-full">No data</div>
            ) : (
              <>
                <PieChart width={160} height={160}>
                  <Pie data={genderData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {genderData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Status Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "#8b9ab2" }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#8b9ab2" }} width={80} />
                <Tooltip contentStyle={{ background: "#1e2436", border: "1px solid #2a3150", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#4f9cf9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Admissions</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
              ) : stats.recent.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-2.5">
                  <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-muted-foreground">{s.admissionDate ?? "—"}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Users, UserCheck, Clock, ArrowRightLeft, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ["#e9a63a", "#4f9cf9", "#63e6be", "#ff6b6b", "#a78bfa"];

export default function StudentDashboardPage() {
  const stats = useQuery(api.students.dashboardStats, {});

  if (stats === undefined) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const classChartData = Object.entries(stats.classCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const genderData = [
    { name: "Male", value: stats.male },
    { name: "Female", value: stats.female },
    { name: "Other", value: stats.total - stats.male - stats.female },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of all student data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} className="text-white" />}
          label="Total Students"
          value={stats.total}
          color="bg-[oklch(0.55_0.18_55)]"
        />
        <StatCard
          icon={<UserCheck size={22} className="text-white" />}
          label="Active"
          value={stats.active}
          color="bg-[oklch(0.55_0.18_160)]"
        />
        <StatCard
          icon={<Clock size={22} className="text-white" />}
          label="Pending Approval"
          value={stats.pending}
          color="bg-[oklch(0.55_0.18_280)]"
        />
        <StatCard
          icon={<ArrowRightLeft size={22} className="text-white" />}
          label="Transferred"
          value={stats.transferred}
          color="bg-[oklch(0.55_0.18_25)]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              Class-wise Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No class data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8b9ab2" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#8b9ab2" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e2436", border: "1px solid #2a3150", borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="count" fill="oklch(0.72 0.18 55)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={14} className="text-primary" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-8">
            {genderData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm w-full">
                No data yet
              </div>
            ) : (
              <>
                <PieChart width={160} height={160}>
                  <Pie data={genderData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {genderData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="font-semibold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Admissions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent admissions</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recent.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground">{s.className ?? "—"} {s.section ? `• ${s.section}` : ""}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{s.admissionDate ?? "—"}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                      s.status === "active" ? "bg-green-500/20 text-green-400" :
                      s.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

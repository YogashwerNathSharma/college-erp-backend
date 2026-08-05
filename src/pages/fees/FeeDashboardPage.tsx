import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle, Clock, Tag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

const COLORS = ["#e9a63a", "#4f9cf9", "#63e6be", "#ff6b6b", "#a78bfa", "#f59e0b"];

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {sub && <div className="text-xs text-primary mt-0.5">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function fmt(n: number) {
  return "\u20B9" + n.toLocaleString("en-IN");
}

export default function FeeDashboardPage() {
  const stats = useQuery(api.fees.feeStats, {});
  const navigate = useNavigate();

  if (!stats) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const modeData = Object.entries(stats.byMode).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  const feeTypeData = Object.entries(stats.byFeeType).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fee Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of all fee collections</p>
        </div>
        <Button onClick={() => navigate("/fees/collect")} className="cursor-pointer gap-2">
          <IndianRupee size={14} /> Collect Fee
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<IndianRupee size={20} className="text-white" />} label="Total Collected" value={fmt(stats.totalCollected)} color="bg-[oklch(0.55_0.18_55)]" />
        <StatCard icon={<AlertCircle size={20} className="text-white" />} label="Total Due" value={fmt(stats.totalDue)} color="bg-[oklch(0.55_0.18_25)]" />
        <StatCard icon={<CheckCircle size={20} className="text-white" />} label="Paid" value={String(stats.paidCount)} sub={`${stats.partialCount} partial`} color="bg-[oklch(0.55_0.18_160)]" />
        <StatCard icon={<Clock size={20} className="text-white" />} label="Pending" value={String(stats.dueCount)} sub={`${stats.total} total`} color="bg-[oklch(0.55_0.18_280)]" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={13} className="text-primary" /> Collection by Fee Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeTypeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={feeTypeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8b9ab2" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8b9ab2" }} tickFormatter={(v) => "\u20B9" + (v / 1000).toFixed(0) + "k"} />
                  <Tooltip
                    contentStyle={{ background: "#1e2436", border: "1px solid #2a3150", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => typeof v === "number" ? fmt(v) : String(v ?? "")}
                  />
                  <Bar dataKey="value" fill="#e9a63a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag size={13} className="text-primary" /> Payment Mode Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-6">
            {modeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm w-full">No payments yet</div>
            ) : (
              <>
                <PieChart width={150} height={150}>
                  <Pie data={modeData} cx={70} cy={70} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {modeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {modeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="font-semibold">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Discount Given", value: fmt(stats.totalDiscount), color: "text-blue-400" },
          { label: "Total Fine Collected", value: fmt(stats.totalFine), color: "text-red-400" },
          { label: "Partial Payments", value: String(stats.partialCount), color: "text-yellow-400" },
          { label: "Total Transactions", value: String(stats.total), color: "text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

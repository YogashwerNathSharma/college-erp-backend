import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { Search, Trash2, Receipt } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";

export default function FeePaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { results, status, loadMore } = usePaginatedQuery(
    api.fees.listPayments,
    { status: statusFilter },
    { initialNumItems: 30 }
  );

  const deletePayment = useMutation(api.fees.deletePayment);

  const filtered = search
    ? results.filter((p) =>
        `${p.studentName} ${p.admissionNo} ${p.receiptNo} ${p.feeType}`.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  const handleDelete = async (id: Id<"feePayments">) => {
    await deletePayment({ id });
    toast.success("Payment record deleted");
  };

  const statusBadge = (s: string) => {
    const cls =
      s === "paid" ? "bg-green-500/15 text-green-400" :
      s === "partial" ? "bg-yellow-500/15 text-yellow-400" :
      s === "due" ? "bg-red-500/15 text-red-400" :
      "bg-muted text-muted-foreground";
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>;
  };

  const totalShown = filtered.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Fee Payments</h1>
          <p className="text-sm text-muted-foreground">All payment transactions</p>
        </div>
        <Button onClick={() => navigate("/fees/collect")} className="cursor-pointer gap-2 shrink-0">
          <Receipt size={14} /> Collect Fee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by student, receipt, fee type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="due">Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-4 bg-muted/30 rounded-lg px-4 py-2 text-sm">
          <span className="text-muted-foreground">{filtered.length} records</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-green-400 font-semibold">Collected: \u20B9{totalShown.toLocaleString("en-IN")}</span>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Receipt No</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Student</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Fee Type</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Paid</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Balance</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === "LoadingFirstPage"
                ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={8} className="px-4 py-3"><Skeleton className="h-7" /></td>
                  </tr>
                ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                      <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                      No payment records found
                    </td>
                  </tr>
                )
                : filtered.map((p) => (
                  <tr key={p._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.receiptNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{p.studentName}</div>
                      <div className="text-xs text-muted-foreground">{p.admissionNo} \u00B7 {p.className}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{p.feeType}</div>
                      {p.month && <div className="text-xs text-muted-foreground">{p.month}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{p.paymentDate}</td>
                    <td className="px-4 py-3 font-semibold text-green-400">\u20B9{p.amountPaid.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.balance > 0
                        ? <span className="text-red-400 font-medium">\u20B9{p.balance.toLocaleString("en-IN")}</span>
                        : <span className="text-green-400">\u2014</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(p._id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => loadMore(30)} className="cursor-pointer">Load More</Button>
        </div>
      )}
    </div>
  );
}

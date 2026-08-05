import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function AdmissionApprovalPage() {
  const { results, status } = usePaginatedQuery(
    api.students.list,
    { approvalStatus: "pending" },
    { initialNumItems: 20 }
  );
  const updateApproval = useMutation(api.students.updateApproval);

  const handleApprove = async (id: Id<"students">) => {
    await updateApproval({ id, approvalStatus: "approved", status: "active" });
    toast.success("Student admission approved");
  };

  const handleReject = async (id: Id<"students">) => {
    await updateApproval({ id, approvalStatus: "rejected", status: "inactive" });
    toast.error("Admission rejected");
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Admission Approval</h1>
        <p className="text-sm text-muted-foreground">Review and approve pending student admissions</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Student</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Admission No</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Class</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "LoadingFirstPage"
              ? [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              : results.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                    <Clock size={32} className="mx-auto mb-2 opacity-40" />
                    No pending admissions
                  </td>
                </tr>
              )
              : results.map((s) => (
                <tr key={s._id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-muted-foreground">{s.fatherName ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.admissionNo}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.className ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="bg-yellow-500/15 text-yellow-400 text-xs px-2 py-1 rounded-full">Pending</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={() => handleApprove(s._id)} className="cursor-pointer h-7 text-xs gap-1">
                        <CheckCircle size={12} /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(s._id)} className="cursor-pointer h-7 text-xs gap-1">
                        <XCircle size={12} /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

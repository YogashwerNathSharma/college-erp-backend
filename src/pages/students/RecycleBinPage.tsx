import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { Trash2, RotateCcw } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { format } from "date-fns";

export default function RecycleBinPage() {
  const { results, status } = usePaginatedQuery(api.students.getDeleted, {}, { initialNumItems: 20 });
  const restore = useMutation(api.students.restore);

  const handleRestore = async (id: Id<"students">) => {
    await restore({ id });
    toast.success("Student restored successfully");
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Recycle Bin</h1>
        <p className="text-sm text-muted-foreground">Deleted students — restore or permanently remove</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Student</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Adm. No</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Deleted</th>
              <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "LoadingFirstPage"
              ? [...Array(4)].map((_, i) => <tr key={i} className="border-b border-border"><td colSpan={4} className="px-4 py-3"><Skeleton className="h-8" /></td></tr>)
              : results.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm">
                    <Trash2 size={36} className="mx-auto mb-2 opacity-30" />
                    Recycle bin is empty
                  </td>
                </tr>
              )
              : results.map((s) => (
                <tr key={s._id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-muted-foreground">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-muted-foreground">{s.className ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.admissionNo}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {s.deletedAt ? format(new Date(s.deletedAt), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs cursor-pointer gap-1"
                      onClick={() => handleRestore(s._id)}
                    >
                      <RotateCcw size={11} /> Restore
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

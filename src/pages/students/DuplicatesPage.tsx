import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function DuplicatesPage() {
  const { results, status } = usePaginatedQuery(api.students.list, {}, { initialNumItems: 100 });

  const nameCounts: Record<string, typeof results> = {};
  for (const s of results) {
    const key = `${s.firstName} ${s.lastName}`.toLowerCase();
    if (!nameCounts[key]) nameCounts[key] = [];
    nameCounts[key].push(s);
  }
  const duplicates = Object.entries(nameCounts).filter(([, students]) => students.length > 1);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Duplicate Manager</h1>
        <p className="text-sm text-muted-foreground">Find and manage duplicate student records</p>
      </div>

      {status === "LoadingFirstPage" ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : duplicates.length === 0 ? (
        <div className="text-center py-16">
          <Copy size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <div className="text-muted-foreground text-sm">No duplicate records found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {duplicates.map(([name, students]) => (
            <div key={name} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-amber-400">{name} — {students.length} records</div>
                <Button size="sm" variant="secondary" className="h-7 text-xs cursor-pointer" onClick={() => toast.info("Merge functionality coming soon")}>
                  Merge Records
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {students.map((s) => (
                  <div key={s._id} className="bg-background/50 rounded-md p-2.5 text-xs">
                    <div className="font-medium">{s.admissionNo}</div>
                    <div className="text-muted-foreground">{s.className ?? "—"} • {s.section ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

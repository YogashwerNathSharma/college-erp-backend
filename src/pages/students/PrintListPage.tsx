import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Printer } from "lucide-react";

export default function PrintListPage() {
  const { results, status } = usePaginatedQuery(api.students.list, { status: "active" }, { initialNumItems: 50 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Print List</h1>
          <p className="text-sm text-muted-foreground">Print student lists and rosters</p>
        </div>
        <Button onClick={() => window.print()} className="cursor-pointer gap-2">
          <Printer size={14} /> Print
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">#</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Name</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Adm. No</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Class</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Father</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Phone</th>
            </tr>
          </thead>
          <tbody>
            {status === "LoadingFirstPage"
              ? [...Array(8)].map((_, i) => <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-3"><Skeleton className="h-6" /></td></tr>)
              : results.map((s, idx) => (
                <tr key={s._id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.admissionNo}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{s.className ?? "—"} {s.section ?? ""}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{s.fatherName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{s.fatherPhone ?? s.phone ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

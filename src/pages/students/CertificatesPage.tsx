import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesPage() {
  const { results, status } = usePaginatedQuery(api.students.list, { status: "active" }, { initialNumItems: 20 });

  const certTypes = ["Transfer Certificate", "Bonafide Certificate", "Character Certificate", "Migration Certificate"];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Certificates</h1>
        <p className="text-sm text-muted-foreground">Generate and manage student certificates</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {certTypes.map((t) => (
          <div key={t} className="bg-card border border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <FileText size={28} className="mx-auto mb-2 text-primary" />
            <div className="text-xs font-medium text-foreground">{t}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Student</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Class</th>
              <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Generate</th>
            </tr>
          </thead>
          <tbody>
            {status === "LoadingFirstPage"
              ? [...Array(5)].map((_, i) => <tr key={i} className="border-b border-border"><td colSpan={3} className="px-4 py-3"><Skeleton className="h-8" /></td></tr>)
              : results.map((s) => (
                <tr key={s._id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.firstName} {s.lastName}</div>
                    <div className="text-xs text-muted-foreground">{s.admissionNo}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.className ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" className="cursor-pointer gap-1 h-7 text-xs" onClick={() => toast.info("Certificate generation coming soon")}>
                      <Download size={12} /> Generate
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

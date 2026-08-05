import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { CreditCard, Printer, Search } from "lucide-react";
import { toast } from "sonner";

export default function IdCardPage() {
  const [search, setSearch] = useState("");
  const { results, status } = usePaginatedQuery(api.students.list, { status: "active" }, { initialNumItems: 20 });

  const filtered = search
    ? results.filter((s) => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(search.toLowerCase()))
    : results;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ID Card</h1>
          <p className="text-sm text-muted-foreground">Generate and print student ID cards</p>
        </div>
        <Button onClick={() => toast.info("Bulk print coming soon")} className="cursor-pointer gap-2">
          <Printer size={14} /> Print All
        </Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {status === "LoadingFirstPage"
          ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />)
          : filtered.map((s) => (
            <div key={s._id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
              <div className="bg-primary/20 px-4 py-2 flex items-center gap-2">
                <CreditCard size={12} className="text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">RMS Academy</span>
              </div>
              <div className="p-4 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary mx-auto">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div>
                  <div className="font-bold text-sm">{s.firstName} {s.lastName}</div>
                  <div className="text-xs text-muted-foreground">{s.className ?? "—"} {s.section ? `• ${s.section}` : ""}</div>
                </div>
                <div className="text-xs bg-muted/40 rounded px-2 py-0.5 font-mono">{s.admissionNo}</div>
                {s.fatherName && <div className="text-xs text-muted-foreground">F: {s.fatherName}</div>}
              </div>
              <div className="px-4 pb-3">
                <Button size="sm" variant="secondary" className="w-full h-7 text-xs cursor-pointer gap-1" onClick={() => toast.info("ID card print coming soon")}>
                  <Printer size={11} /> Print Card
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

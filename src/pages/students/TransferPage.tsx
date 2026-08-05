import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ArrowRightLeft } from "lucide-react";

export default function TransferPage() {
  const [selectedId, setSelectedId] = useState<Id<"students"> | null>(null);
  const [toSchool, setToSchool] = useState("");
  const [toClass, setToClass] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { results, status } = usePaginatedQuery(api.students.list, { status: "active" }, { initialNumItems: 50 });
  const updateStudent = useMutation(api.students.update);

  const filtered = search
    ? results.filter((s) => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(search.toLowerCase()))
    : results;

  const handleTransfer = async () => {
    if (!selectedId) { toast.error("Select a student"); return; }
    setLoading(true);
    try {
      await updateStudent({ id: selectedId, status: "transferred" });
      toast.success("Student transferred successfully");
      setSelectedId(null);
      setToSchool(""); setToClass(""); setReason("");
    } catch {
      toast.error("Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const selected = results.find((s) => s._id === selectedId);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Student Transfer</h1>
        <p className="text-sm text-muted-foreground">Transfer students to another school or class</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Select Student</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {status === "LoadingFirstPage"
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)
                : filtered.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setSelectedId(s._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left cursor-pointer transition-colors ${
                      selectedId === s._id ? "bg-primary/20 border border-primary/30" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground">{s.className ?? "—"} • {s.admissionNo}</div>
                    </div>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Transfer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selected && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="font-medium">{selected.firstName} {selected.lastName}</div>
                <div className="text-xs text-muted-foreground">Current: {selected.className ?? "—"}</div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Transfer to School</Label>
              <Input value={toSchool} onChange={(e) => setToSchool(e.target.value)} placeholder="School name" />
            </div>
            <div className="space-y-1.5">
              <Label>Transfer to Class</Label>
              <Input value={toClass} onChange={(e) => setToClass(e.target.value)} placeholder="Class name" />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for transfer" />
            </div>
            <Button className="w-full cursor-pointer gap-2" onClick={handleTransfer} disabled={loading || !selectedId}>
              <ArrowRightLeft size={14} />
              {loading ? "Processing..." : "Transfer Student"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ArrowRight } from "lucide-react";

export default function PromotionPage() {
  const [selectedIds, setSelectedIds] = useState<Id<"students">[]>([]);
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newYear, setNewYear] = useState("");
  const [loading, setLoading] = useState(false);

  const { results, status } = usePaginatedQuery(
    api.students.list, { status: "active" }, { initialNumItems: 50 }
  );
  const promote = useMutation(api.students.promote);

  const toggle = (id: Id<"students">) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePromote = async () => {
    if (!newClass) { toast.error("Please enter new class"); return; }
    if (selectedIds.length === 0) { toast.error("Select at least one student"); return; }
    setLoading(true);
    try {
      const res = await promote({ studentIds: selectedIds, newClassName: newClass, newSection: newSection || undefined, academicYear: newYear || undefined });
      toast.success(`${res.promoted} students promoted to ${newClass}`);
      setSelectedIds([]);
    } catch {
      toast.error("Promotion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Promotion</h1>
        <p className="text-sm text-muted-foreground">Promote students to the next class</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Select Students</CardTitle></CardHeader>
          <CardContent>
            {status === "LoadingFirstPage" ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === results.length && results.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? results.map((s) => s._id) : [])}
                    className="cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Select All ({results.length})</span>
                </div>
                {results.map((s) => (
                  <label key={s._id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s._id)}
                      onChange={() => toggle(s._id)}
                      className="cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground">{s.className ?? "—"} {s.section ?? ""} • {s.admissionNo}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Promote To</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Class *</Label>
              <Input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="e.g. Class 11" />
            </div>
            <div className="space-y-1.5">
              <Label>New Section</Label>
              <Input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. A" />
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="2025-2026" />
            </div>
            <div className="pt-2 space-y-2">
              <div className="text-xs text-muted-foreground">{selectedIds.length} student(s) selected</div>
              <Button className="w-full cursor-pointer gap-2" onClick={handlePromote} disabled={loading}>
                <ArrowRight size={14} />
                {loading ? "Promoting..." : "Promote Students"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

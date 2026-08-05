import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, IndianRupee, Check, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const FEE_TYPES = ["Tuition Fee", "Exam Fee", "Transport Fee", "Library Fee", "Sports Fee", "Lab Fee", "Development Fee", "Miscellaneous"];
const FREQUENCIES = ["monthly", "quarterly", "annual", "one-time"];
const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

type EditRow = {
  id: Id<"feeStructures"> | null;
  className: string;
  academicYear: string;
  feeType: string;
  amount: string;
  frequency: string;
  dueDate: string;
  description: string;
};

const emptyRow = (): EditRow => ({
  id: null, className: "", academicYear: CURRENT_YEAR,
  feeType: "", amount: "", frequency: "monthly", dueDate: "", description: "",
});

export default function FeeStructurePage() {
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [editRow, setEditRow] = useState<EditRow | null>(null);
  const [saving, setSaving] = useState(false);

  const structures = useQuery(api.fees.listStructures, { academicYear: filterYear });
  const createStructure = useMutation(api.fees.createStructure);
  const updateStructure = useMutation(api.fees.updateStructure);
  const deleteStructure = useMutation(api.fees.deleteStructure);

  const handleSave = async () => {
    if (!editRow) return;
    if (!editRow.className || !editRow.feeType || !editRow.amount) {
      toast.error("Please fill Class, Fee Type, and Amount");
      return;
    }
    const amt = parseFloat(editRow.amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }

    setSaving(true);
    try {
      if (editRow.id) {
        await updateStructure({
          id: editRow.id,
          feeType: editRow.feeType,
          amount: amt,
          frequency: editRow.frequency,
          dueDate: editRow.dueDate || undefined,
          description: editRow.description || undefined,
        });
        toast.success("Fee structure updated");
      } else {
        await createStructure({
          className: editRow.className,
          academicYear: editRow.academicYear,
          feeType: editRow.feeType,
          amount: amt,
          frequency: editRow.frequency,
          dueDate: editRow.dueDate || undefined,
          description: editRow.description || undefined,
        });
        toast.success("Fee structure created");
      }
      setEditRow(null);
    } catch {
      toast.error("Failed to save fee structure");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"feeStructures">) => {
    await deleteStructure({ id });
    toast.success("Deleted");
  };

  const grouped: Record<string, typeof structures> = {};
  for (const s of structures ?? []) {
    if (!grouped[s.className]) grouped[s.className] = [];
    grouped[s.className]!.push(s);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Fee Structure</h1>
          <p className="text-sm text-muted-foreground">Define fee heads per class and academic year</p>
        </div>
        <div className="flex gap-3">
          <Input
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            placeholder="Academic Year e.g. 2024-2025"
            className="w-44"
          />
          <Button onClick={() => setEditRow(emptyRow())} className="cursor-pointer gap-2 shrink-0">
            <Plus size={14} /> Add Fee Head
          </Button>
        </div>
      </div>

      {editRow && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{editRow.id ? "Edit Fee Head" : "New Fee Head"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Class *</Label>
                <Input value={editRow.className} onChange={(e) => setEditRow({ ...editRow, className: e.target.value })} placeholder="e.g. Class 10" disabled={!!editRow.id} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Academic Year *</Label>
                <Input value={editRow.academicYear} onChange={(e) => setEditRow({ ...editRow, academicYear: e.target.value })} placeholder="2024-2025" disabled={!!editRow.id} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fee Type *</Label>
                <Select value={editRow.feeType} onValueChange={(v) => setEditRow({ ...editRow, feeType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount (\u20B9) *</Label>
                <Input type="number" value={editRow.amount} onChange={(e) => setEditRow({ ...editRow, amount: e.target.value })} placeholder="e.g. 1500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Select value={editRow.frequency} onValueChange={(v) => setEditRow({ ...editRow, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input type="date" value={editRow.dueDate} onChange={(e) => setEditRow({ ...editRow, dueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input value={editRow.description} onChange={(e) => setEditRow({ ...editRow, description: e.target.value })} placeholder="Optional note" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSave} disabled={saving} className="cursor-pointer gap-1.5">
                <Check size={13} /> {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={() => setEditRow(null)} className="cursor-pointer gap-1.5">
                <X size={13} /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {structures === undefined ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <IndianRupee size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No fee structures defined for {filterYear}</p>
          <Button className="mt-4 cursor-pointer" onClick={() => setEditRow(emptyRow())}>Add First Fee Head</Button>
        </div>
      ) : (
        Object.entries(grouped).map(([cls, rows]) => (
          <Card key={cls}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold text-primary">{cls} \u2014 {filterYear}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-y border-border">
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Fee Type</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Frequency</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium hidden md:table-cell">Due Date</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium hidden md:table-cell">Description</th>
                      <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows?.map((r) => (
                      <tr key={r._id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{r.feeType}</td>
                        <td className="px-4 py-3 text-primary font-semibold">\u20B9{r.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{r.frequency}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.dueDate || "\u2014"}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.description || "\u2014"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                              onClick={() => setEditRow({ id: r._id, className: r.className, academicYear: r.academicYear, feeType: r.feeType, amount: String(r.amount), frequency: r.frequency, dueDate: r.dueDate ?? "", description: r.description ?? "" })}>
                              <Pencil size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(r._id)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

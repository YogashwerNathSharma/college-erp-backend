import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import { Bookmark, Trash2, Plus } from "lucide-react";

type SavedFilter = { id: string; name: string; filters: Record<string, string>; createdAt: string };

const defaultFilters: SavedFilter[] = [
  { id: "1", name: "Active Class 10 Students", filters: { status: "active", className: "Class 10" }, createdAt: "2024-01-15" },
  { id: "2", name: "Pending Approvals", filters: { approvalStatus: "pending" }, createdAt: "2024-01-18" },
];

export default function SavedFiltersPage() {
  const [filters, setFilters] = useState<SavedFilter[]>(defaultFilters);
  const [newName, setNewName] = useState("");

  const handleSave = () => {
    if (!newName) { toast.error("Enter a filter name"); return; }
    setFilters((p) => [...p, {
      id: Date.now().toString(), name: newName,
      filters: { status: "active" },
      createdAt: new Date().toLocaleDateString(),
    }]);
    toast.success("Filter saved");
    setNewName("");
  };

  const handleDelete = (id: string) => {
    setFilters((p) => p.filter((f) => f.id !== id));
    toast.success("Filter deleted");
  };

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Saved Filters</h1>
        <p className="text-sm text-muted-foreground">Save and reuse your frequent search filters</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Save New Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Filter name..." className="flex-1" />
            <Button onClick={handleSave} className="cursor-pointer gap-1.5"><Plus size={14} /> Save</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Bookmark size={40} className="mx-auto mb-2 opacity-30" />
            No saved filters yet
          </div>
        ) : filters.map((f) => (
          <div key={f.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Bookmark size={14} className="text-primary shrink-0" />
              <div>
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {Object.entries(f.filters).map(([k, v]) => `${k}: ${v}`).join(" • ")} — {f.createdAt}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="h-7 text-xs cursor-pointer" onClick={() => toast.info("Applying filter...")}>
                Apply
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => handleDelete(f.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { ArrowLeft, Plus, Printer, Trash2, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { HallSeatingGrid } from "./_components/HallSeatingGrid.tsx";

export default function SeatingPlan() {
  const exams = useQuery(api.exams.list, {});
  const classes = useQuery(api.students.listClassesWithCounts, {});
  const createExam = useMutation(api.exams.create);
  const generateSeating = useMutation(api.exams.generateSeating);
  const removeExam = useMutation(api.exams.remove);

  const [selectedExamId, setSelectedExamId] = useState<Id<"exams"> | null>(null);
  const [selectedHall, setSelectedHall] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    name: "", date: "",
    academicYear: `${currentYear}-${currentYear + 1}`,
    selectedClasses: [] as string[],
    studentsPerSeat: 1, totalHalls: 1, seatsPerRow: 3, rowsPerHall: 10,
  });

  const selectedExam = useQuery(api.exams.getById, selectedExamId ? { id: selectedExamId } : "skip");
  const allocations = useQuery(
    api.exams.getAllocationsByHall,
    selectedExamId && selectedExam?.status === "published"
      ? { examId: selectedExamId, hallNo: selectedHall } : "skip"
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.date || form.selectedClasses.length === 0) {
      toast.error("Please fill all required fields and select at least one class"); return;
    }
    try {
      const id = await createExam({
        name: form.name.trim(), date: form.date, academicYear: form.academicYear,
        classes: form.selectedClasses, studentsPerSeat: form.studentsPerSeat,
        totalHalls: form.totalHalls, seatsPerRow: form.seatsPerRow, rowsPerHall: form.rowsPerHall,
      });
      toast.success("Exam created!");
      setCreateOpen(false); setSelectedExamId(id); setSelectedHall(1);
      setForm({ name: "", date: "", academicYear: `${currentYear}-${currentYear + 1}`, selectedClasses: [], studentsPerSeat: 1, totalHalls: 1, seatsPerRow: 3, rowsPerHall: 10 });
    } catch { toast.error("Failed to create exam"); }
  };

  const handleGenerate = async () => {
    if (!selectedExamId) return;
    setGenerating(true);
    try {
      const result = await generateSeating({ examId: selectedExamId });
      if (result.allocated === 0) toast.warning("No students found for selected classes.");
      else toast.success(`Seating generated for ${result.allocated} students!`);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setGenerating(false); }
  };

  const handleDelete = async (id: Id<"exams">) => {
    try {
      await removeExam({ id });
      if (selectedExamId === id) setSelectedExamId(null);
      toast.success("Exam deleted");
    } catch { toast.error("Failed to delete exam"); }
  };

  const toggleClass = (cls: string) =>
    setForm((f) => ({
      ...f,
      selectedClasses: f.selectedClasses.includes(cls)
        ? f.selectedClasses.filter((c) => c !== cls)
        : [...f.selectedClasses, cls],
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-4 print:hidden">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-xl">Seating Plan</h1>
        <div className="ml-auto flex gap-2">
          {selectedExamId && selectedExam?.status === "published" && (
            <Button variant="secondary" size="sm" onClick={() => window.print()} className="cursor-pointer">
              <Printer className="w-4 h-4 mr-2" />Print Hall {selectedHall}
            </Button>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer"><Plus className="w-4 h-4 mr-2" />New Exam</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Exam Name *</Label>
                  <Input placeholder="e.g. Final Exam 2025" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Exam Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
                  <div><Label>Academic Year</Label><Input value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Select Classes *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {classes === undefined ? <Skeleton className="h-8 w-48" />
                    : classes.length === 0 ? <p className="text-sm text-muted-foreground">No students found.</p>
                    : classes.map(({ name, count }) => (
                      <button key={name} type="button" onClick={() => toggleClass(name)}
                        className={`px-3 py-1 rounded-full text-sm border cursor-pointer transition-colors ${
                          form.selectedClasses.includes(name) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"
                        }`}>
                        {name} <span className="ml-1 opacity-60 text-xs">({count})</span>
                      </button>
                    ))}
                  </div>
                  {form.selectedClasses.length > 0 && <p className="text-xs text-muted-foreground mt-1">Selected: {form.selectedClasses.join(", ")}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Students per Seat</Label><Input type="number" min={1} max={3} value={form.studentsPerSeat} onChange={(e) => setForm((f) => ({ ...f, studentsPerSeat: Number(e.target.value) }))} /></div>
                  <div><Label>Total Halls</Label><Input type="number" min={1} value={form.totalHalls} onChange={(e) => setForm((f) => ({ ...f, totalHalls: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Seats per Row</Label><Input type="number" min={1} max={10} value={form.seatsPerRow} onChange={(e) => setForm((f) => ({ ...f, seatsPerRow: Number(e.target.value) }))} /></div>
                  <div><Label>Rows per Hall</Label><Input type="number" min={1} value={form.rowsPerHall} onChange={(e) => setForm((f) => ({ ...f, rowsPerHall: Number(e.target.value) }))} /></div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">Capacity Preview</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {form.totalHalls} &times; {form.rowsPerHall} rows &times; {form.seatsPerRow} seats &times; {form.studentsPerSeat}/seat = <strong>{form.totalHalls * form.rowsPerHall * form.seatsPerRow * form.studentsPerSeat} max</strong>
                  </p>
                </div>
                <Button onClick={handleCreate} className="w-full cursor-pointer">Create Exam</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-72 border-r overflow-y-auto p-4 space-y-2 print:hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Exams</p>
          {exams === undefined ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : exams.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No exams yet. Click &ldquo;New Exam&rdquo; to create one.</p>
          ) : exams.map((exam) => (
            <div key={exam._id} onClick={() => { setSelectedExamId(exam._id); setSelectedHall(1); }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedExamId === exam._id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{exam.name}</p>
                  <p className={`text-xs mt-0.5 ${selectedExamId === exam._id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(exam.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={exam.status === "published" ? "default" : "secondary"} className="text-xs">{exam.status}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(exam._id); }} className="text-destructive opacity-60 hover:opacity-100 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </aside>
        <main className="flex-1 overflow-auto p-4">
          {!selectedExamId ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2"><Users className="w-12 h-12 mx-auto opacity-30" /><p>Select an exam to view seating plan</p></div>
            </div>
          ) : selectedExam === undefined || selectedExam === null ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <div>
                  <h2 className="text-xl font-bold">{selectedExam.name}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(selectedExam.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} &bull; {selectedExam.academicYear}</p>
                </div>
                <div className="ml-auto">
                  <Button size="sm" onClick={handleGenerate} disabled={generating} className="cursor-pointer">
                    <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                    {selectedExam.status === "published" ? "Regenerate" : "Generate Seating"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs print:hidden">
                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">Classes: {selectedExam.classes.join(", ")}</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{selectedExam.studentsPerSeat} student(s)/seat</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{selectedExam.totalHalls} hall(s)</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{selectedExam.seatsPerRow} seats/row &times; {selectedExam.rowsPerHall} rows</span>
              </div>
              {selectedExam.status === "draft" && (
                <Card><CardHeader><CardTitle className="text-base">Ready to Generate</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground text-sm">Click &ldquo;Generate Seating&rdquo; to automatically create an interleaved seating arrangement.</p></CardContent>
                </Card>
              )}
              {selectedExam.status === "published" && (
                <>
                  <div className="flex gap-2 flex-wrap print:hidden">
                    {Array.from({ length: selectedExam.totalHalls }, (_, i) => i + 1).map((hall) => (
                      <button key={hall} onClick={() => setSelectedHall(hall)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                          selectedHall === hall ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
                        }`}>
                        Hall {hall}
                      </button>
                    ))}
                  </div>
                  <HallSeatingGrid allocations={allocations} hallNo={selectedHall} exam={selectedExam} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

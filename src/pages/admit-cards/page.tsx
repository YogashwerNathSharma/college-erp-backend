import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { AdmitCardGrid } from "./_components/AdmitCardGrid.tsx";

export default function AdmitCards() {
  const exams = useQuery(api.exams.list, {});
  const [selectedExamId, setSelectedExamId] = useState<Id<"exams"> | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const selectedExam = useQuery(api.exams.getById, selectedExamId ? { id: selectedExamId } : "skip");
  const publishedExams = exams?.filter((e) => e.status === "published");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-3 flex items-center gap-4 print:hidden">
        <Link to="/" className="text-muted-foreground hover:text-foreground cursor-pointer"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-xl">Admit Cards</h1>
        {selectedExamId && selectedExam?.status === "published" && (
          <Button variant="secondary" size="sm" onClick={() => window.print()} className="ml-auto cursor-pointer">
            <Printer className="w-4 h-4 mr-2" />Print All
          </Button>
        )}
      </div>
      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-64 border-r overflow-y-auto p-4 space-y-2 print:hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">Published Exams</p>
          {exams === undefined ? (
            <div className="space-y-2">{[1,2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (publishedExams?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground px-1">No published exams. Generate seating first.</p>
          ) : publishedExams?.map((exam) => (
            <div key={exam._id} onClick={() => { setSelectedExamId(exam._id); setSelectedClass("all"); }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedExamId === exam._id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
              }`}>
              <p className="font-medium text-sm truncate">{exam.name}</p>
              <p className={`text-xs mt-0.5 ${selectedExamId === exam._id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(exam.date).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))}
        </aside>
        <main className="flex-1 overflow-auto p-4">
          {!selectedExamId ? (
            <div className="h-full flex items-center justify-center text-muted-foreground"><p>Select an exam to view admit cards</p></div>
          ) : selectedExam === undefined || selectedExam === null ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="print:hidden">
                <h2 className="text-xl font-bold">{selectedExam.name}</h2>
                <p className="text-sm text-muted-foreground">{new Date(selectedExam.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={() => setSelectedClass("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
                    selectedClass === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
                  }`}>All Classes</button>
                {selectedExam.classes.map((cls) => (
                  <button key={cls} onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer transition-colors ${
                      selectedClass === cls ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent border-border"
                    }`}>{cls}</button>
                ))}
              </div>
              <AdmitCardGrid examId={selectedExamId} exam={selectedExam} filterClass={selectedClass === "all" ? undefined : selectedClass} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

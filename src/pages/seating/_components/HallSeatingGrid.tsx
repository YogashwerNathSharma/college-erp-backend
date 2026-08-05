import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Allocation = { _id: string; hallNo: number; rowNo: number; seatNo: number; globalSeatNo: number; admissionNo: string; studentName: string; className: string; section?: string; rollNo?: string; };
type Exam = Doc<"exams">;
type Props = { allocations: Allocation[] | undefined; hallNo: number; exam: Exam; };

function buildGrid(allocations: Allocation[], seatsPerRow: number, rowsPerHall: number): Allocation[][][] {
  const grid: Allocation[][][] = Array.from({ length: rowsPerHall }, () => Array.from({ length: seatsPerRow }, () => []));
  for (const alloc of allocations) {
    const r = alloc.rowNo - 1; const s = alloc.seatNo - 1;
    if (r >= 0 && r < rowsPerHall && s >= 0 && s < seatsPerRow) grid[r][s].push(alloc);
  }
  return grid;
}

const CLASS_COLORS: string[] = [
  "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200",
  "bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200",
  "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-200",
  "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200",
  "bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-200",
];

function getClassColor(className: string, classes: string[]): string {
  const idx = classes.indexOf(className);
  return CLASS_COLORS[idx % CLASS_COLORS.length] ?? CLASS_COLORS[0]!;
}

export function HallSeatingGrid({ allocations, hallNo, exam }: Props) {
  if (allocations === undefined) return <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (allocations.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">No students allocated to Hall {hallNo}.</p>;

  const grid = buildGrid(allocations, exam.seatsPerRow, exam.rowsPerHall);
  const seatsPerHall = exam.seatsPerRow * exam.rowsPerHall;

  return (
    <div className="space-y-4">
      <div className="hidden print:block text-center mb-4">
        <h2 className="text-xl font-bold">{exam.name}</h2>
        <p className="text-sm">Date: {new Date(exam.date).toLocaleDateString("en-IN")} &bull; Hall No: {hallNo}</p>
        <p className="text-xs text-gray-500">{exam.studentsPerSeat} student(s) per seat &bull; {exam.seatsPerRow} seats per row</p>
      </div>
      <div className="flex flex-wrap gap-2 print:hidden">
        {exam.classes.map((cls, i) => (
          <span key={cls} className={`text-xs px-2 py-1 rounded-full font-medium ${CLASS_COLORS[i % CLASS_COLORS.length]}`}>{cls}</span>
        ))}
      </div>
      <div className="w-full rounded-lg bg-slate-800 text-white text-center py-2 text-sm font-semibold tracking-widest print:border print:border-gray-800 print:bg-transparent print:text-black">
        BLACKBOARD / FRONT OF HALL
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: `auto repeat(${exam.seatsPerRow}, 1fr)` }}>
            <div className="text-xs text-muted-foreground font-medium text-center w-10">Row</div>
            {Array.from({ length: exam.seatsPerRow }, (_, i) => (
              <div key={i} className="text-xs text-muted-foreground text-center font-medium">Col {i + 1}</div>
            ))}
          </div>
          {grid.map((row, rowIdx) => {
            const hasAny = row.some((cell) => cell.length > 0);
            if (!hasAny) return null;
            return (
              <div key={rowIdx} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `auto repeat(${exam.seatsPerRow}, 1fr)` }}>
                <div className="text-xs text-muted-foreground font-semibold text-center w-10 flex items-center justify-center">R{rowIdx + 1}</div>
                {row.map((cell, seatIdx) => {
                  const globalSeatBase = (hallNo - 1) * seatsPerHall + rowIdx * exam.seatsPerRow + seatIdx + 1;
                  return (
                    <div key={seatIdx} className={`rounded-lg border-2 ${cell.length === 0 ? "border-dashed border-border bg-muted/30" : "border-border bg-card"} min-h-[80px] p-1.5`}>
                      {cell.length === 0 ? (
                        <div className="h-full flex items-center justify-center"><span className="text-xs text-muted-foreground font-mono">#{globalSeatBase}</span></div>
                      ) : (
                        <div className="space-y-1">
                          {cell.map((student) => (
                            <div key={student._id} className={`rounded p-1 ${getClassColor(student.className, exam.classes)}`}>
                              <div className="text-[10px] font-bold">#{student.globalSeatNo}</div>
                              <div className="text-[11px] font-semibold leading-tight truncate">{student.studentName}</div>
                              <div className="text-[10px] opacity-80">{student.className}{student.section ? `-${student.section}` : ""} &bull; {student.admissionNo}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-xs text-muted-foreground print:hidden">Hall {hallNo}: {allocations.length} student(s) allocated</div>
    </div>
  );
}

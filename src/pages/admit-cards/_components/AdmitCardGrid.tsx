import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";

type Props = {
  examId: Id<"exams">;
  exam: Doc<"exams">;
  filterClass?: string;
};

type Allocation = {
  _id: string;
  hallNo: number;
  seatNo: number;
  globalSeatNo: number;
  rowNo: number;
  admissionNo: string;
  studentName: string;
  className: string;
  section?: string;
  rollNo?: string;
};

function AdmitCard({
  student,
  exam,
}: {
  student: Allocation;
  exam: Doc<"exams">;
}) {
  return (
    <div className="admit-card border-2 border-gray-800 rounded-lg p-4 bg-white text-black print:break-inside-avoid">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-300 pb-3 mb-3">
        <GraduationCap className="w-8 h-8 text-gray-700 shrink-0" />
        <div>
          <h3 className="font-bold text-sm leading-tight">ADMIT CARD</h3>
          <p className="text-xs text-gray-600">{exam.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm font-bold">
            {new Date(exam.date).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {/* Student info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-gray-500">Student Name</span>
          <p className="font-semibold text-sm leading-tight">{student.studentName}</p>
        </div>
        <div>
          <span className="text-gray-500">Admission No.</span>
          <p className="font-semibold">{student.admissionNo}</p>
        </div>
        <div>
          <span className="text-gray-500">Class</span>
          <p className="font-semibold">
            {student.className}
            {student.section ? `-${student.section}` : ""}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Roll No.</span>
          <p className="font-semibold">{student.rollNo ?? "—"}</p>
        </div>
      </div>

      {/* Seat info */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Hall No.</p>
          <p className="text-2xl font-black text-gray-900">{student.hallNo}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Row</p>
          <p className="text-2xl font-black text-gray-900">{student.rowNo}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Seat No.</p>
          <p className="text-2xl font-black text-gray-900">{student.globalSeatNo}</p>
        </div>
      </div>

      {/* Signature line */}
      <div className="mt-3 pt-2 border-t border-dashed border-gray-300 flex justify-between text-[10px] text-gray-500">
        <div>
          <div className="border-b border-gray-400 w-24 mb-1"></div>
          Student Signature
        </div>
        <div className="text-right">
          <div className="border-b border-gray-400 w-24 mb-1"></div>
          Invigilator Signature
        </div>
      </div>
    </div>
  );
}

export function AdmitCardGrid({ examId, exam, filterClass }: Props) {
  const allocations = useQuery(api.exams.getAllocations, { examId });

  if (allocations === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  // Filter and sort
  const filtered = (filterClass
    ? allocations.filter((a) => a.className === filterClass)
    : [...allocations]
  ).sort((a, b) => {
    // Sort by class, then by name
    const classCompare = a.className.localeCompare(b.className);
    if (classCompare !== 0) return classCompare;
    return a.studentName.localeCompare(b.studentName);
  });

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No students found for the selected filter.
      </p>
    );
  }

  // Group by class for class-wise sections
  const grouped: Record<string, Allocation[]> = {};
  for (const a of filtered) {
    if (!grouped[a.className]) grouped[a.className] = [];
    grouped[a.className].push(a as Allocation);
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([className, students]) => (
        <div key={className}>
          {/* Class heading - visible on screen and print */}
          <div className="flex items-center gap-3 mb-4 print:mb-2">
            <h3 className="font-bold text-base print:text-sm">Class: {className}</h3>
            <span className="text-sm text-muted-foreground print:text-xs">
              ({students.length} students)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {students.map((student) => (
              <AdmitCard key={student._id} student={student} exam={exam} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

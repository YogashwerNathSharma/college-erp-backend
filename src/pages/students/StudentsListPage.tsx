import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Search, UserPlus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
import StudentProfileDrawer from "./_components/StudentProfileDrawer.tsx";

export default function StudentsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<Id<"students"> | null>(null);
  const navigate = useNavigate();

  const { results, status: queryStatus, loadMore } = usePaginatedQuery(
    api.students.list,
    { status: status !== "all" ? status : undefined },
    { initialNumItems: 25 }
  );

  const softDelete = useMutation(api.students.softDelete);

  const filtered = search
    ? results.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.admissionNo} ${s.className ?? ""}`.toLowerCase().includes(search.toLowerCase())
      )
    : results;

  const handleDelete = async (id: Id<"students">, e: React.MouseEvent) => {
    e.stopPropagation();
    await softDelete({ id });
    toast.success("Student moved to recycle bin");
  };

  return (
    <div className="p-6 space-y-4">
      <StudentProfileDrawer studentId={selectedId} onClose={() => setSelectedId(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">All Students</h1>
          <p className="text-sm text-muted-foreground">{results.length} students found</p>
        </div>
        <Button onClick={() => navigate("/students/new-admission")} className="flex items-center gap-2 cursor-pointer">
          <UserPlus size={15} />
          New Admission
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, admission no, class..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Student</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Adm. No</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Class</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queryStatus === "LoadingFirstPage"
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-4 py-3" colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No students found
                    </td>
                  </tr>
                )
                : filtered.map((student) => (
                    <tr
                      key={student._id}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedId(student._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-muted-foreground">{student.gender ?? "\u2014"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{student.admissionNo}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{student.className ?? "\u2014"}</span>
                        {student.section && <span className="text-muted-foreground ml-1">- {student.section}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {student.phone ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          student.status === "active" ? "bg-green-500/15 text-green-400" :
                          student.status === "inactive" ? "bg-yellow-500/15 text-yellow-400" :
                          student.status === "transferred" ? "bg-blue-500/15 text-blue-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); setSelectedId(student._id); }}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(student._id, e)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {queryStatus === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => loadMore(25)} className="cursor-pointer">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

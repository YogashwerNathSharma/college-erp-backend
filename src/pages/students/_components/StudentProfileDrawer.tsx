import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import {
  X, Pencil, Save, XCircle, User, GraduationCap, MapPin,
  Users, Phone
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Props = {
  studentId: Id<"students"> | null;
  onClose: () => void;
};

type EditForm = Partial<Doc<"students">>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground font-medium">{value || "\u2014"}</span>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1 border-b border-border mb-3">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</span>
    </div>
  );
}

export default function StudentProfileDrawer({ studentId, onClose }: Props) {
  const student = useQuery(api.students.getById, studentId ? { id: studentId } : "skip");
  const updateStudent = useMutation(api.students.update);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({});
  const [saving, setSaving] = useState(false);

  if (!studentId) return null;

  const startEdit = () => {
    if (!student) return;
    setForm({ ...student });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({});
  };

  const handleSave = async () => {
    if (!studentId || !student) return;
    setSaving(true);
    try {
      await updateStudent({
        id: studentId,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        className: form.className,
        section: form.section,
        rollNo: form.rollNo,
        phone: form.phone,
        email: form.email,
        address: form.address,
        fatherName: form.fatherName,
        fatherPhone: form.fatherPhone,
        motherName: form.motherName,
        motherPhone: form.motherPhone,
        status: form.status,
      });
      toast.success("Student updated successfully");
      setEditing(false);
      setForm({});
    } catch {
      toast.error("Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof EditForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const data = editing ? form : student;
  void data;

  const statusBadge = (s?: string | null) => {
    if (!s) return null;
    const cls =
      s === "active" ? "bg-green-500/15 text-green-400" :
      s === "inactive" ? "bg-yellow-500/15 text-yellow-400" :
      s === "transferred" ? "bg-blue-500/15 text-blue-400" :
      "bg-muted text-muted-foreground";
    return <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", cls)}>{s}</span>;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {student ? (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{student.firstName} {student.lastName}</div>
                  <div className="text-xs text-muted-foreground">{student.admissionNo}</div>
                </div>
              </>
            ) : (
              <Skeleton className="h-10 w-48" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editing && student && (
              <Button size="sm" variant="secondary" onClick={startEdit} className="cursor-pointer gap-1.5 h-8">
                <Pencil size={13} /> Edit
              </Button>
            )}
            {editing && (
              <>
                <Button size="sm" variant="secondary" onClick={cancelEdit} className="cursor-pointer gap-1 h-8">
                  <XCircle size={13} /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer gap-1 h-8">
                  <Save size={13} /> {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer h-8 w-8 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {!student ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : editing ? (
            <div className="space-y-1">
              <SectionTitle icon={<GraduationCap size={13} />} title="Academic" />
              <div className="grid grid-cols-2 gap-3">
                <EditField label="First Name" value={form.firstName ?? ""} onChange={(v) => set("firstName", v)} />
                <EditField label="Last Name" value={form.lastName ?? ""} onChange={(v) => set("lastName", v)} />
                <EditField label="Class" value={form.className ?? ""} onChange={(v) => set("className", v)} />
                <EditField label="Section" value={form.section ?? ""} onChange={(v) => set("section", v)} />
                <EditField label="Roll No" value={form.rollNo ?? ""} onChange={(v) => set("rollNo", v)} />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={form.status ?? "active"} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SectionTitle icon={<User size={13} />} title="Personal" />
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Date of Birth" value={form.dateOfBirth ?? ""} onChange={(v) => set("dateOfBirth", v)} type="date" />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <Select value={form.gender ?? ""} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Blood Group</Label>
                  <Select value={form.bloodGroup ?? ""} onValueChange={(v) => set("bloodGroup", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <EditField label="Phone" value={form.phone ?? ""} onChange={(v) => set("phone", v)} />
                <EditField label="Email" value={form.email ?? ""} onChange={(v) => set("email", v)} type="email" />
              </div>

              <SectionTitle icon={<MapPin size={13} />} title="Address" />
              <div className="grid grid-cols-1 gap-3">
                <EditField label="Address" value={form.address ?? ""} onChange={(v) => set("address", v)} />
              </div>

              <SectionTitle icon={<Users size={13} />} title="Parents" />
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Father's Name" value={form.fatherName ?? ""} onChange={(v) => set("fatherName", v)} />
                <EditField label="Father's Phone" value={form.fatherPhone ?? ""} onChange={(v) => set("fatherPhone", v)} />
                <EditField label="Mother's Name" value={form.motherName ?? ""} onChange={(v) => set("motherName", v)} />
                <EditField label="Mother's Phone" value={form.motherPhone ?? ""} onChange={(v) => set("motherPhone", v)} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                {statusBadge(student.status)}
                {student.approvalStatus && student.approvalStatus !== "approved" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                    {student.approvalStatus}
                  </span>
                )}
              </div>

              <SectionTitle icon={<GraduationCap size={13} />} title="Academic" />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Admission No" value={student.admissionNo} />
                <InfoRow label="Admission Date" value={student.admissionDate} />
                <InfoRow label="Academic Year" value={student.academicYear} />
                <InfoRow label="Class" value={student.className} />
                <InfoRow label="Section" value={student.section} />
                <InfoRow label="Roll No" value={student.rollNo} />
              </div>

              <SectionTitle icon={<User size={13} />} title="Personal" />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                <InfoRow label="Date of Birth" value={student.dateOfBirth} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Blood Group" value={student.bloodGroup} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Mother Tongue" value={student.motherTongue} />
                <InfoRow label="Caste" value={student.caste} />
              </div>

              <SectionTitle icon={<Phone size={13} />} title="Contact" />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Phone" value={student.phone} />
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Address" value={student.address} />
                <InfoRow label="City" value={student.city} />
                <InfoRow label="State" value={student.state} />
                <InfoRow label="Pincode" value={student.pincode} />
              </div>

              <SectionTitle icon={<Users size={13} />} title="Parents / Guardian" />
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Father's Name" value={student.fatherName} />
                <InfoRow label="Father's Phone" value={student.fatherPhone} />
                <InfoRow label="Father's Occupation" value={student.fatherOccupation} />
                <InfoRow label="Mother's Name" value={student.motherName} />
                <InfoRow label="Mother's Phone" value={student.motherPhone} />
                <InfoRow label="Mother's Occupation" value={student.motherOccupation} />
                {student.guardianName && <>
                  <InfoRow label="Guardian Name" value={student.guardianName} />
                  <InfoRow label="Guardian Phone" value={student.guardianPhone} />
                  <InfoRow label="Guardian Relation" value={student.guardianRelation} />
                </>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function EditField({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

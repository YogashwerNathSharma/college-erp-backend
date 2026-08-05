import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

export default function OldStudentEntryPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    admissionNo: "", firstName: "", lastName: "", className: "", section: "",
    academicYear: "", admissionDate: "", fatherName: "", phone: "", gender: "",
  });
  const navigate = useNavigate();
  const createStudent = useMutation(api.students.create);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.admissionNo) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      await createStudent({ ...form, status: "active", approvalStatus: "approved" });
      toast.success("Old student entry saved!");
      navigate("/students");
    } catch {
      toast.error("Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Old Student Entry</h1>
        <p className="text-sm text-muted-foreground">Enter details for existing/old students</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "First Name *", key: "firstName", placeholder: "First name" },
                { label: "Last Name *", key: "lastName", placeholder: "Last name" },
                { label: "Admission No *", key: "admissionNo", placeholder: "ADM-001" },
                { label: "Admission Date", key: "admissionDate", type: "date" },
                { label: "Academic Year", key: "academicYear", placeholder: "2023-2024" },
                { label: "Class", key: "className", placeholder: "Class 10" },
                { label: "Section", key: "section", placeholder: "A" },
                { label: "Father's Name", key: "fatherName", placeholder: "Father's name" },
                { label: "Phone", key: "phone", placeholder: "+91 98765 43210" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{label}</Label>
                  <Input
                    type={type ?? "text"}
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Gender</Label>
                <Select onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={loading} className="cursor-pointer flex-1">
                {loading ? "Saving..." : "Save Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  admissionNo: z.string().min(1, "Required"),
  className: z.string().optional(),
  section: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function QuickAdmissionPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const createStudent = useMutation(api.students.create);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createStudent({ ...data, status: "active", approvalStatus: "pending" });
      toast.success("Quick admission completed!");
      navigate("/students");
    } catch {
      toast.error("Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Quick Admission</h1>
        <p className="text-sm text-muted-foreground">Fast-track admission with minimal details</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...register("firstName")} placeholder="First name" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...register("lastName")} placeholder="Last name" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Admission No *</Label>
                <Input {...register("admissionNo")} placeholder="ADM-001" />
                {errors.admissionNo && <p className="text-xs text-destructive">{errors.admissionNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select onValueChange={(v) => setValue("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Input {...register("className")} placeholder="e.g. Class 5" />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input {...register("section")} placeholder="e.g. A" />
              </div>
              <div className="space-y-1.5">
                <Label>Student Phone</Label>
                <Input {...register("phone")} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <Label>Father's Name</Label>
                <Input {...register("fatherName")} placeholder="Father's name" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Father's Phone</Label>
                <Input {...register("fatherPhone")} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={loading} className="cursor-pointer flex-1">
                {loading ? "Saving..." : "Quick Admit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

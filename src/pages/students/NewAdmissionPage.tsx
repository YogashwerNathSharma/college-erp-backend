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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  admissionNo: z.string().min(1, "Required"),
  admissionDate: z.string().optional(),
  academicYear: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
  rollNo: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  motherOccupation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const steps = ["Academic Info", "Personal Info", "Address", "Parent/Guardian", "Review"];

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function NewAdmissionPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const createStudent = useMutation(api.students.create);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: "", bloodGroup: "", academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1) },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createStudent({
        ...data,
        email: data.email || undefined,
        status: "active",
        approvalStatus: "approved",
      });
      toast.success("Student admitted successfully!");
      navigate("/students");
    } catch {
      toast.error("Failed to create student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">New Admission</h1>
        <p className="text-sm text-muted-foreground">Fill in the student details to complete admission</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-green-500/20 text-green-400" :
                "bg-muted text-muted-foreground"
              )}
            >
              {i < step && <CheckCircle size={12} />}
              {s}
            </button>
            {i < steps.length - 1 && <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 0 && (
              <div className="space-y-4">
                <CardTitle className="text-base mb-4">Academic Information</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Admission No *" error={errors.admissionNo?.message}>
                    <Input {...register("admissionNo")} placeholder="e.g. ADM-2024-001" />
                  </FormField>
                  <FormField label="Admission Date">
                    <Input type="date" {...register("admissionDate")} />
                  </FormField>
                  <FormField label="Academic Year">
                    <Input {...register("academicYear")} placeholder="e.g. 2024-2025" />
                  </FormField>
                  <FormField label="Class">
                    <Input {...register("className")} placeholder="e.g. Class 10" />
                  </FormField>
                  <FormField label="Section">
                    <Input {...register("section")} placeholder="e.g. A" />
                  </FormField>
                  <FormField label="Roll No">
                    <Input {...register("rollNo")} placeholder="e.g. 01" />
                  </FormField>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <CardTitle className="text-base mb-4">Personal Information</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name *" error={errors.firstName?.message}>
                    <Input {...register("firstName")} placeholder="First name" />
                  </FormField>
                  <FormField label="Last Name *" error={errors.lastName?.message}>
                    <Input {...register("lastName")} placeholder="Last name" />
                  </FormField>
                  <FormField label="Date of Birth">
                    <Input type="date" {...register("dateOfBirth")} />
                  </FormField>
                  <FormField label="Gender">
                    <Select onValueChange={(v) => setValue("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Blood Group">
                    <Select onValueChange={(v) => setValue("bloodGroup", v)}>
                      <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                      <SelectContent>
                        {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Religion">
                    <Input {...register("religion")} placeholder="e.g. Hindu" />
                  </FormField>
                  <FormField label="Phone">
                    <Input {...register("phone")} placeholder="+91 98765 43210" />
                  </FormField>
                  <FormField label="Email" error={errors.email?.message}>
                    <Input {...register("email")} type="email" placeholder="student@email.com" />
                  </FormField>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <CardTitle className="text-base mb-4">Address</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Address">
                      <Input {...register("address")} placeholder="Street address" />
                    </FormField>
                  </div>
                  <FormField label="City">
                    <Input {...register("city")} placeholder="City" />
                  </FormField>
                  <FormField label="State">
                    <Input {...register("state")} placeholder="State" />
                  </FormField>
                  <FormField label="Pincode">
                    <Input {...register("pincode")} placeholder="Pincode" />
                  </FormField>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <CardTitle className="text-base">Parent / Guardian Information</CardTitle>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Father</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Father's Name">
                      <Input {...register("fatherName")} placeholder="Father's full name" />
                    </FormField>
                    <FormField label="Father's Phone">
                      <Input {...register("fatherPhone")} placeholder="+91 98765 43210" />
                    </FormField>
                    <FormField label="Occupation">
                      <Input {...register("fatherOccupation")} placeholder="Occupation" />
                    </FormField>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Mother</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Mother's Name">
                      <Input {...register("motherName")} placeholder="Mother's full name" />
                    </FormField>
                    <FormField label="Mother's Phone">
                      <Input {...register("motherPhone")} placeholder="+91 98765 43210" />
                    </FormField>
                    <FormField label="Occupation">
                      <Input {...register("motherOccupation")} placeholder="Occupation" />
                    </FormField>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Guardian (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Guardian Name">
                      <Input {...register("guardianName")} placeholder="Guardian name" />
                    </FormField>
                    <FormField label="Guardian Phone">
                      <Input {...register("guardianPhone")} placeholder="+91 98765 43210" />
                    </FormField>
                    <FormField label="Relation">
                      <Input {...register("guardianRelation")} placeholder="e.g. Uncle" />
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <CardTitle className="text-base mb-4">Review & Submit</CardTitle>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Admission No", watch("admissionNo")],
                    ["Name", `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()],
                    ["Class", `${watch("className") ?? "—"} ${watch("section") ?? ""}`],
                    ["Academic Year", watch("academicYear")],
                    ["Date of Birth", watch("dateOfBirth")],
                    ["Gender", watch("gender")],
                    ["Phone", watch("phone")],
                    ["Father's Name", watch("fatherName")],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">{k}</div>
                      <div className="font-medium text-foreground mt-0.5">{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className={cn("cursor-pointer", step === 0 && "invisible")}
              >
                <ChevronLeft size={15} className="mr-1" />
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)} className="cursor-pointer">
                  Next
                  <ChevronRight size={15} className="ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? "Submitting..." : "Submit Admission"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

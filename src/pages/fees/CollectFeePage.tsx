import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Search, IndianRupee, Check, Receipt } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const FEE_TYPES = ["Tuition Fee", "Exam Fee", "Transport Fee", "Library Fee", "Sports Fee", "Lab Fee", "Development Fee", "Miscellaneous"];
const PAYMENT_MODES = ["cash", "online", "cheque", "dd", "upi"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Form = {
  feeType: string;
  amount: string;
  discount: string;
  fine: string;
  amountPaid: string;
  paymentDate: string;
  paymentMode: string;
  month: string;
  chequeNo: string;
  bankName: string;
  remarks: string;
  collectedBy: string;
};

const emptyForm = (): Form => ({
  feeType: "",
  amount: "",
  discount: "0",
  fine: "0",
  amountPaid: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentMode: "cash",
  month: "",
  chequeNo: "",
  bankName: "",
  remarks: "",
  collectedBy: "",
});

export default function CollectFeePage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"students"> | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { results: students, status: sStatus } = usePaginatedQuery(
    api.students.list,
    { status: "active" },
    { initialNumItems: 50 }
  );

  const filteredStudents = search
    ? students.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.admissionNo} ${s.className ?? ""}`.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const selectedStudent = students.find((s) => s._id === selectedId);

  const feeHistory = useQuery(
    api.fees.getStudentFeeHistory,
    selectedId ? { studentId: selectedId } : "skip"
  );

  const collectFee = useMutation(api.fees.collectFee);

  const amount = parseFloat(form.amount) || 0;
  const discount = parseFloat(form.discount) || 0;
  const fine = parseFloat(form.fine) || 0;
  const totalAmount = amount - discount + fine;
  const amountPaid = parseFloat(form.amountPaid) || 0;
  const balance = Math.max(0, totalAmount - amountPaid);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { toast.error("Please select a student"); return; }
    if (!form.feeType) { toast.error("Select fee type"); return; }
    if (amount <= 0) { toast.error("Enter valid amount"); return; }
    if (amountPaid <= 0) { toast.error("Enter amount paid"); return; }
    if ((form.paymentMode === "cheque" || form.paymentMode === "dd") && !form.chequeNo) {
      toast.error("Enter cheque/DD number"); return;
    }

    setSaving(true);
    try {
      const id = await collectFee({
        studentId: selectedId,
        feeType: form.feeType,
        amount,
        discount: discount || undefined,
        fine: fine || undefined,
        amountPaid,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        month: form.month || undefined,
        chequeNo: form.chequeNo || undefined,
        bankName: form.bankName || undefined,
        remarks: form.remarks || undefined,
        collectedBy: form.collectedBy || undefined,
      });
      toast.success("Fee collected successfully!");
      setSubmitted(String(id));
      setForm(emptyForm());
    } catch {
      toast.error("Failed to collect fee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Collect Fee</h1>
        <p className="text-sm text-muted-foreground">Record a fee payment for a student</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Select Student</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 text-sm h-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {sStatus === "LoadingFirstPage"
                  ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)
                  : filteredStudents.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => { setSelectedId(s._id); setSubmitted(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left cursor-pointer transition-colors ${
                        selectedId === s._id ? "bg-primary/20 border border-primary/30" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-muted-foreground">{s.admissionNo} \u00B7 {s.className ?? "\u2014"}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {feeHistory === undefined ? (
                  <div className="p-3 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : feeHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">No payments yet</p>
                ) : (
                  <div className="divide-y divide-border max-h-52 overflow-y-auto">
                    {feeHistory.map((p) => (
                      <div key={p._id} className="flex items-center justify-between px-3 py-2">
                        <div>
                          <div className="text-xs font-medium">{p.feeType}</div>
                          <div className="text-[10px] text-muted-foreground">{p.paymentDate} \u00B7 {p.receiptNo}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-green-400">\u20B9{p.amountPaid.toLocaleString("en-IN")}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            p.status === "paid" ? "bg-green-500/15 text-green-400" :
                            p.status === "partial" ? "bg-yellow-500/15 text-yellow-400" :
                            "bg-red-500/15 text-red-400"
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <IndianRupee size={13} className="text-primary" />
                Fee Collection Form
                {selectedStudent && (
                  <span className="text-muted-foreground font-normal ml-2">
                    \u2014 {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.admissionNo})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-4 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                  <Check size={16} className="text-green-400 shrink-0" />
                  <div className="text-sm text-green-400 font-medium">Fee collected successfully!</div>
                  <Button size="sm" variant="secondary" className="ml-auto cursor-pointer h-7 text-xs gap-1" onClick={() => setSubmitted(null)}>
                    <Receipt size={12} /> Collect Again
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fee Type *</Label>
                    <Select value={form.feeType} onValueChange={(v) => set("feeType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select fee type" /></SelectTrigger>
                      <SelectContent>
                        {FEE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Month (for monthly fee)</Label>
                    <Select value={form.month} onValueChange={(v) => set("month", v)}>
                      <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fee Amount (\u20B9) *</Label>
                    <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Discount (\u20B9)</Label>
                    <Input type="number" value={form.discount} onChange={(e) => set("discount", e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Fine (\u20B9)</Label>
                    <Input type="number" value={form.fine} onChange={(e) => set("fine", e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Amount Paid (\u20B9) *</Label>
                    <Input type="number" value={form.amountPaid} onChange={(e) => set("amountPaid", e.target.value)} placeholder="0" />
                  </div>
                </div>

                {amount > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Amount</div>
                      <div className="font-bold text-foreground">\u20B9{totalAmount.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Paid Now</div>
                      <div className="font-bold text-green-400">\u20B9{amountPaid.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Balance Due</div>
                      <div className={`font-bold ${balance > 0 ? "text-red-400" : "text-green-400"}`}>\u20B9{balance.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Payment Date *</Label>
                    <Input type="date" value={form.paymentDate} onChange={(e) => set("paymentDate", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Payment Mode *</Label>
                    <Select value={form.paymentMode} onValueChange={(v) => set("paymentMode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {(form.paymentMode === "cheque" || form.paymentMode === "dd") && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Cheque / DD No *</Label>
                        <Input value={form.chequeNo} onChange={(e) => set("chequeNo", e.target.value)} placeholder="Cheque number" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Bank Name</Label>
                        <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Bank name" />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Collected By</Label>
                    <Input value={form.collectedBy} onChange={(e) => set("collectedBy", e.target.value)} placeholder="Staff name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Remarks</Label>
                    <Input value={form.remarks} onChange={(e) => set("remarks", e.target.value)} placeholder="Optional note" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving || !selectedId} className="cursor-pointer gap-2 flex-1">
                    <IndianRupee size={14} />
                    {saving ? "Processing..." : "Collect Fee"}
                  </Button>
                  <Button type="button" variant="secondary" className="cursor-pointer" onClick={() => { setForm(emptyForm()); setSubmitted(null); }}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

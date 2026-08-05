import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Receipt, Search, Printer, IndianRupee } from "lucide-react";

export default function FeeReceiptPage() {
  const [receiptNo, setReceiptNo] = useState("");
  const [query, setQuery] = useState("");

  const payment = useQuery(
    api.fees.getPaymentByReceipt,
    query ? { receiptNo: query } : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(receiptNo.trim().toUpperCase());
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Fee Receipt</h1>
        <p className="text-sm text-muted-foreground">Search and print fee receipts by receipt number</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 uppercase"
            placeholder="Enter receipt number e.g. REC-0001"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value.toUpperCase())}
          />
        </div>
        <Button type="submit" className="cursor-pointer shrink-0">Search</Button>
      </form>

      {payment === undefined && query && (
        <Skeleton className="h-80 w-full" />
      )}

      {payment === null && query && (
        <div className="text-center py-12">
          <Receipt size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No receipt found for <strong>{query}</strong></p>
        </div>
      )}

      {payment && (
        <div id="receipt-print">
          <Card className="border-primary/20">
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <IndianRupee size={22} className="text-primary-foreground" />
                </div>
                <div>
                  <div className="font-bold text-lg text-foreground">RMS Academy</div>
                  <div className="text-xs text-muted-foreground">Fee Receipt</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-primary">{payment.receiptNo}</div>
                <div className="text-xs text-muted-foreground">{payment.paymentDate}</div>
              </div>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Student Name", payment.studentName],
                  ["Admission No", payment.admissionNo],
                  ["Class", `${payment.className}${payment.month ? ` \u2014 ${payment.month}` : ""}`],
                  ["Academic Year", payment.academicYear],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/30 rounded-lg px-3 py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
                    <div className="text-sm font-medium mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">Description</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2">{payment.feeType}</td>
                      <td className="py-2 text-right">\u20B9{payment.amount.toLocaleString("en-IN")}</td>
                    </tr>
                    {(payment.discount ?? 0) > 0 && (
                      <tr className="border-b border-border/50">
                        <td className="py-2 text-blue-400">Discount</td>
                        <td className="py-2 text-right text-blue-400">- \u20B9{payment.discount!.toLocaleString("en-IN")}</td>
                      </tr>
                    )}
                    {(payment.fine ?? 0) > 0 && (
                      <tr className="border-b border-border/50">
                        <td className="py-2 text-red-400">Fine</td>
                        <td className="py-2 text-right text-red-400">+ \u20B9{payment.fine!.toLocaleString("en-IN")}</td>
                      </tr>
                    )}
                    <tr className="border-b border-border font-semibold">
                      <td className="py-2">Total Amount</td>
                      <td className="py-2 text-right">\u20B9{payment.totalAmount.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr className="font-bold text-green-400">
                      <td className="py-2">Amount Paid</td>
                      <td className="py-2 text-right">\u20B9{payment.amountPaid.toLocaleString("en-IN")}</td>
                    </tr>
                    {payment.balance > 0 && (
                      <tr className="text-red-400">
                        <td className="py-2">Balance Due</td>
                        <td className="py-2 text-right">\u20B9{payment.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  ["Payment Mode", payment.paymentMode.toUpperCase()],
                  ...(payment.chequeNo ? [["Cheque / DD No", payment.chequeNo]] : []),
                  ...(payment.bankName ? [["Bank", payment.bankName]] : []),
                  ...(payment.collectedBy ? [["Collected By", payment.collectedBy]] : []),
                  ...(payment.remarks ? [["Remarks", payment.remarks]] : []),
                  ["Status", payment.status.toUpperCase()],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/30 rounded-lg px-3 py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
                    <div className="text-sm font-medium mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground">
                This is a computer generated receipt. No signature required.
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-4">
            <Button onClick={handlePrint} className="cursor-pointer gap-2 flex-1">
              <Printer size={14} /> Print Receipt
            </Button>
            <Button variant="secondary" className="cursor-pointer" onClick={() => { setQuery(""); setReceiptNo(""); }}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import { Settings } from "lucide-react";

const defaultAgeRules = [
  { className: "Class 1", minAge: 5, maxAge: 7 },
  { className: "Class 2", minAge: 6, maxAge: 8 },
  { className: "Class 3", minAge: 7, maxAge: 9 },
  { className: "Class 4", minAge: 8, maxAge: 10 },
  { className: "Class 5", minAge: 9, maxAge: 11 },
  { className: "Class 6", minAge: 10, maxAge: 13 },
  { className: "Class 7", minAge: 11, maxAge: 14 },
  { className: "Class 8", minAge: 12, maxAge: 15 },
  { className: "Class 9", minAge: 13, maxAge: 16 },
  { className: "Class 10", minAge: 14, maxAge: 17 },
];

export default function AgeSettingsPage() {
  const [rules, setRules] = useState(defaultAgeRules);

  const update = (i: number, key: "minAge" | "maxAge", val: string) => {
    setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [key]: parseInt(val) || 0 } : r));
  };

  const handleSave = () => toast.success("Age settings saved successfully");

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Age Settings</h1>
        <p className="text-sm text-muted-foreground">Configure age restrictions for each class</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings size={14} className="text-primary" /> Class Age Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b border-border">
            <span>Class</span>
            <span>Min Age (years)</span>
            <span>Max Age (years)</span>
          </div>
          {rules.map((rule, i) => (
            <div key={rule.className} className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-medium text-foreground px-2">{rule.className}</div>
              <Input type="number" value={rule.minAge} onChange={(e) => update(i, "minAge", e.target.value)} className="h-8 text-sm" />
              <Input type="number" value={rule.maxAge} onChange={(e) => update(i, "maxAge", e.target.value)} className="h-8 text-sm" />
            </div>
          ))}
          <div className="pt-3">
            <Button onClick={handleSave} className="cursor-pointer">Save Age Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

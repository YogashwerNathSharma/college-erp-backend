import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function CommunicationPage() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState("sms");
  const [selectedIds, setSelectedIds] = useState<Id<"students">[]>([]);

  const { results, status } = usePaginatedQuery(api.students.list, { status: "active" }, { initialNumItems: 50 });

  const toggle = (id: Id<"students">) =>
    setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSend = () => {
    if (!message || selectedIds.length === 0) {
      toast.error("Select recipients and enter a message");
      return;
    }
    toast.success(`Message sent to ${selectedIds.length} student(s) via ${channel.toUpperCase()}`);
    setMessage(""); setSubject(""); setSelectedIds([]);
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Communication</h1>
        <p className="text-sm text-muted-foreground">Send messages to students and parents</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Select Recipients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <input type="checkbox"
                checked={selectedIds.length === results.length && results.length > 0}
                onChange={(e) => setSelectedIds(e.target.checked ? results.map((s) => s._id) : [])}
                className="cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">Select All ({results.length})</span>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {status === "LoadingFirstPage"
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)
                : results.map((s) => (
                  <label key={s._id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/30 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.includes(s._id)} onChange={() => toggle(s._id)} className="cursor-pointer" />
                    <div>
                      <div className="text-sm">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground">{s.className ?? "—"} • {s.fatherPhone ?? s.phone ?? "—"}</div>
                    </div>
                  </label>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare size={14} className="text-primary" /> Compose Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {channel === "email" && (
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={5} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{selectedIds.length} recipient(s) selected</span>
              <Button className="cursor-pointer gap-2" onClick={handleSend}>
                <Send size={13} /> Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

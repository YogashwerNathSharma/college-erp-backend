import { Link } from "react-router-dom";
import { ClipboardList, FileText, GraduationCap } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">College ERP</h1>
          <p className="text-muted-foreground text-lg">
            Exam Seating Plan &amp; Admit Card Management
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/seating-plan" className="p-6 rounded-xl border bg-card hover:bg-accent transition-colors cursor-pointer text-left">
            <ClipboardList className="w-8 h-8 text-primary mb-3" />
            <h2 className="font-semibold text-lg">Seating Plan</h2>
            <p className="text-sm text-muted-foreground mt-1">Generate and manage exam hall seating arrangements with interleaved class allocation</p>
          </Link>
          <Link to="/admit-cards" className="p-6 rounded-xl border bg-card hover:bg-accent transition-colors cursor-pointer text-left">
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h2 className="font-semibold text-lg">Admit Cards</h2>
            <p className="text-sm text-muted-foreground mt-1">Print class-wise admit cards with seat numbers and hall information</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

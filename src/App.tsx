import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
// Students
import StudentsListPage from "./pages/students/StudentsListPage.tsx";
import StudentDashboardPage from "./pages/students/StudentDashboardPage.tsx";
import NewAdmissionPage from "./pages/students/NewAdmissionPage.tsx";
import QuickAdmissionPage from "./pages/students/QuickAdmissionPage.tsx";
import AdmissionApprovalPage from "./pages/students/AdmissionApprovalPage.tsx";
import OldStudentEntryPage from "./pages/students/OldStudentEntryPage.tsx";
import PromotionPage from "./pages/students/PromotionPage.tsx";
import TransferPage from "./pages/students/TransferPage.tsx";
import CertificatesPage from "./pages/students/CertificatesPage.tsx";
import CommunicationPage from "./pages/students/CommunicationPage.tsx";
import DuplicatesPage from "./pages/students/DuplicatesPage.tsx";
import AgeSettingsPage from "./pages/students/AgeSettingsPage.tsx";
import PrintListPage from "./pages/students/PrintListPage.tsx";
import ReportsPage from "./pages/students/ReportsPage.tsx";
import IdCardPage from "./pages/students/IdCardPage.tsx";
import SavedFiltersPage from "./pages/students/SavedFiltersPage.tsx";
import RecycleBinPage from "./pages/students/RecycleBinPage.tsx";
// Fees
import FeeDashboardPage from "./pages/fees/FeeDashboardPage.tsx";
import CollectFeePage from "./pages/fees/CollectFeePage.tsx";
import FeePaymentsPage from "./pages/fees/FeePaymentsPage.tsx";
import FeeStructurePage from "./pages/fees/FeeStructurePage.tsx";
import FeeReceiptPage from "./pages/fees/FeeReceiptPage.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            {/* Students */}
            <Route path="/students/dashboard" element={<StudentDashboardPage />} />
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/new-admission" element={<NewAdmissionPage />} />
            <Route path="/students/quick-admission" element={<QuickAdmissionPage />} />
            <Route path="/students/admission-approval" element={<AdmissionApprovalPage />} />
            <Route path="/students/old-entry" element={<OldStudentEntryPage />} />
            <Route path="/students/promotion" element={<PromotionPage />} />
            <Route path="/students/transfer" element={<TransferPage />} />
            <Route path="/students/certificates" element={<CertificatesPage />} />
            <Route path="/students/communication" element={<CommunicationPage />} />
            <Route path="/students/duplicates" element={<DuplicatesPage />} />
            <Route path="/students/age-settings" element={<AgeSettingsPage />} />
            <Route path="/students/print" element={<PrintListPage />} />
            <Route path="/students/reports" element={<ReportsPage />} />
            <Route path="/students/id-card" element={<IdCardPage />} />
            <Route path="/students/saved-filters" element={<SavedFiltersPage />} />
            <Route path="/students/recycle-bin" element={<RecycleBinPage />} />
            {/* Fees */}
            <Route path="/fees/dashboard" element={<FeeDashboardPage />} />
            <Route path="/fees/collect" element={<CollectFeePage />} />
            <Route path="/fees/payments" element={<FeePaymentsPage />} />
            <Route path="/fees/structure" element={<FeeStructurePage />} />
            <Route path="/fees/receipt" element={<FeeReceiptPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}

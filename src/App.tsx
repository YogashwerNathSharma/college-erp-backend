import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
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

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}

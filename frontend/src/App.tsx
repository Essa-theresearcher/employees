import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AdminAuthGate } from './components/AdminAuthGate';
import { EventPortalGate } from './components/EventPortalGate';
import { PublicEventModuleGate } from './components/PublicEventModuleGate';
import { AdminLayout } from './layouts/AdminLayout';
import { DisplayLayout } from './layouts/DisplayLayout';
import { JudgeLayout } from './layouts/JudgeLayout';
import { PublicLayout } from './layouts/PublicLayout';

import { CheckinPage } from './pages/CheckinPage';
import { ContactPage } from './pages/ContactPage';
import { LevelsPage } from './pages/LevelsPage';
import { JudgePage } from './pages/JudgePage';
import { LeaderboardDisplayPage } from './pages/LeaderboardDisplayPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PollsDisplayPage } from './pages/PollsDisplayPage';
import { PollsPage } from './pages/PollsPage';
import { QADisplayPage } from './pages/QADisplayPage';
import { QAPage } from './pages/QAPage';
import { RegisterPage } from './pages/RegisterPage';
import { StatusPage } from './pages/StatusPage';
import { TeamsDisplayPage } from './pages/TeamsDisplayPage';
import { TeamsPage } from './pages/TeamsPage';
import { ProjectorHubPage } from './pages/ProjectorHubPage';
import { ThanksPage } from './pages/ThanksPage';
import { VerifyPage } from './pages/VerifyPage';

import { AdminCertificatesPage } from './pages/admin/Certificates';
import { AdminCheckin } from './pages/admin/Checkin';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminJudgingPage } from './pages/admin/Judging';
import { AdminLeaderboardPage } from './pages/admin/Leaderboard';
import { AdminLogin } from './pages/admin/Login';
import { AdminOverviewPage } from './pages/admin/Overview';
import { AdminPaymentsRedirect } from './pages/admin/Payments';
import { AdminPollsPage } from './pages/admin/Polls';
import { AdminQAPage } from './pages/admin/QA';
import { AdminRegistrations } from './pages/admin/Registrations';
import { AdminSettingsPage } from './pages/admin/Settings';
import { AdminTeams } from './pages/admin/Teams';

function CertificatesPlaceholder() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-brand-900">Certificates</h1>
      <p className="mt-3 text-sm text-slate-600">
        Certificates are not configured for this event yet. Please check back after the closing ceremony.
      </p>
    </div>
  );
}

function BadgeRedirect() {
  const { attendeeId } = useParams();
  return <Navigate to={`/status/${encodeURIComponent(attendeeId ?? '')}`} replace />;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        {/* Attendee portal is hidden behind the welcome splash until check-in is finished */}
        <Route element={<EventPortalGate />}>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<RegisterPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/thanks" element={<ThanksPage />} />
            <Route path="/status/:id" element={<StatusPage />} />
            <Route path="/badge/:attendeeId" element={<BadgeRedirect />} />
            <Route path="/verify/:badgeId" element={<VerifyPage />} />
            <Route path="/verify-certificate/:certificateCode" element={<CertificatesPlaceholder />} />
            <Route path="/certificate/:certificateCode" element={<CertificatesPlaceholder />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/levels" element={<LevelsPage />} />
          </Route>

          {/* Live event modules (unlock after attendee check-in on this device; admins bypass) */}
          <Route element={<PublicEventModuleGate />}>
            <Route element={<PublicLayout />}>
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/qa" element={<QAPage />} />
              <Route path="/polls" element={<PollsPage />} />
              <Route path="/certificates" element={<CertificatesPlaceholder />} />
            </Route>
          </Route>
        </Route>

        {/* Venue projector: public read-only displays, no check-in gate — use a separate browser from admin */}
        <Route element={<DisplayLayout />}>
          <Route path="/projector" element={<ProjectorHubPage />} />
          <Route path="/display/leaderboard" element={<LeaderboardDisplayPage />} />
          <Route path="/display/teams" element={<TeamsDisplayPage />} />
          <Route path="/display/qa" element={<QADisplayPage />} />
          <Route path="/display/polls" element={<PollsDisplayPage />} />
        </Route>

        {/* Judges use this URL without attendee check-in session */}
        <Route element={<JudgeLayout />}>
          <Route path="/judge" element={<JudgePage />} />
          <Route path="/judge/login" element={<Navigate to="/judge" replace />} />
        </Route>

        {/* Old projector URLs → redirect to /display/* */}
        <Route path="/teams/display" element={<Navigate to="/display/teams" replace />} />
        <Route path="/leaderboard/display" element={<Navigate to="/display/leaderboard" replace />} />
        <Route path="/qa/display" element={<Navigate to="/display/qa" replace />} />
        <Route path="/polls/display" element={<Navigate to="/display/polls" replace />} />

        {/* Admin authentication (outside layout/gate) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Per-attendee check-in page (admin-only; gated, no AdminLayout chrome) */}
        <Route element={<AdminAuthGate />}>
          <Route path="/checkin/:attendeeId" element={<CheckinPage />} />
        </Route>

        {/* Admin control room */}
        <Route element={<AdminAuthGate />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/registrations" element={<AdminRegistrations />} />
            <Route path="/admin/payments" element={<AdminPaymentsRedirect />} />
            <Route path="/admin/check-in" element={<AdminCheckin />} />
            <Route path="/admin/checkin" element={<Navigate to="/admin/check-in" replace />} />
            <Route path="/admin/teams" element={<AdminTeams />} />
            <Route path="/admin/judging" element={<AdminJudgingPage />} />
            <Route path="/admin/leaderboard" element={<AdminLeaderboardPage />} />
            <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
            <Route path="/admin/qa" element={<AdminQAPage />} />
            <Route path="/admin/polls" element={<AdminPollsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

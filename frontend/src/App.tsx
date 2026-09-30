import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import MaterialsPage from './pages/MaterialsPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import SummaryPage from './pages/SummaryPage';
import ChatPage from './pages/ChatPage';
import QuizConfigPage from './pages/QuizConfigPage';
import QuizTakePage from './pages/QuizTakePage';
import QuizResultPage from './pages/QuizResultPage';
import FlashcardsPage from './pages/FlashcardsPage';
import StudyPlanPage from './pages/StudyPlanPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="materials/:materialId" element={<MaterialDetailPage />} />
          <Route path="summary/:materialId" element={<SummaryPage />} />
          <Route path="chat/:materialId" element={<ChatPage />} />
          <Route path="quiz" element={<QuizConfigPage />} />
          <Route path="quiz/:quizId" element={<QuizTakePage />} />
          <Route path="quiz/:quizId/result" element={<QuizResultPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="study-plan" element={<StudyPlanPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

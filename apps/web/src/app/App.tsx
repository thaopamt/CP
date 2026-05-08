import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '@cp/shared';

import { AuthProvider } from './providers/AuthProvider';
import { RoleGuard, RoleHomeRedirect } from './guards/RoleGuard';
import { PublicLayout } from './layouts/PublicLayout';

/**
 * ────────────────────────────────────────────────────────────────────────
 *  App.tsx — deliverable #3
 * ────────────────────────────────────────────────────────────────────────
 *
 * Three portal trees, each gated by a RoleGuard:
 *
 *   /admin/*    — ADMIN
 *   /teacher/*  — TEACHER
 *   /student/*  — STUDENT
 *
 * Layouts and pages are React.lazy()'d so each portal is a separate
 * JS chunk — admin code does not ship in the student bundle.
 */

const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const TeacherLayout = lazy(() => import('./layouts/TeacherLayout'));
const StudentLayout = lazy(() => import('./layouts/StudentLayout'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsers = lazy(() => import('./pages/admin/UsersPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/DashboardPage'));
const TeacherClasses = lazy(() => import('./pages/teacher/ClassesPage'));
const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));
const StudentQuests = lazy(() => import('./pages/student/QuestsPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const Loading = () => (
  <div className="grid h-screen place-items-center text-on-surface-variant">
    <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* ── Public ───────────────────────────────────────────── */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* ── Admin portal ─────────────────────────────────────── */}
              <Route
                path="/admin"
                element={
                  <RoleGuard allow={[UserRole.ADMIN]}>
                    <AdminLayout />
                  </RoleGuard>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>

              {/* ── Teacher portal ───────────────────────────────────── */}
              <Route
                path="/teacher"
                element={
                  <RoleGuard allow={[UserRole.TEACHER]}>
                    <TeacherLayout />
                  </RoleGuard>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
              </Route>

              {/* ── Student portal ───────────────────────────────────── */}
              <Route
                path="/student"
                element={
                  <RoleGuard allow={[UserRole.STUDENT]}>
                    <StudentLayout />
                  </RoleGuard>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="quests" element={<StudentQuests />} />
              </Route>

              {/* Default — send user to their own portal home */}
              <Route path="/" element={<RoleHomeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

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
const AdminStudents = lazy(() => import('./pages/admin/students/StudentsListPage'));
const AdminStudentCreate = lazy(() => import('./pages/admin/students/StudentCreatePage'));
const AdminStudentEdit = lazy(() => import('./pages/admin/students/StudentEditPage'));
const AdminStudentProfile = lazy(() => import('./pages/admin/students/StudentProfilePage'));
const AdminCourses = lazy(() => import('./pages/admin/CoursesPage'));
const AdminSchedule = lazy(() => import('./pages/admin/SchedulePage'));
const AdminFinance = lazy(() => import('./pages/admin/FinancePage'));
const AdminClassesList = lazy(() => import('./pages/admin/classes/ClassesListPage'));
const AdminClassCreate = lazy(() => import('./pages/admin/classes/ClassCreatePage'));
const AdminClassDetail = lazy(() => import('./pages/admin/classes/ClassDetailPage'));
const AdminClassEdit = lazy(() => import('./pages/admin/classes/ClassEditPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/DashboardPage'));
const TeacherClasses = lazy(() => import('./pages/teacher/ClassesPage'));
const TeacherAttendance = lazy(() => import('./pages/teacher/AttendancePage'));
const TeacherChallenges = lazy(() => import('./pages/teacher/CodingChallengePage'));
const TeacherMonitoring = lazy(() => import('./pages/teacher/MonitoringPage'));
const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));
const StudentQuests = lazy(() => import('./pages/student/QuestsPage'));
const StudentAssignments = lazy(() => import('./pages/student/AssignmentsPage'));
const StudentWorkspace = lazy(() => import('./pages/student/WorkspacePage'));

import { ToastProvider } from './providers/ToastProvider';

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
          <ToastProvider />
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
                <Route path="students" element={<AdminStudents />} />
                <Route path="students/new" element={<AdminStudentCreate />} />
                <Route path="students/:studentId" element={<AdminStudentProfile />} />
                <Route path="students/:studentId/edit" element={<AdminStudentEdit />} />
                <Route path="classes" element={<AdminClassesList />} />
                <Route path="classes/new" element={<AdminClassCreate />} />
                <Route path="classes/:classId" element={<AdminClassDetail />} />
                <Route path="classes/:classId/edit" element={<AdminClassEdit />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="finance" element={<AdminFinance />} />
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
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="monitoring" element={<TeacherMonitoring />} />
                <Route path="challenges" element={<TeacherChallenges />} />
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
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="workspace" element={<StudentWorkspace />} />
                <Route path="workspace/:problemId" element={<StudentWorkspace />} />
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

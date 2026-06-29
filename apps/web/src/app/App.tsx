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
const AdminAssignmentsList = lazy(() => import('./pages/admin/assignments/AssignmentsListPage'));
const AdminAssignmentCreate = lazy(() => import('./pages/admin/assignments/AssignmentCreatePage'));
const AdminAssignmentDetail = lazy(() => import('./pages/admin/assignments/AssignmentDetailPage'));
const AdminAssignmentEdit = lazy(() => import('./pages/admin/assignments/AssignmentEditPage'));
const BlogManageList = lazy(() => import('./pages/admin/blog/BlogManageListPage'));
const BlogCreate = lazy(() => import('./pages/admin/blog/BlogCreatePage'));
const BlogEdit = lazy(() => import('./pages/admin/blog/BlogEditPage'));
const BlogPreview = lazy(() => import('./pages/admin/blog/BlogPreviewPage'));
const AdminShopList = lazy(() => import('./pages/admin/shop/ShopListPage'));
const AdminShopCreate = lazy(() => import('./pages/admin/shop/ShopCreatePage'));
const AdminShopEdit = lazy(() => import('./pages/admin/shop/ShopEditPage'));
const AdminCoursesList = lazy(() => import('./pages/admin/courses/CoursesListPage'));
const AdminCourseDetail = lazy(() => import('./pages/admin/courses/CourseDetailPage'));
const AdminClassCurriculum = lazy(() => import('./pages/admin/classes/ClassCurriculumPage'));
const AdminSchedule = lazy(() => import('./pages/admin/SchedulePage'));
const AdminFinance = lazy(() => import('./pages/admin/FinancePage'));
const AdminMe = lazy(() => import('./pages/admin/MePage'));
const AdminClassesList = lazy(() => import('./pages/admin/classes/ClassesListPage'));
const AdminClassCreate = lazy(() => import('./pages/admin/classes/ClassCreatePage'));
const AdminClassDetail = lazy(() => import('./pages/admin/classes/ClassDetailPage'));
const AdminClassEdit = lazy(() => import('./pages/admin/classes/ClassEditPage'));
const AdminQuestsList = lazy(() => import('./pages/admin/quests/QuestsListPage'));
const AdminQuestCreate = lazy(() => import('./pages/admin/quests/QuestCreatePage'));
const AdminQuestEdit = lazy(() => import('./pages/admin/quests/QuestEditPage'));
const AdminQuestAnalytics = lazy(() => import('./pages/admin/quests/QuestAnalyticsPage'));
const AdminBadgesList = lazy(() => import('./pages/admin/badges/BadgesListPage'));
const AdminBadgeCreate = lazy(() => import('./pages/admin/badges/BadgeCreatePage'));
const AdminBadgeEdit = lazy(() => import('./pages/admin/badges/BadgeEditPage'));
const LiveMonitorPage = lazy(() => import('./pages/admin/monitor/LiveMonitorPage'));
const AdminExamsList = lazy(() => import('./pages/admin/exams/ExamsListPage'));
const AdminExamForm = lazy(() => import('./pages/admin/exams/ExamFormPage'));
const AdminExamDetail = lazy(() => import('./pages/admin/exams/ExamDetailPage'));
const AdminMazeList = lazy(() => import('./pages/admin/maze/MazeLevelsListPage'));
const AdminMazeCreate = lazy(() => import('./pages/admin/maze/MazeLevelCreatePage'));
const AdminMazeEdit = lazy(() => import('./pages/admin/maze/MazeLevelEditPage'));
const AdminMazeProgress = lazy(() => import('./pages/admin/maze/MazeProgressPage'));
const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));
const StudentMazeLevels = lazy(() => import('./pages/student/maze/MazeLevelsPage'));
const StudentMazeSolve = lazy(() => import('./pages/student/maze/MazeSolvePage'));
const StudentQuests = lazy(() => import('./pages/student/QuestsPage'));
const StudentBadges = lazy(() => import('./pages/student/BadgesPage'));
const StudentLeaderboard = lazy(() => import('./pages/student/LeaderboardPage'));
const StudentShop = lazy(() => import('./pages/student/ShopPage'));
const StudentAssignments = lazy(() => import('./pages/student/AssignmentsPage'));
const StudentWorkspace = lazy(() => import('./pages/student/WorkspacePage'));
const StudentAssignmentDetail = lazy(() => import('./pages/student/AssignmentDetailPage'));
const StudentBlogList = lazy(() => import('./pages/student/blog/BlogListPage'));
const StudentBlogDetail = lazy(() => import('./pages/student/blog/BlogDetailPage'));
const StudentExamsList = lazy(() => import('./pages/student/exams/ExamsListPage'));
const StudentTakeExam = lazy(() => import('./pages/student/exams/TakeExamPage'));
const StudentExamLeaderboard = lazy(() => import('./pages/student/exams/ExamLeaderboardPage'));
const StudentExamResult = lazy(() => import('./pages/student/exams/ExamResultPage'));
const StudentClasses = lazy(() => import('./pages/student/ClassesPage'));
const StudentClassDetail = lazy(() => import('./pages/student/ClassDetailPage'));
const StudentCourseDetail = lazy(() => import('./pages/student/CourseDetailPage'));
const StudentMe = lazy(() => import('./pages/student/MePage'));

const SubmissionsPage = lazy(() => import('./pages/shared/SubmissionsPage'));
const ChatPage = lazy(() => import('./pages/shared/ChatPage'));
const TeacherFinance = lazy(() => import('./pages/teacher/FinancePage'));

import { ToastProvider, ConfirmProvider } from '@cp/ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, gcTime: 10 * 60_000, retry: 1 } },
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
        <ConfirmProvider>
          <BrowserRouter>
            <ToastProvider />
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
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
                <Route path="classes/:classId/curriculum" element={<AdminClassCurriculum />} />
                <Route path="courses" element={<AdminCoursesList />} />
                <Route path="courses/:courseId" element={<AdminCourseDetail />} />
                <Route path="assignments" element={<AdminAssignmentsList />} />
                <Route path="assignments/new" element={<AdminAssignmentCreate />} />
                <Route path="assignments/:id" element={<AdminAssignmentDetail />} />
                <Route path="assignments/:id/edit" element={<AdminAssignmentEdit />} />
                <Route path="blog" element={<BlogManageList />} />
                <Route path="blog/new" element={<BlogCreate />} />
                <Route path="blog/preview/:id" element={<BlogPreview />} />
                <Route path="blog/:id/edit" element={<BlogEdit />} />
                <Route path="shop" element={<AdminShopList />} />
                <Route path="shop/new" element={<AdminShopCreate />} />
                <Route path="shop/:id/edit" element={<AdminShopEdit />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="quests" element={<AdminQuestsList />} />
                <Route path="quests/new" element={<AdminQuestCreate />} />
                <Route path="quests/:id/edit" element={<AdminQuestEdit />} />
                <Route path="quests/analytics" element={<AdminQuestAnalytics />} />
                <Route path="badges" element={<AdminBadgesList />} />
                <Route path="badges/new" element={<AdminBadgeCreate />} />
                <Route path="badges/:id/edit" element={<AdminBadgeEdit />} />
                <Route path="monitor" element={<LiveMonitorPage />} />
                <Route path="maze" element={<AdminMazeList />} />
                <Route path="maze/new" element={<AdminMazeCreate />} />
                <Route path="maze/progress" element={<AdminMazeProgress />} />
                <Route path="maze/:id/edit" element={<AdminMazeEdit />} />
                <Route path="exams" element={<AdminExamsList />} />
                <Route path="exams/new" element={<AdminExamForm />} />
                <Route path="exams/:id" element={<AdminExamDetail />} />
                <Route path="exams/:id/edit" element={<AdminExamForm />} />

                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:conversationId" element={<ChatPage />} />
                <Route path="me" element={<AdminMe />} />
                <Route path="settings" element={<AdminMe />} />
              </Route>

              {/* ── Teacher portal ───────────────────────────────────── */}
              {/* Mirrors the Admin portal (shared page components) minus the
                  Dashboard, Users and Quest-analytics tabs. Finance has its own
                  read-only teacher page. Pages build links via usePortalBase()
                  so they stay within /teacher/*. */}
              <Route
                path="/teacher"
                element={
                  <RoleGuard allow={[UserRole.TEACHER]}>
                    <TeacherLayout />
                  </RoleGuard>
                }
              >
                <Route index element={<Navigate to="students" replace />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="students/new" element={<AdminStudentCreate />} />
                <Route path="students/:studentId" element={<AdminStudentProfile />} />
                <Route path="students/:studentId/edit" element={<AdminStudentEdit />} />
                <Route path="classes" element={<AdminClassesList />} />
                <Route path="classes/new" element={<AdminClassCreate />} />
                <Route path="classes/:classId" element={<AdminClassDetail />} />
                <Route path="classes/:classId/edit" element={<AdminClassEdit />} />
                <Route path="classes/:classId/curriculum" element={<AdminClassCurriculum />} />
                <Route path="courses" element={<AdminCoursesList />} />
                <Route path="courses/:courseId" element={<AdminCourseDetail />} />
                <Route path="assignments" element={<AdminAssignmentsList />} />
                <Route path="assignments/new" element={<AdminAssignmentCreate />} />
                <Route path="assignments/:id" element={<AdminAssignmentDetail />} />
                <Route path="assignments/:id/edit" element={<AdminAssignmentEdit />} />
                <Route path="blog" element={<BlogManageList />} />
                <Route path="blog/new" element={<BlogCreate />} />
                <Route path="blog/preview/:id" element={<BlogPreview />} />
                <Route path="blog/:id/edit" element={<BlogEdit />} />
                <Route path="quests" element={<AdminQuestsList />} />
                <Route path="quests/new" element={<AdminQuestCreate />} />
                <Route path="quests/:id/edit" element={<AdminQuestEdit />} />
                <Route path="badges" element={<AdminBadgesList />} />
                <Route path="badges/new" element={<AdminBadgeCreate />} />
                <Route path="badges/:id/edit" element={<AdminBadgeEdit />} />
                <Route path="maze" element={<AdminMazeList />} />
                <Route path="maze/new" element={<AdminMazeCreate />} />
                <Route path="maze/progress" element={<AdminMazeProgress />} />
                <Route path="maze/:id/edit" element={<AdminMazeEdit />} />
                <Route path="exams" element={<AdminExamsList />} />
                <Route path="exams/new" element={<AdminExamForm />} />
                <Route path="exams/:id" element={<AdminExamDetail />} />
                <Route path="exams/:id/edit" element={<AdminExamForm />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="finance" element={<TeacherFinance />} />
                <Route path="monitor" element={<LiveMonitorPage />} />

                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:conversationId" element={<ChatPage />} />
                <Route path="me" element={<AdminMe />} />
                <Route path="settings" element={<AdminMe />} />
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
                <Route path="classes" element={<StudentClasses />} />
                <Route path="classes/:classId" element={<StudentClassDetail />} />
                <Route path="classes/:classId/courses/:courseId" element={<StudentCourseDetail />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="assignments/:id" element={<StudentAssignmentDetail />} />
                <Route path="exams" element={<StudentExamsList />} />
                <Route path="exams/:id/take" element={<StudentTakeExam />} />
                <Route path="exams/:id/leaderboard" element={<StudentExamLeaderboard />} />
                <Route path="exams/:id/result" element={<StudentExamResult />} />
                <Route path="blog" element={<StudentBlogList />} />
                <Route path="blog/:slug" element={<StudentBlogDetail />} />
                <Route path="maze" element={<StudentMazeLevels />} />
                <Route path="maze/:levelId" element={<StudentMazeSolve />} />
                <Route path="workspace" element={<StudentWorkspace />} />
                <Route path="workspace/:problemId" element={<StudentWorkspace />} />
                <Route path="quests" element={<StudentQuests />} />
                <Route path="badges" element={<StudentBadges />} />
                <Route path="leaderboard" element={<StudentLeaderboard />} />
                <Route path="shop" element={<StudentShop />} />

                <Route path="submissions" element={<SubmissionsPage />} />
                <Route path="me" element={<StudentMe />} />
              </Route>

              {/* Default — send user to their own portal home */}
              <Route path="/" element={<RoleHomeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

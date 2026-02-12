import './App.css'
import React, { Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { LoaderTwo } from '@/components/ui/loader'
import { useEffect } from 'react'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const ExamGenerator = lazy(() => import('./components/ExamGenerator'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Announcements = lazy(() => import('./pages/Announcements'))
const CreateAnnouncement = lazy(() => import('./pages/CreateAnnouncement'))
const TakeExam = lazy(() => import('./pages/TakeExam'))
const ExamResults = lazy(() => import('./pages/ExamResults'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Full page loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="scale-150"><LoaderTwo /></div>
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Toaster position="top-right" reverseOrder={false} />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* <Route path="/verify-otp" element={<VerifyOtp />} /> */}

            {/* Student Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Teacher Dashboard */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* Exam Generator for Teachers */}
            <Route
              path="/teacher/exam-generator"
              element={
                <ProtectedRoute>
                  <ExamGenerator />
                </ProtectedRoute>
              }
            />

            {/* Courses */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />

            {/* Assignments */}
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments"
              element={
                <ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>
              }
            />

            {/* Announcements */}
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/create"
              element={
                <ProtectedRoute>
                  <CreateAnnouncement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/:id"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />

            {/* Exams */}
            <Route
              path="/exam/:examId/take"
              element={
                <ProtectedRoute>
                  <TakeExam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:examId/results"
              element={
                <ProtectedRoute>
                  <ExamResults />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  )
}

export default App

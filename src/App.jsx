import './App.css'
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import ExamGenerator from './components/ExamGenerator'
import UserProfile from './pages/UserProfile'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Assignments from './pages/Assignments'
import Announcements from './pages/Announcements'
import CreateAnnouncement from './pages/CreateAnnouncement'
import TakeExam from './pages/TakeExam'
import ExamResults from './pages/ExamResults'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
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
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

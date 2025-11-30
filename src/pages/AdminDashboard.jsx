import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, courseAPI, semesterAPI, subjectAPI, enrollmentAPI, userAPI, gradeAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { normalizeSkills } from '@/utils/skillUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  Shield,
  Trash2,
  Eye,
  Search,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Calendar,
  Clock,
  Award,
  MinusCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('students');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const defaultCourseForm = {
    codeName: '', // e.g. "CS101 - Computer Science"
    credits: '',
    department: '',
    semester: '',
    teacher: '',
    section: 'A',
    maxCapacity: 50,
    schedule: {
      days: [],
      startTime: '09:00',
      endTime: '10:30',
    },
    room: '',
    description: '',
  };
  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [teachers, setTeachers] = useState([]);
  const [teachersSearch, setTeachersSearch] = useState('');
  const [directoryStudents, setDirectoryStudents] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState(null);
  const [courseEnrollees, setCourseEnrollees] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignLoadingId, setAssignLoadingId] = useState('');
  const emptyAdminAnalytics = {
    totalGrades: 0,
    averagePercentage: 0,
    distribution: {},
    courseBreakdown: [],
    topStudents: [],
    recentGrades: [],
    teacherLeaderboard: [],
  };
  const [gradesAnalytics, setGradesAnalytics] = useState(emptyAdminAnalytics);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradeView, setGradeView] = useState('students');
  const [selectedCourseBreakdown, setSelectedCourseBreakdown] = useState('all');
  const [hasGradesData, setHasGradesData] = useState(false);
  const [teacherForCourse, setTeacherForCourse] = useState(null);
  const [showTeacherCourseModal, setShowTeacherCourseModal] = useState(false);
  const [selectedTeacherCourseId, setSelectedTeacherCourseId] = useState('');
  const [assigningTeacherCourse, setAssigningTeacherCourse] = useState(false);
  const [revokingCourseId, setRevokingCourseId] = useState('');
  const [selectedCourseSemester, setSelectedCourseSemester] = useState('all');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [user, navigate, pagination.page, searchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'grades') {
      loadAdminsGradeAnalytics();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, semestersRes, subjectsRes, coursesRes] = await Promise.all([
        adminAPI.getStats(),
        semesterAPI.getAll(),
        subjectAPI.getAll(),
        courseAPI.getAll(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (semestersRes.success) setSemesters(semestersRes.data);
      if (subjectsRes.success) setSubjects(subjectsRes.data?.subjects || subjectsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data?.courses || coursesRes.data || []);

      const teachersRes = await adminAPI.getAllUsers({ role: 'teacher', limit: 200 });
      if (teachersRes.success) setTeachers(teachersRes.data.users || []);

      const studentsRes = await adminAPI.getAllUsers({
        role: 'user',
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      if (studentsRes.success) {
        setStudents(studentsRes.data.users || []);
        setPagination((prev) => ({ ...prev, ...studentsRes.data.pagination }));
      }

      const directoryRes = await adminAPI.getAllUsers({ role: 'user', limit: 500 });
      if (directoryRes.success) {
        setDirectoryStudents(directoryRes.data.users || []);
      }
      await loadAdminsGradeAnalytics();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminsGradeAnalytics = async () => {
    try {
      setGradesLoading(true);
      const res = await gradeAPI.getAdminOverview();
      if (res.success) {
        setGradesAnalytics(res.data);
        setHasGradesData(Boolean(
          res.data?.totalGrades ||
          (res.data?.courseBreakdown?.length ?? 0) ||
          (res.data?.topStudents?.length ?? 0) ||
          (res.data?.recentGrades?.length ?? 0)
        ));
        setSelectedCourseBreakdown('all');
      } else {
        setGradesAnalytics(emptyAdminAnalytics);
        setHasGradesData(false);
      }
    } catch (error) {
      console.error('Error loading grades analytics:', error);
      setGradesAnalytics(emptyAdminAnalytics);
      setHasGradesData(false);
    } finally {
      setGradesLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const response = await adminAPI.deleteUser(studentId);
      if (response.success) {
        fetchDashboardData();
        setShowStudentDetails(false);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleViewStudent = async (studentId) => {
    try {
      const response = await userAPI.getUser(studentId);
      if (response.success) {
        setSelectedStudent(response.data);
        setShowStudentDetails(true);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      // Send codeName, credits, department, and other fields to backend
      const response = await courseAPI.create({
        ...courseForm,
        // The backend expects codeName in the format "CODE - Name"
      });
      if (response.success) {
        setShowCourseForm(false);
        setCourseForm(defaultCourseForm);
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await courseAPI.delete(courseId);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const toggleDay = (day) => {
    const days = courseForm.schedule.days.includes(day)
      ? courseForm.schedule.days.filter(d => d !== day)
      : [...courseForm.schedule.days, day];
    setCourseForm(prev => ({
      ...prev,
      schedule: { ...prev.schedule, days }
    }));
  };

  const refreshCourseStudents = async (courseId) => {
    try {
      const res = await enrollmentAPI.getCourseEnrollments(courseId);
      if (res.success) {
        setCourseEnrollees(Array.isArray(res.data) ? res.data : []);
      } else {
        setCourseEnrollees([]);
      }
    } catch (error) {
      console.error('Error loading course students:', error);
      setCourseEnrollees([]);
    }
  };

  const openAssignModal = async (course) => {
    setCourseToAssign(course);
    setShowAssignModal(true);
    setAssignSearch('');
    await refreshCourseStudents(course._id);
  };

  const handleAssignStudentToCourse = async (studentId) => {
    if (!courseToAssign) return;
    setAssignLoadingId(studentId);
    try {
      const res = await enrollmentAPI.adminEnroll(studentId, courseToAssign._id);
      if (res.success) {
        await refreshCourseStudents(courseToAssign._id);
        fetchDashboardData();
      } else {
        toast.error(res.message || 'Failed to assign student');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign student');
    } finally {
      setAssignLoadingId('');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';
  };

  const getStudentName = (student) => {
    if (!student) return 'Student';
    if (student.username) return student.username;
    if (student.firstname || student.lastname) {
      return `${student.firstname || ''} ${student.lastname || ''}`.trim();
    }
    return 'Student';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTeacherCourses = (teacherId) => {
    return courses.filter((course) => course.teacher?._id === teacherId || course.teacher === teacherId);
  };

  const handleOpenCreateCourse = (teacherId = '') => {
    setCourseForm({
      ...defaultCourseForm,
      teacher: teacherId,
    });
    setShowCourseForm(true);
  };

  const [unassignedCourses, setUnassignedCourses] = useState([]);
  useEffect(() => {
    const fetchUnassigned = async () => {
      if (showTeacherCourseModal) {
        try {
          const res = await courseAPI.getUnassigned();
          setUnassignedCourses(res.courses || res.data || []);
        } catch (e) {
          setUnassignedCourses([]);
        }
      }
    };
    fetchUnassigned();
  }, [showTeacherCourseModal]);

  const openTeacherCourseModal = (teacher) => {
    setTeacherForCourse(teacher);
    setSelectedTeacherCourseId('');
    setShowTeacherCourseModal(true);
  };

  const handleAssignCourseToTeacher = async () => {
    if (!teacherForCourse || !selectedTeacherCourseId) return;
    try {
      setAssigningTeacherCourse(true);
      await courseAPI.assignTeacher(selectedTeacherCourseId, teacherForCourse._id);
      setShowTeacherCourseModal(false);
      setTeacherForCourse(null);
      setSelectedTeacherCourseId('');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign course to teacher');
    } finally {
      setAssigningTeacherCourse(false);
    }
  };

  const handleRevokeTeacherCourse = async (courseId) => {
    try {
      setRevokingCourseId(courseId);
      await courseAPI.removeTeacher(courseId);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke teacher from course');
    } finally {
      setRevokingCourseId('');
    }
  };

  const filteredCourseBreakdown = useMemo(() => {
    if (!gradesAnalytics?.courseBreakdown?.length) return [];
    if (selectedCourseBreakdown === 'all') return gradesAnalytics.courseBreakdown;
    return gradesAnalytics.courseBreakdown.filter(
      (course) => course.courseId === selectedCourseBreakdown
    );
  }, [gradesAnalytics, selectedCourseBreakdown]);

  if (loading && !stats) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Manage students and courses</p>
          </div>
          {activeTab === 'courses' && (
            <Button
              onClick={() => handleOpenCreateCourse()}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Students</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalStudents || 0}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Teachers</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{teachers.length}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Courses</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{courses.length}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">New This Month</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats?.newStudentsThisMonth || 0}</h3>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('students'); setPagination({ page: 1, limit: 10 }); }}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'students'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Students ({stats?.totalStudents || 0})
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('courses'); }}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'courses'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses ({courses.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'teachers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teachers ({teachers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'grades'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Grades
              </div>
            </button>
          </div>

          {activeTab === 'students' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Student Management</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-800 w-64"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students found</p>
                ) : (
                  students.map((studentData) => (
                    <div
                      key={studentData._id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <Avatar className="h-12 w-12 border-2 border-green-200">
                        <AvatarImage src={studentData.profileimage || studentData.profileImage} alt={getStudentName(studentData)} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                          {getInitials(getStudentName(studentData))}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        {(() => {
                          const skills = normalizeSkills(studentData.skills);
                          return (
                            <>
                              <p className="text-gray-800 font-medium">
                                {getStudentName(studentData)}
                              </p>
                              <p className="text-gray-500 text-sm">{studentData.email}</p>
                              {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {skills.slice(0, 3).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs text-gray-600 border-gray-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {skills.length > 3 && (
                                    <span className="text-xs text-gray-400">
                                      +{skills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleViewStudent(studentData._id)}
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/users/${studentData._id}`)}
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          View Profile
                        </Button>
                        <Button
                          onClick={() => handleDeleteStudent(studentData._id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    size="sm"
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600 px-4 py-2">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    size="sm"
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'courses' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Course Management</h3>
                <Select value={selectedCourseSemester} onValueChange={setSelectedCourseSemester}>
                  <SelectTrigger className="w-48 border-gray-300">
                    <SelectValue placeholder="Filter by Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(sem => (
                      <SelectItem key={sem._id} value={sem._id}>
                        {sem.name} {sem.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const filteredCourses = selectedCourseSemester === 'all' 
                    ? courses 
                    : courses.filter(course => course.semester?._id === selectedCourseSemester || course.semester === selectedCourseSemester);
                  
                  if (filteredCourses.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8 col-span-full">
                        {courses.length === 0 ? 'No courses created yet' : 'No courses found for selected semester'}
                      </p>
                    );
                  }
                  
                  return filteredCourses.map((course) => (
                    <Card key={course._id} className="bg-gray-50 border border-gray-200 p-4 hover:shadow-md transition-all flex flex-col gap-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 mb-2">
                            {course.subject?.code}
                          </Badge>
                          <h4 className="font-bold text-gray-800">{course.subject?.name}</h4>
                          <p className="text-xs text-gray-500">
                            {course.semester?.name} • Section {course.section || 'A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Teacher: {course.teacher?.username || 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openAssignModal(course)}
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            Assign Student
                          </Button>
                          <Button
                            onClick={() => handleDeleteCourse(course._id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {course.status === 'completed' ? 'Completed' : 'Active'} • {course.maxCapacity || 0} seats
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {course.semester?.name}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Section {course.section} • {course.currentEnrollment || 0}/{course.maxCapacity}
                        </p>
                      </div>
                    </Card>
                  ));
                })()}
              </div>
            </>
          )}

          {activeTab === 'teachers' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Teacher Directory</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teachers..."
                    value={teachersSearch}
                    onChange={(e) => setTeachersSearch(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-800 w-64"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {teachers
                  .filter((teacher) =>
                    getStudentName(teacher).toLowerCase().includes(teachersSearch.toLowerCase()) ||
                    teacher.email?.toLowerCase().includes(teachersSearch.toLowerCase())
                  )
                  .map((teacher) => {
                    const assignedCourses = getTeacherCourses(teacher._id);
                    return (
                      <div
                        key={teacher._id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-blue-200">
                            <AvatarImage src={teacher.profileimage} alt={getStudentName(teacher)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {getInitials(getStudentName(teacher))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-gray-800 font-semibold">{getStudentName(teacher)}</p>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                            <p className="text-xs text-gray-400">
                              {teacher.teacherProfile?.department || 'Department not set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="border-gray-300 text-gray-600 hover:bg-gray-100"
                            onClick={() => navigate(`/users/${teacher._id}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => openTeacherCourseModal(teacher)}
                          >
                            Assign Course
                          </Button>
                          <Button
                            variant="outline"
                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                            onClick={() => handleOpenCreateCourse(teacher._id)}
                          >
                            New Course
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this teacher?')) return;
                                try {
                                  await userAPI.deleteUser(teacher._id);
                                  toast.success('Teacher deleted');
                                  // Remove from list without refetching all
                                  setTeachers(prev => prev.filter(t => t._id !== teacher._id));
                                } catch (err) {
                                  toast.error(err?.response?.data?.message || 'Failed to delete teacher');
                                }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                        {assignedCourses.length > 0 && (
                          <div className="w-full">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Courses</p>
                            <div className="flex flex-wrap gap-2">
                              {assignedCourses.map((course) => (
                                <div
                                  key={course._id}
                                  className="flex items-center gap-2 border border-gray-200 bg-white rounded-full px-3 py-1 text-xs text-gray-600"
                                >
                                  <span>{course.subject?.code} • {course.semester?.name}</span>
                                  <button
                                    onClick={() => handleRevokeTeacherCourse(course._id)}
                                    disabled={revokingCourseId === course._id}
                                    className="text-red-500 hover:text-red-600 disabled:opacity-50"
                                  >
                                    <MinusCircle className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {activeTab === 'grades' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Grades Overview</h3>
              </div>
              {gradesLoading ? (
                <p className="text-gray-500 text-sm">Loading analytics...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Total Grades</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradesAnalytics.totalGrades}</p>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Average Score</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradesAnalytics.averagePercentage || 0}%</p>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Courses Evaluated</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradesAnalytics.courseBreakdown?.length || 0}</p>
                    </Card>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">View analytics by</p>
                      <Select value={gradeView} onValueChange={(val) => setGradeView(val)}>
                        <SelectTrigger className="w-48 bg-white border-gray-300">
                          <SelectValue placeholder="Students" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="subjects">Subjects</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {gradeView === 'subjects' && (
                      <Select value={selectedCourseBreakdown} onValueChange={setSelectedCourseBreakdown}>
                        <SelectTrigger className="w-60 bg-white border-gray-300">
                          <SelectValue placeholder="All subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {gradesAnalytics.courseBreakdown?.map((course) => (
                            <SelectItem key={course.courseId} value={course.courseId}>
                              {course.code} • {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {!hasGradesData && (
                    <div className="border border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 bg-white">
                      No grade analytics are available yet. As teachers grade and finalize coursework, the dashboards on this tab will populate automatically.
                    </div>
                  )}

                  {gradeView === 'students' ? (
                    <>
                      {hasGradesData ? (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="bg-white border border-gray-200 p-4">
                              <h4 className="font-semibold text-gray-800 mb-3">Grade Distribution</h4>
                              <div className="space-y-2">
                                {Object.entries(gradesAnalytics.distribution || {}).map(([grade, count]) => (
                                  <div key={grade} className="flex items-center gap-2 text-sm">
                                    <span className="w-10 font-medium">{grade}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                        style={{ width: `${gradesAnalytics.totalGrades ? (count / gradesAnalytics.totalGrades) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <span className="w-8 text-right">{count}</span>
                                  </div>
                                ))}
                              </div>
                            </Card>

                            <Card className="bg-white border border-gray-200 p-4">
                              <h4 className="font-semibold text-gray-800 mb-3">Teacher Leaderboard</h4>
                              {gradesAnalytics.teacherLeaderboard?.length ? (
                                <div className="space-y-2">
                                  {gradesAnalytics.teacherLeaderboard.map((teacher) => (
                                    <div key={teacher.teacherId} className="flex items-center justify-between text-sm">
                                      <div>
                                        <p className="text-gray-800 font-medium">{teacher.name}</p>
                                        <p className="text-gray-500 text-xs">{teacher.email}</p>
                                      </div>
                                      <Badge variant="outline" className="text-gray-700 border-gray-200">
                                        {teacher.totalGrades} grades
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No teacher activity yet.</p>
                              )}
                            </Card>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="bg-white border border-gray-200 p-4">
                              <h4 className="font-semibold text-gray-800 mb-3">Top Students</h4>
                              {gradesAnalytics.topStudents?.length ? (
                                <div className="space-y-2">
                                  {gradesAnalytics.topStudents.map((student) => (
                                    <div key={student.studentId} className="flex items-center justify-between text-sm">
                                      <div>
                                        <p className="text-gray-800 font-medium">{student.name}</p>
                                        <p className="text-gray-500 text-xs">{student.email}</p>
                                      </div>
                                      <Badge variant="outline" className="text-gray-700 border-gray-200">
                                        {student.average}%
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No top student data.</p>
                              )}
                            </Card>

                            <Card className="bg-white border border-gray-200 p-4">
                              <h4 className="font-semibold text-gray-800 mb-3">Recent Grades</h4>
                              {gradesAnalytics.recentGrades?.length ? (
                                <div className="space-y-2 text-sm">
                                  {gradesAnalytics.recentGrades.map((grade, idx) => (
                                    <div key={`${grade.student?.email}-${idx}`} className="flex items-center justify-between">
                                      <div>
                                        <p className="text-gray-800 font-medium">{grade.student?.username}</p>
                                        <p className="text-gray-500 text-xs">{grade.course?.subject?.name}</p>
                                      </div>
                                      <Badge variant="outline" className="text-gray-700 border-gray-200">
                                        {grade.letterGrade} • {grade.totalPercentage}%
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No grades recorded.</p>
                              )}
                            </Card>
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Card className="bg-white border border-gray-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                        <h4 className="font-semibold text-gray-800">Subject Performance</h4>
                        <p className="text-sm text-gray-500">
                          {selectedCourseBreakdown === 'all'
                            ? `${gradesAnalytics.courseBreakdown?.length || 0} subjects`
                            : `${filteredCourseBreakdown[0]?.code || ''} • ${filteredCourseBreakdown[0]?.name || ''}`}
                        </p>
                      </div>
                      {hasGradesData && filteredCourseBreakdown.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {filteredCourseBreakdown.map((course) => (
                            <div key={course.courseId} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <p className="font-semibold text-gray-800">{course.code} • {course.name}</p>
                              <p>Semester: {course.semester}</p>
                              <p>Grades Recorded: {course.totalGrades}</p>
                              <p>Average Score: {course.average}%</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No course analytics available.</p>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Assign Teacher to Course Modal */}
      {showTeacherCourseModal && teacherForCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-lg w-full"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Course</h3>
                <p className="text-sm text-gray-500">
                  {getStudentName(teacherForCourse)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowTeacherCourseModal(false); setTeacherForCourse(null); setSelectedTeacherCourseId(''); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {unassignedCourses.length === 0 ? (
              <p className="text-sm text-gray-500">
                No available courses to assign. You may need to create a new course first.
              </p>
            ) : (
              <div className="space-y-4">
                <Label className="text-gray-700">Select Course</Label>
                <Select value={selectedTeacherCourseId} onValueChange={setSelectedTeacherCourseId}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {unassignedCourses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.subject?.code} • {course.subject?.name} ({course.semester?.name || 'Semester'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignCourseToTeacher}
                  disabled={!selectedTeacherCourseId || assigningTeacherCourse}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                >
                  {assigningTeacherCourse ? 'Assigning...' : 'Assign Course'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Create New Course</h3>
              <Button onClick={() => { setShowCourseForm(false); setCourseForm(defaultCourseForm); }} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-700">Course Code - Name *</Label>
                  <Input
                    value={courseForm.codeName}
                    onChange={e => setCourseForm(prev => ({ ...prev, codeName: e.target.value }))}
                    placeholder="e.g. CS101 - Computer Science"
                    className="bg-gray-50 border-gray-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Credits</Label>
                  <Input
                    type="number"
                    value={courseForm.credits}
                    onChange={e => setCourseForm(prev => ({ ...prev, credits: e.target.value }))}
                    placeholder="e.g. 4"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Department</Label>
                  <Input
                    value={courseForm.department}
                    onChange={e => setCourseForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Computer Science"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Semester *</Label>
                  <Select onValueChange={(v) => setCourseForm(prev => ({ ...prev, semester: v }))}>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map(sem => (
                        <SelectItem key={sem._id} value={sem._id}>
                          {sem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Teacher</Label>
                  <Select onValueChange={(v) => setCourseForm(prev => ({ ...prev, teacher: v }))}>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Assign teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Section</Label>
                  <Select 
                    value={courseForm.section}
                    onValueChange={(v) => setCourseForm(prev => ({ ...prev, section: v }))}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E'].map(s => (
                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Max Capacity</Label>
                  <Input
                    type="number"
                    value={courseForm.maxCapacity}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Room</Label>
                  <Input
                    value={courseForm.room}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Room 101"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Course Description</Label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[90px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Brief summary, prerequisites, or goals for this course"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Schedule Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        courseForm.schedule.days.includes(day)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Start Time</Label>
                  <Input
                    type="time"
                    value={courseForm.schedule.startTime}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, startTime: e.target.value }
                    }))}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">End Time</Label>
                  <Input
                    type="time"
                    value={courseForm.schedule.endTime}
                    onChange={(e) => setCourseForm(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, endTime: e.target.value }
                    }))}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCourseForm(false);
                    setCourseForm(defaultCourseForm);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  Create Course
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-2xl w-full"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
              <Button onClick={() => setShowStudentDetails(false)} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-green-200">
                  <AvatarImage src={selectedStudent.profileimage || selectedStudent.profileImage} alt={getStudentName(selectedStudent)} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-2xl">
                    {getInitials(getStudentName(selectedStudent))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-gray-800 text-2xl font-bold">
                    {getStudentName(selectedStudent)}
                  </h4>
                  <p className="text-gray-500">{selectedStudent.email}</p>
                  <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                    Student
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-200" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="text-gray-800 font-medium">{selectedStudent.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Age</p>
                  <p className="text-gray-800 font-medium">{selectedStudent.age || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Gender</p>
                  <p className="text-gray-800 font-medium capitalize">{selectedStudent.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Enrolled</p>
                  <p className="text-gray-800 font-medium">{formatDate(selectedStudent.createdAt)}</p>
                </div>
              </div>

              {normalizeSkills(selectedStudent.skills).length > 0 && (
                <>
                  <Separator className="bg-gray-200" />
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {normalizeSkills(selectedStudent.skills).map((skill, i) => (
                        <Badge key={i} className="bg-indigo-100 text-indigo-700 border-indigo-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-600"
                  onClick={() => {
                    setShowStudentDetails(false);
                    navigate(`/users/${selectedStudent._id}`);
                  }}
                >
                  View Full Profile
                </Button>
                <Button
                  onClick={() => handleDeleteStudent(selectedStudent._id)}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Student
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAssignModal && courseToAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Students</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {courseToAssign.subject?.name} • {courseToAssign.semester?.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Search students..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-800"
              />

              <div className="text-sm text-gray-500">
                Currently enrolled: {courseEnrollees.filter((enrollment) => enrollment.status === 'enrolled').length} / {courseToAssign.maxCapacity || '∞'}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(() => {
                  return directoryStudents
                    .filter((student) =>
                      getStudentName(student).toLowerCase().includes(assignSearch.toLowerCase()) ||
                      student.email?.toLowerCase().includes(assignSearch.toLowerCase())
                    )
                    .map((student) => {
                      const enrollmentRecord = courseEnrollees.find(
                        (enrollment) => (enrollment.student?._id || enrollment.student) === student._id
                      );
                      const alreadyAssigned = Boolean(enrollmentRecord);
                      const statusLabel = enrollmentRecord?.status
                        ? enrollmentRecord.status.charAt(0).toUpperCase() + enrollmentRecord.status.slice(1)
                        : '';
                      return (
                        <div
                          key={student._id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div>
                            <p className="text-gray-800 font-medium">{getStudentName(student)}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <Button
                            size="sm"
                            disabled={alreadyAssigned || assignLoadingId === student._id}
                            onClick={() => handleAssignStudentToCourse(student._id)}
                            className={`${
                              alreadyAssigned
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {alreadyAssigned
                              ? `Assigned${statusLabel ? ` (${statusLabel})` : ''}`
                              : assignLoadingId === student._id
                              ? 'Assigning...'
                              : 'Assign'}
                          </Button>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;

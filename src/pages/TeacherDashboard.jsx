import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseAPI, gradeAPI } from '@/services/api';
import { normalizeSkills } from '@/utils/skillUtils';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BookOpen,
  GraduationCap,
  Search,
  Eye,
  Award,
  X,
  Clock,
  FileText,
  TrendingUp,
  Save,
  CheckCircle2,
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    student: '',
    course: '',
    grade: '',
    percentage: '',
    remarks: '',
  });
  const resetGradeForm = () => {
    setGradeForm({
      student: '',
      course: '',
      grade: '',
      percentage: '',
      remarks: '',
    });
  };
  const emptyTeacherAnalytics = {
    totalGrades: 0,
    averagePercentage: 0,
    distribution: {},
    courseBreakdown: [],
    topStudents: [],
  };
  const [gradeAnalytics, setGradeAnalytics] = useState(emptyTeacherAnalytics);
  const [gradeAnalyticsLoading, setGradeAnalyticsLoading] = useState(true);
  const [hasGradeAnalytics, setHasGradeAnalytics] = useState(false);
  const [finalizeLoadingId, setFinalizeLoadingId] = useState('');
  const [gradeCourseFilter, setGradeCourseFilter] = useState('all');
  const [analyticsCourseFilter, setAnalyticsCourseFilter] = useState('all');

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      navigate('/dashboard');
      return;
    }
    fetchTeacherData();
    loadGradeAnalytics();
  }, [user, navigate]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const coursesRes = await courseAPI.getMyCourses();
      if (coursesRes.success) {
        const courseList = coursesRes.data?.courses || coursesRes.data || [];
        setCourses(courseList);
        buildStudentDirectory(courseList);
      } else {
        setCourses([]);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGradeAnalytics = async () => {
    try {
      setGradeAnalyticsLoading(true);
      const res = await gradeAPI.getTeacherOverview();
      if (res.success) {
        setGradeAnalytics(res.data);
        setHasGradeAnalytics(Boolean(
          res.data?.totalGrades ||
          (res.data?.courseBreakdown?.length ?? 0) ||
          (res.data?.topStudents?.length ?? 0)
        ));
      } else {
        setGradeAnalytics(emptyTeacherAnalytics);
        setHasGradeAnalytics(false);
      }
    } catch (error) {
      console.error('Error fetching grade analytics:', error);
      setGradeAnalytics(emptyTeacherAnalytics);
      setHasGradeAnalytics(false);
    } finally {
      setGradeAnalyticsLoading(false);
    }
  };

  const buildStudentDirectory = (courseList = []) => {
    const map = new Map();

    courseList.forEach((course) => {
      course.enrolledStudents?.forEach((enrollment) => {
        const student = enrollment.student;
        if (!student?._id) return;

        if (!map.has(student._id)) {
          map.set(student._id, {
            ...student,
            profileImage: student.profileImage || student.profileimage,
            courses: [],
          });
        }

        map.get(student._id).courses.push({
          courseId: course._id,
          name: course.subject?.name,
          code: course.subject?.code,
          semester: course.semester?.name,
          status: enrollment.status,
        });
      });
    });

    setStudents(Array.from(map.values()));
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T';
  };

const formatEnrollmentStatus = (status) => {
  switch (status) {
    case 'graded':
      return 'Graded';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'dropped':
      return 'Dropped';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return 'Enrolled';
  }
};

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleOpenGradeModal = (student, course, gradeInfo) => {
    setGradeForm({
      student: student._id,
      course: course._id,
      grade: gradeInfo?.letterGrade || '',
      percentage: gradeInfo?.totalPercentage?.toString() || '',
      remarks: gradeInfo?.remarks || '',
    });
    setSelectedStudent(student);
    setSelectedCourse(course);
    setShowGradeModal(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...gradeForm,
        percentage: gradeForm.percentage ? parseFloat(gradeForm.percentage) : undefined,
      };
      const response = await gradeAPI.create(payload);
      if (response.success) {
        setShowGradeModal(false);
        resetGradeForm();
        fetchTeacherData();
        loadGradeAnalytics();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save grade');
    }
  };

  const handleFinalizeGrade = async (gradeId) => {
    if (!gradeId) return;
    try {
      setFinalizeLoadingId(gradeId);
      const res = await gradeAPI.finalizeGrade(gradeId);
      if (res.success) {
        fetchTeacherData();
        loadGradeAnalytics();
      } else {
        toast.error(res.message || 'Failed to finalize grade');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize grade');
    } finally {
      setFinalizeLoadingId('');
    }
  };

  const getStudentName = (student) => {
    if (!student) return 'Student';
    if (student.firstname || student.lastname) {
      const full = `${student.firstname || ''} ${student.lastname || ''}`.trim();
      if (full) return full;
    }
    if (student.username) return student.username;
    if (student.studentProfile?.firstName || student.studentProfile?.lastName) {
      return `${student.studentProfile?.firstName || ''} ${student.studentProfile?.lastName || ''}`.trim();
    }
    return 'Student';
  };

  const filteredStudents = students.filter(s => 
    getStudentName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudentsInCourses = students.length;
  const filteredGradeCourses = useMemo(() => {
    if (gradeCourseFilter === 'all') return courses;
    return courses.filter((course) => course._id === gradeCourseFilter);
  }, [courses, gradeCourseFilter]);

  const filteredAnalyticsCourse = useMemo(() => {
    if (!gradeAnalytics?.courseBreakdown?.length) return [];
    if (analyticsCourseFilter === 'all') return gradeAnalytics.courseBreakdown;
    return gradeAnalytics.courseBreakdown.filter(
      (course) => course.courseId === analyticsCourseFilter
    );
  }, [gradeAnalytics, analyticsCourseFilter]);

  useEffect(() => {
    if (gradeCourseFilter !== 'all' && !courses.some(course => course._id === gradeCourseFilter)) {
      setGradeCourseFilter('all');
    }
    if (
      analyticsCourseFilter !== 'all' &&
      !gradeAnalytics?.courseBreakdown?.some(cb => cb.courseId === analyticsCourseFilter)
    ) {
      setAnalyticsCourseFilter('all');
    }
  }, [courses, gradeCourseFilter, analyticsCourseFilter, gradeAnalytics]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
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
              <GraduationCap className="h-8 w-8 text-purple-600" />
              Teacher Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.username}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">My Courses</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{courses.length}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Students Enrolled</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalStudentsInCourses}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">All Students</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{students.length}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
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
              onClick={() => setActiveTab('courses')}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'courses'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                My Courses
              </div>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 px-4 font-medium transition-all ${
                activeTab === 'students'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Students
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
                Manage Grades
              </div>
            </button>
          </div>

          {/* My Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">My Teaching Courses</h3>
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No courses assigned yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <Card 
                      key={course._id} 
                      className="bg-gray-50 border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          {course.subject?.code}
                        </Badge>
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          Section {course.section}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-800 text-lg mb-2">{course.subject?.name}</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {course.schedule?.days?.join(', ')}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {course.currentEnrollment || 0}/{course.maxCapacity} students
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Student Directory</h3>
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
                {filteredStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students found</p>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all group"
                    >
                      <Avatar className="h-12 w-12 border-2 border-green-200">
                        <AvatarImage src={student.profileImage || student.profileimage} alt={getStudentName(student)} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                          {getInitials(getStudentName(student))}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">
                          {getStudentName(student)}
                        </p>
                        <p className="text-gray-500 text-sm">{student.email}</p>
                        {student.courses?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {student.courses.map((course) => (
                              <Badge
                                key={`${student._id}-${course.courseId}`}
                                variant="outline"
                                className="text-xs text-gray-600 border-gray-300"
                              >
                                {course.code} • {course.semester || course.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleViewStudent(student)}
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/users/${student._id}`)}
                          size="sm"
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Grade Management</h3>
              
              {gradeAnalyticsLoading ? (
                <p className="text-gray-500 text-sm">Loading analytics...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Grades Assigned</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradeAnalytics.totalGrades}</p>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Average Score</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradeAnalytics.averagePercentage || 0}%</p>
                    </Card>
                    <Card className="bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-500">Courses Graded</p>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{gradeAnalytics.courseBreakdown?.length || 0}</p>
                    </Card>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                    <div className="text-sm text-gray-500">Analytics scope</div>
                    <Select value={analyticsCourseFilter} onValueChange={setAnalyticsCourseFilter}>
                      <SelectTrigger className="w-60 bg-white border-gray-300">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {gradeAnalytics.courseBreakdown?.map((course) => (
                          <SelectItem key={course.courseId} value={course.courseId}>
                            {course.code} • {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!hasGradeAnalytics && (
                    <div className="border border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 bg-white">
                      Grade insights will appear after you grade and finalize your students' work.
                    </div>
                  )}

                  {hasGradeAnalytics && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-white border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">Grade Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(gradeAnalytics.distribution || {}).map(([grade, count]) => (
                              <div key={grade} className="flex items-center gap-2 text-sm">
                                <span className="w-10 font-medium">{grade}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    style={{ width: `${gradeAnalytics.totalGrades ? (count / gradeAnalytics.totalGrades) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right">{count}</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="bg-white border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">Top Students</h4>
                          {gradeAnalytics.topStudents?.length ? (
                            <div className="space-y-2">
                              {gradeAnalytics.topStudents.map((student) => (
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
                            <p className="text-gray-500 text-sm">No graded students yet.</p>
                          )}
                        </Card>
                      </div>

                      {filteredAnalyticsCourse.length > 0 && (
                        <Card className="bg-white border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            {analyticsCourseFilter === 'all' ? 'Course Performance' : 'Selected Course Performance'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            {filteredAnalyticsCourse.map((course) => (
                              <div key={course.courseId} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <p className="font-semibold text-gray-800">{course.code} • {course.name}</p>
                                <p>Grades: {course.totalGrades}</p>
                                <p>Average: {course.average}%</p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}
              
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No courses to manage grades for</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-gray-500">Filter by course</p>
                    <Select value={gradeCourseFilter} onValueChange={setGradeCourseFilter}>
                      <SelectTrigger className="w-60 bg-white border-gray-300">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.subject?.code} • {course.subject?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {filteredGradeCourses.length === 0 ? (
                    <Card className="bg-white border border-dashed border-gray-300 p-5 text-center text-gray-500">
                      No course matches the selected filter.
                    </Card>
                  ) : (
                    filteredGradeCourses.map((course) => (
                    <Card key={course._id} className="bg-gray-50 border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-2">
                            {course.subject?.code}
                          </Badge>
                          <h4 className="font-bold text-gray-800">{course.subject?.name}</h4>
                        </div>
                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                          {course.enrollmentCount ?? course.currentEnrollment ?? 0} enrolled
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {course.enrolledStudents?.length > 0 ? (
                          course.enrolledStudents.map((enrollment) => {
                            const student = enrollment.student;
                            const gradeInfo = enrollment.grade;
                            const isFinalized = gradeInfo?.status === 'finalized';
                            return (
                              <div 
                                key={enrollment._id} 
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border border-green-200">
                                    <AvatarImage src={student?.profileImage || student?.profileimage} alt={getStudentName(student)} />
                                    <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-400 text-white text-sm">
                                      {getInitials(getStudentName(student))}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="text-gray-800 font-medium block">
                                      {getStudentName(student)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatEnrollmentStatus(enrollment.status)} • {course.semester?.name}
                                    </span>
                                    {gradeInfo && (
                                      <span className="text-xs text-gray-500">
                                        Grade: {gradeInfo.letterGrade} ({gradeInfo.totalPercentage || 0}%) • {isFinalized ? 'Finalized' : 'Pending'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    onClick={() => {
                                      if (!isFinalized) {
                                        handleOpenGradeModal(student, course, gradeInfo);
                                      }
                                    }}
                                    size="sm"
                                    disabled={isFinalized}
                                    className={`bg-orange-100 text-orange-700 ${isFinalized ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-200'}`}
                                  >
                                    <Award className="h-4 w-4 mr-1" />
                                    {gradeInfo ? (isFinalized ? 'Finalized' : 'Update Grade') : 'Grade Student'}
                                  </Button>
                                  {gradeInfo && !isFinalized && (
                                    <Button
                                      onClick={() => handleFinalizeGrade(gradeInfo._id)}
                                      size="sm"
                                      variant="outline"
                                      disabled={finalizeLoadingId === gradeInfo._id}
                                      className="border-green-300 text-green-700 hover:bg-green-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      {finalizeLoadingId === gradeInfo._id ? 'Finalizing...' : 'Finalize'}
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => navigate(`/users/${student?._id}`)}
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                                  >
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center py-4">No students enrolled in this course</p>
                        )}
                      </div>
                    </Card>
                  )))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-lg w-full"
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
                  <AvatarImage src={selectedStudent.profileImage || selectedStudent.profileimage} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-2xl">
                    {getInitials(getStudentName(selectedStudent))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-gray-800 text-xl font-bold">
                    {getStudentName(selectedStudent)}
                  </h4>
                  <p className="text-gray-500">{selectedStudent.email}</p>
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
                  <p className="text-gray-500 text-sm">Address</p>
                  <p className="text-gray-800 font-medium">{selectedStudent.address || 'N/A'}</p>
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
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600"
                onClick={() => setShowStudentDetails(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                onClick={() => {
                  setShowStudentDetails(false);
                  navigate(`/users/${selectedStudent._id}`);
                }}
              >
                View Full Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedStudent && selectedCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{gradeForm.grade ? 'Update Grade' : 'Add Grade'}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {getStudentName(selectedStudent)} - {selectedCourse.subject?.name}
                </p>
              </div>
              <Button onClick={() => { setShowGradeModal(false); resetGradeForm(); }} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Grade *</Label>
                  <Select 
                    value={gradeForm.grade}
                    onValueChange={(v) => setGradeForm(prev => ({ ...prev, grade: v }))}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Score / CGPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={gradeForm.percentage}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="e.g. 85"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Remarks</Label>
                <Input
                  value={gradeForm.remarks}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional remarks..."
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={() => setShowGradeModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Grade
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherDashboard;

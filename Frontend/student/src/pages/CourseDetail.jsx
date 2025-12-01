import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseAPI, enrollmentAPI, gradeAPI, assignmentAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  MapPin,
  ArrowLeft,
  GraduationCap,
  FileText,
  CheckCircle,
  Award,
  Download,
} from 'lucide-react';
import BackButton from '@/components/BackButton';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState({ grades: [], stats: null });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isAssignedTeacher = course?.teacher?._id === user?._id;
  const canManage = user?.role === 'admin' || isAssignedTeacher;

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseRes = await courseAPI.getById(id);
      if (courseRes.success) setCourse(courseRes.data);

      const [enrollmentsRes, gradesRes, assignmentsRes] = await Promise.all([
        isTeacherOrAdmin ? enrollmentAPI.getCourseEnrollments(id).catch(() => ({ success: false })) : Promise.resolve({ success: false }),
        isTeacherOrAdmin ? gradeAPI.getCourseGrades(id).catch(() => ({ success: false })) : Promise.resolve({ success: false }),
        assignmentAPI.getCourseAssignments(id).catch(() => ({ success: false })),
      ]);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data);
      if (gradesRes.success) setGrades(gradesRes.data);
      if (assignmentsRes.success) setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Course Not Found</h2>
            <Button onClick={() => navigate('/courses')} className="mt-4">Back to Courses</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton to="/courses" variant="ghost" className="text-gray-500" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-gray-300 text-gray-600">
                {course.subject?.code}
              </Badge>
              <h1 className="text-2xl font-bold text-gray-800">{course.subject?.name}</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {course.semester?.name} • Section {course.section}
            </p>
          </div>
          <Badge variant={course.status === 'ongoing' ? 'default' : 'outline'}
                 className={course.status === 'ongoing' ? 'bg-green-100 text-green-700' : ''}>
            {course.status}
          </Badge>
        </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
              <TabsTrigger value="syllabus" className="data-[state=active]:bg-white">Syllabus</TabsTrigger>
              <TabsTrigger value="assignments" className="data-[state=active]:bg-white">
                Assignments {assignments.length > 0 && `(${assignments.length})`}
              </TabsTrigger>
              {canManage && (
                <>
                  <TabsTrigger value="students" className="data-[state=active]:bg-white">
                    Students ({enrollments.length})
                  </TabsTrigger>
                  <TabsTrigger value="grades" className="data-[state=active]:bg-white">Grades</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-gray-600" />
                      Course Information
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {course.description || course.subject?.description || 'No description available.'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Credits</p>
                          <p className="text-gray-800 font-medium">{course.subject?.credits}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Enrollment</p>
                          <p className="text-gray-800 font-medium">{course.enrollmentCount || course.currentEnrollment} / {course.maxCapacity}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      Schedule
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">{course.schedule?.days?.join(', ') || 'Not scheduled'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
                          {course.schedule?.startTime && course.schedule?.endTime 
                            ? `${course.schedule.startTime} - ${course.schedule.endTime}` : 'Time TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">{course.schedule?.room || 'Room TBD'}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-gray-600" />
                      Grading Policy
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(course.gradingPolicy || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-800 rounded-full" style={{ width: `${value}%` }} />
                            </div>
                            <span className="text-gray-800 font-medium w-10 text-right">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Instructor</h3>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-200">
                        <AvatarImage src={course.teacher?.profileimage} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {getInitials(course.teacher?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-800 font-medium">{course.teacher?.username}</p>
                        <p className="text-gray-500 text-sm">{course.teacher?.email}</p>
                      </div>
                    </div>
                  </Card>

                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <Card className="bg-white border border-gray-200 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Prerequisites</h3>
                      <div className="space-y-2">
                        {course.prerequisites.map(prereq => (
                          <div key={prereq._id} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{prereq.name}</span>
                            <Badge variant="outline" className="text-gray-500">{prereq.code}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="syllabus">
              <Card className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Course Syllabus
                </h3>
                
                {course.syllabus && course.syllabus.length > 0 ? (
                  <div className="space-y-4">
                    {course.syllabus.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 font-bold">W{item.week}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-800 font-medium">{item.topic}</h4>
                          {item.description && <p className="text-gray-500 text-sm mt-1">{item.description}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Syllabus not available yet</p>
                )}
              </Card>
            </TabsContent>

            {canManage && (
              <TabsContent value="students">
                <Card className="bg-white border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    Enrolled Students ({enrollments.length})
                  </h3>
                  
                  {enrollments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                            <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                            <th className="text-left py-3 px-4 text-gray-500 font-medium">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((enrollment) => (
                            <tr key={enrollment._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-gray-200">
                                    <AvatarImage src={enrollment.student?.profileimage} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                      {getInitials(enrollment.student?.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-gray-800 font-medium">{enrollment.student?.username}</p>
                                    <p className="text-gray-500 text-sm">{enrollment.student?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'outline'}
                                       className={enrollment.status === 'enrolled' ? 'bg-green-100 text-green-700' : ''}>
                                  {enrollment.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-800 rounded-full" 
                                         style={{ width: `${enrollment.progressPercentage || 0}%` }} />
                                  </div>
                                  <span className="text-gray-600 text-sm">{enrollment.progressPercentage || 0}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>
            )}

            <TabsContent value="assignments">
              <Card className="bg-white border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Course Assignments
                  </h3>
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <Button
                      onClick={() => navigate(`/assignments?courseId=${id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Manage Assignments
                    </Button>
                  )}
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments posted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => {
                      const isOverdue = new Date(assignment.dueDate) < new Date();
                      const getTypeColor = (type) => {
                        switch (type) {
                          case 'assignment': return 'bg-blue-100 text-blue-700';
                          case 'midterm': return 'bg-orange-100 text-orange-700';
                          case 'final': return 'bg-red-100 text-red-700';
                          default: return 'bg-gray-100 text-gray-700';
                        }
                      };
                      return (
                        <Card key={assignment._id} className="bg-white border border-gray-200 p-4 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getTypeColor(assignment.type)}>
                                  {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
                                </Badge>
                                <h4 className="text-lg font-bold text-gray-800">{assignment.title}</h4>
                                {isOverdue && (
                                  <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">{assignment.description}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  <span>Max Score: {assignment.maxScore}</span>
                                </div>
                              </div>
                              {assignment.attachments && assignment.attachments.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {assignment.attachments.map((file, idx) => (
                                      <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 underline"
                                      >
                                        <Download className="h-3 w-3" />
                                        {file.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Take Exam Button for Students */}
                              {user?.role === 'user' && 
                               assignment.questions && 
                               assignment.questions.length > 0 && 
                               assignment.isPublished && (
                                <div className="mt-4">
                                  <Link to={`/exam/${assignment._id}/take`}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Take Exam ({assignment.questions.length} Questions)
                                    </Button>
                                  </Link>
                                </div>
                              )}
                              {/* View Results Button for Teachers */}
                              {(user?.role === 'teacher' || user?.role === 'admin') && 
                               assignment.questions && 
                               assignment.questions.length > 0 && (
                                <div className="mt-4">
                                  <Link to={`/exam/${assignment._id}/results`}>
                                    <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                                      <Award className="h-4 w-4 mr-2" />
                                      View Results
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            {canManage && (
              <TabsContent value="grades">
                <Card className="bg-white border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Award className="h-5 w-5 text-gray-600" />
                      Grade Management
                    </h3>
                  </div>

                  {grades.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <Card className="bg-gray-50 border border-gray-100 p-4 text-center">
                        <p className="text-gray-500 text-sm">Average</p>
                        <p className="text-2xl font-bold text-gray-800">{grades.stats.average}%</p>
                      </Card>
                      {Object.entries(grades.stats.distribution).map(([grade, count]) => (
                        <Card key={grade} className="bg-gray-50 border border-gray-100 p-4 text-center">
                          <p className="text-gray-500 text-sm">Grade {grade}</p>
                          <p className="text-2xl font-bold text-gray-800">{count}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                  {grades.grades.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No grades assigned yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                            <th className="text-center py-3 px-4 text-gray-500 font-medium">Total %</th>
                            <th className="text-center py-3 px-4 text-gray-500 font-medium">Grade</th>
                            <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.grades.map((grade) => (
                            <tr key={grade._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <span className="text-gray-800">{grade.student?.username}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="text-gray-800 font-medium">{grade.totalPercentage}%</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Badge className={
                                  grade.letterGrade.startsWith('A') ? 'bg-green-100 text-green-700' :
                                  grade.letterGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                  grade.letterGrade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }>
                                  {grade.letterGrade}
                                </Badge>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Badge variant={grade.status === 'finalized' ? 'default' : 'outline'}
                                       className={grade.status === 'finalized' ? 'bg-green-100 text-green-700' : ''}>
                                  {grade.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
    </Layout>
  );
};

export default CourseDetail;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseAPI, enrollmentAPI, semesterAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  Search,
  Users,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Courses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [activeTab, setActiveTab] = useState(user?.role === 'user' ? 'available' : 'my-courses');

  useEffect(() => {
    fetchData();
  }, [selectedSemester, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [semestersRes] = await Promise.all([semesterAPI.getAll()]);
      
      if (semestersRes.success) {
        setSemesters(semestersRes.data);
        if (selectedSemester === 'all') {
          const currentSem = semestersRes.data.find(s => s.isCurrent);
          if (currentSem) {
            setSelectedSemester(currentSem._id);
          }
        }
      }
      
      const semesterFilter = selectedSemester !== 'all' ? selectedSemester : undefined;

      if (user?.role === 'user') {
        if (activeTab === 'available') {
          const availableRes = await courseAPI.getAvailable(semesterFilter ? { semester: semesterFilter } : {});
          if (availableRes.success) setCourses(availableRes.data);
        } else {
          const enrollmentsRes = await enrollmentAPI.getMyEnrollments(semesterFilter ? { semester: semesterFilter } : {});
          if (enrollmentsRes.success) {
            setCourses(enrollmentsRes.data.map(e => ({ ...e.course, enrollment: e })));
          }
        }
      } else {
        const coursesRes = activeTab === 'my-courses' 
          ? await courseAPI.getMyCourses(semesterFilter ? { semester: semesterFilter } : {})
          : await courseAPI.getAll(semesterFilter ? { semester: semesterFilter } : {});
        if (coursesRes.success) {
          setCourses(coursesRes.data?.courses || coursesRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(courseId);
      const res = await enrollmentAPI.enroll(courseId);
      if (res.success) fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();
    return course.subject?.name?.toLowerCase().includes(searchLower) || 
           course.subject?.code?.toLowerCase().includes(searchLower);
  });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton to="/dashboard" />
        </div>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            Courses
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'user' ? 'Browse and enroll in courses for your semester' : 'Manage your courses'}
          </p>
        </div>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              {user?.role === 'user' ? (
                <>
                  <Button
                    onClick={() => setActiveTab('available')}
                    variant={activeTab === 'available' ? 'default' : 'outline'}
                    className={activeTab === 'available' ? 'bg-gray-800 text-white' : 'border-gray-300'}
                  >
                    Available Courses
                  </Button>
                  <Button
                    onClick={() => setActiveTab('enrolled')}
                    variant={activeTab === 'enrolled' ? 'default' : 'outline'}
                    className={activeTab === 'enrolled' ? 'bg-gray-800 text-white' : 'border-gray-300'}
                  >
                    My Enrollments
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setActiveTab('my-courses')}
                    variant={activeTab === 'my-courses' ? 'default' : 'outline'}
                    className={activeTab === 'my-courses' ? 'bg-gray-800 text-white' : 'border-gray-300'}
                  >
                    My Courses
                  </Button>
                  <Button
                    onClick={() => setActiveTab('all')}
                    variant={activeTab === 'all' ? 'default' : 'outline'}
                    className={activeTab === 'all' ? 'bg-gray-800 text-white' : 'border-gray-300'}
                  >
                    All Courses
                  </Button>
                </>
              )}
            </div>

            <div className="flex-1 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300"
                />
              </div>
              
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="Select Semester" />
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
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gray-800"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card className="bg-white border border-gray-200 p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No courses found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'No courses available for this semester'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2 text-gray-600 border-gray-300">
                            {course.subject?.code}
                          </Badge>
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900">
                            {course.subject?.name}
                          </h3>
                        </div>
                        <Badge variant={course.status === 'ongoing' ? 'default' : 'outline'} 
                               className={course.status === 'ongoing' ? 'bg-green-100 text-green-700' : ''}>
                          {course.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarImage src={course.teacher?.profileimage} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {getInitials(course.teacher?.username || 'Unassigned')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-800 text-sm">{course.teacher?.username || 'Unassigned'}</p>
                          <p className="text-gray-400 text-xs">Instructor</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{course.schedule?.days?.join(', ') || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{course.schedule?.startTime} - {course.schedule?.endTime || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{course.currentEnrollment || course.enrollmentCount || 0} / {course.maxCapacity}</span>
                        </div>
                      </div>

                      {user?.role === 'user' && activeTab === 'available' && (
                        <div className="pt-2 border-t border-gray-100">
                          {course.isEnrolled ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Already Enrolled</span>
                            </div>
                          ) : !course.hasCapacity ? (
                            <div className="flex items-center gap-2 text-red-500">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Course Full</span>
                            </div>
                          ) : !course.prerequisitesMet ? (
                            <div className="flex items-center gap-2 text-amber-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Prerequisites Required</span>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {course.enrollment && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-gray-800 font-medium">{course.enrollment.progressPercentage || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-800 rounded-full transition-all"
                              style={{ width: `${course.enrollment.progressPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-gray-100 flex gap-2">
                      <Link to={`/courses/${course._id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-gray-300">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      
                      {user?.role === 'user' && activeTab === 'available' && course.canEnroll && (
                        <Button
                          onClick={() => handleEnroll(course._id)}
                          disabled={enrolling === course._id}
                          className="bg-gray-800 text-white hover:bg-gray-700"
                        >
                          {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
    </Layout>
  );
};

export default Courses;

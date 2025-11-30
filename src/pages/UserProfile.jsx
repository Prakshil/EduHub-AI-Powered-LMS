import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { userAPI, enrollmentAPI, gradeAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { normalizeSkills } from '@/utils/skillUtils';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  User,
  Award,
} from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getUser(id);
      if (response.success) {
        setProfile(response.data);

        if (response.data.role === 'user') {
          if (user?._id === response.data._id) {
            const enrollRes = await enrollmentAPI.getMyEnrollments();
            if (enrollRes.success) {
              setEnrollments(enrollRes.data);
            }

            // Fetch student grades
            try {
              const gradesRes = await gradeAPI.getStudentGrades();
              if (gradesRes.success) {
                setGrades(gradesRes.data || []);
              }
            } catch (err) {
              console.log('No grades available yet');
            }
          } else if (user?.role === 'teacher' || user?.role === 'admin') {
            const enrollRes = await enrollmentAPI.getStudentEnrollments(id);
            if (enrollRes.success) {
              setEnrollments(enrollRes.data);
            }
          } else {
            setEnrollments([]);
          }
        } else {
          setEnrollments([]);
        }
      } else {
        setError(response.message || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const skillList = useMemo(() => normalizeSkills(profile?.skills), [profile]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-8 text-center border border-red-200 bg-red-50 text-red-700">
            <p>{error || 'Profile not found.'}</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const isStudent = profile.role === 'user';
  const isTeacher = profile.role === 'teacher';
  const cgpaValue = profile.studentProfile?.cgpa;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-2 border-indigo-200">
              <AvatarImage src={profile.profileimage || profile.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl">
                {getInitials(profile.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-800">{profile.username}</h1>
                <Badge className={getRoleBadge(profile.role)}>{profile.role}</Badge>
              </div>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </span>
                )}
                {profile.address && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.address}
                  </span>
                )}
              </div>
              {skillList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillList.map((skill, idx) => (
                    <Badge key={idx} className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-gray-200 bg-white/80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">General Information</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{profile.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{profile.gender || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{profile.address || 'Not provided'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 bg-white/80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {isTeacher ? 'Teaching Details' : 'Academic Details'}
            </h2>
            {isTeacher ? (
              <div className="space-y-3 text-sm text-gray-600">
                <p><span className="font-medium">Department:</span> {profile.teacherProfile?.department || 'N/A'}</p>
                <p><span className="font-medium">Designation:</span> {profile.teacherProfile?.designation || 'N/A'}</p>
                <p><span className="font-medium">Specialization:</span> {(profile.teacherProfile?.specialization || []).join(', ') || 'N/A'}</p>
                <p><span className="font-medium">Office Hours:</span> {profile.teacherProfile?.officeHours || 'N/A'}</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-600">
                <p><span className="font-medium">Program:</span> {profile.studentProfile?.program || 'N/A'}</p>
                <p><span className="font-medium">Semester:</span> {profile.studentProfile?.currentSemester || 'N/A'}</p>
                <p><span className="font-medium">CGPA:</span> {typeof cgpaValue === 'number' ? cgpaValue.toFixed(2) : cgpaValue || 'N/A'}</p>
                <p><span className="font-medium">Total Credits:</span> {profile.studentProfile?.totalCredits || 'N/A'}</p>
              </div>
            )}
          </Card>
        </div>

        {isStudent && (
          <Card className="p-6 border border-gray-200 bg-white/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Course Enrollments</h2>
              <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                {enrollments.length} courses
              </Badge>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-sm">No enrollments found for this student.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <motion.div
                    key={enrollment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="text-gray-800 font-semibold">
                        {enrollment.course?.subject?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {enrollment.course?.subject?.code} • {enrollment.semester?.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {enrollment.course?.teacher?.username}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {enrollment.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        )}

        {isStudent && grades.length > 0 && (
          <Card className="p-6 border border-gray-200 bg-white/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Academic Grades
              </h2>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {grades.length} graded courses
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Course</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-medium">Grade</th>
                    <th className="text-center py-3 px-4 text-gray-600 font-medium">Percentage</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-medium">Instructor</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => {
                    const letterGradeColor =
                      grade.letterGrade?.startsWith('A') ? 'bg-green-100 text-green-700' :
                      grade.letterGrade?.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                      grade.letterGrade?.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700';
                    
                    return (
                      <motion.tr
                        key={grade._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-800 font-medium">{grade.course?.subject?.name}</p>
                            <p className="text-xs text-gray-500">{grade.course?.subject?.code}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={letterGradeColor}>
                            {grade.letterGrade}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-semibold text-gray-800">{grade.totalPercentage}%</span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {grade.course?.teacher?.username || 'N/A'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {isStudent && grades.length === 0 && enrollments.length > 0 && (
          <Card className="p-6 border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800">No grades available yet. Grades will appear here once instructors submit them.</p>
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;


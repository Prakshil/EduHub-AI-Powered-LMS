import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { authAPI, semesterAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoaderTwo } from '@/components/ui/loader';
import { GraduationCap, User, Mail, Lock, Phone, Calendar, MapPin, ArrowLeft, BookOpen } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    age: '',
    gender: '',
    address: '',
    skills: '',
    role: 'user', // 'user' role represents students in the backend
    semester: '',
    profileimage: null,
  });
  const [semesters, setSemesters] = useState([]);
  // Fallback display-only semester options when API returns none
  const fallbackSemesters = [
    { _id: 'fallback-1', name: 'Semester 1' },
    { _id: 'fallback-2', name: 'Semester 2' },
    { _id: 'fallback-3', name: 'Semester 3' },
    { _id: 'fallback-4', name: 'Semester 4' },
    { _id: 'fallback-5', name: 'Semester 5' },
    { _id: 'fallback-6', name: 'Semester 6' },
    { _id: 'fallback-7', name: 'Semester 7' },
    { _id: 'fallback-8', name: 'Semester 8' },
  ];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await semesterAPI.getAll();
      if (res.success) setSemesters(res.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
    setError('');
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.dob || !formData.gender || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.role === 'user' && !formData.semester) {
      setError('Please select your current semester');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        phone: formData.phone ? parseInt(formData.phone) : undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
      };

      const response = await authAPI.signup(submitData);
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        toast.success('Signup successful!');
        // Redirect based on role
        const role = response.data.user.role;
        if (role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.message || 'Signup failed');
        toast.error(response.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Signup failed. Please try again.');
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden py-12">
      {/* Grid Background */}
      <div 
        className="fixed inset-0 z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Gradient blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl mx-4 lg:mx-auto"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-3xl">E</span>
              </div>
              <div className="text-center">
                <h2 className="font-bold text-lg text-gray-900">EduHub</h2>
                <p className="text-xs text-gray-600">AI-Powered LMS</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-500">Join EduHub — AI-Powered LMS</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700 text-base font-medium">I am a *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectChange('role', 'user')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'user'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <GraduationCap className="h-8 w-8" />
                  <span className="font-medium">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectChange('role', 'teacher')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.role === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <BookOpen className="h-8 w-8" />
                  <span className="font-medium">Teacher</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-gray-700">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-gray-700">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)} required>
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-800">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Semester Selection for Students */}
              {formData.role === 'user' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="semester" className="text-gray-700">Current Semester *</Label>
                  <div>
                    <select
                      id="semester"
                      name="semester"
                      value={formData.semester}
                      onChange={(e) => handleSelectChange('semester', e.target.value)}
                      required
                      className="w-full rounded-md bg-gray-50 border border-gray-200 text-gray-800 px-3 py-2"
                    >
                      <option value="">Select your current semester</option>
                      {(semesters && semesters.length ? semesters : fallbackSemesters).map(sem => (
                        <option key={sem._id} value={sem._id}>
                          {sem.name}{sem.isCurrent ? ' (Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-gray-700">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profileimage" className="text-gray-700">Profile Image</Label>
                <Input
                  id="profileimage"
                  name="profileimage"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-200 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-gray-700">Skills (comma-separated)</Label>
              <Input
                id="skills"
                name="skills"
                type="text"
                placeholder="e.g., JavaScript, Python, React"
                value={formData.skills}
                onChange={handleChange}
                className="bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
              />
              {formData.skills && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.split(',').map((skill, index) => {
                    const trimmedSkill = skill.trim();
                    return trimmedSkill ? (
                      <Badge
                        key={index}
                        className="bg-indigo-100 text-indigo-700 border-indigo-200"
                      >
                        {trimmedSkill}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white font-semibold py-6 rounded-xl shadow-lg shadow-indigo-500/25"
            >
              {loading ? <LoaderTwo /> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;

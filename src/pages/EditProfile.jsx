import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoaderTwo } from '@/components/ui/loader';
import { ArrowLeft, User } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { normalizeSkills } from '@/utils/skillUtils';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    age: user?.age || '',
    gender: user?.gender || '',
    address: user?.address || '',
    skills: normalizeSkills(user?.skills).join(', '),
    profileimage: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.profileimage || '');
  const navigate = useNavigate();
  const skillBadges = useMemo(() => normalizeSkills(formData.skills), [formData.skills]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
      setPreviewImage(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, gender: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 120)) {
      setError('Age must be between 18 and 120');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        phone: formData.phone ? parseInt(formData.phone) : undefined,
        skills: skillBadges,
      };

      const response = await userAPI.updateUser(user._id, submitData);

      if (response.success && response.data) {
        updateUser(response.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(response.message || 'Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <User className="h-8 w-8 text-indigo-600" />
              Edit Profile
            </h1>
            <p className="text-gray-500 mt-1">Update your personal information</p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-8">

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-100 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border border-green-200 rounded-lg p-3 text-green-700 text-sm"
                >
                  {success}
                </motion.div>
              )}

              {/* Profile Image Preview */}
              {previewImage && (
                <div className="flex justify-center mb-6">
                  <img
                    src={previewImage}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-gray-700">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-700">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                  <Select value={formData.gender} onValueChange={handleSelectChange}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profileimage" className="text-gray-700">Profile Image</Label>
                  <Input
                    id="profileimage"
                    name="profileimage"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="bg-white border-gray-300 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-700">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-white border-gray-300 text-gray-800"
                />
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
                  className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                />
                {skillBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillBadges.map((skill, index) => (
                      <Badge
                        key={`${skill}-${index}`}
                        className="bg-indigo-100 text-indigo-700 border-indigo-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-white font-semibold py-6"
                >
                  {loading ? <LoaderTwo /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EditProfile;

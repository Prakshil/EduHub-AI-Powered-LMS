import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { announcementAPI, courseAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/BackButton';
import {
  Megaphone,
  ArrowLeft,
  Send,
  Pin,
  Mail,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateAnnouncement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'normal',
    audience: 'all',
    course: '',
    isPinned: false,
    sendEmail: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, coursesRes] = await Promise.all([
        announcementAPI.getCategories(),
        courseAPI.getMyCourses().catch(() => ({ success: false })),
      ]);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (coursesRes.success) setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }
    
    try {
      setLoading(true);
      const payload = { ...formData };
      if (!payload.course) delete payload.course;
      
      const res = await announcementAPI.create(payload);
      if (res.success) {
        toast.success('Announcement sent!');
        navigate('/announcements');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const courseSelectValue = formData.course || 'none';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-indigo-600" />
            Create Announcement
          </h1>
          <p className="text-gray-500 mt-1">Share important updates with your audience</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                  className="border-gray-300"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-700">Content *</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement content..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  required
                />
              </div>

              {/* Row: Category, Priority, Audience */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Audience</Label>
                  <Select value={formData.audience} onValueChange={(value) => setFormData(prev => ({ ...prev, audience: value }))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      {user?.role === 'admin' && <SelectItem value="admins">Admins Only</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Course Selection */}
              {courses.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Course (Optional)</Label>
                  <Select
                    value={courseSelectValue}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, course: value === 'none' ? '' : value }))
                    }
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select a course (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (General Announcement)</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.subject?.code} - {course.subject?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Options */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-gray-800 focus:ring-gray-200"
                  />
                  <span className="text-gray-700 flex items-center gap-2">
                    <Pin className="h-4 w-4 text-amber-500" />
                    Pin this announcement
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-gray-800 focus:ring-gray-200"
                  />
                  <span className="text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Send email notification
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <BackButton variant="outline" className="border-gray-300">
                  Cancel
                </BackButton>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publish Announcement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
    </Layout>
  );
};

export default CreateAnnouncement;

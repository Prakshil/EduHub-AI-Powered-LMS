import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { announcementAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Megaphone,
  Search,
  ArrowLeft,
  Pin,
  Calendar,
  Eye,
  Plus,
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Announcements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory, showPinnedOnly, pagination.page]);

  const fetchCategories = async () => {
    try {
      const res = await announcementAPI.getCategories();
      if (res.success) setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Track last announcement id to show toast only for new ones
  const lastAnnouncementId = useRef(null);
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (showPinnedOnly) params.isPinned = 'true';
      
      const res = await announcementAPI.getAll(params);
      if (res.success) {
        setAnnouncements(res.data.announcements);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
        // Show toast if a new announcement is received
        if (res.data.announcements && res.data.announcements.length > 0) {
          const latestId = res.data.announcements[0]._id;
          if (lastAnnouncementId.current && lastAnnouncementId.current !== latestId) {
            toast.success('New announcement received!');
          }
          lastAnnouncementId.current = latestId;
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    if (!searchTerm) return true;
    return ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           ann.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryStyle = (category) => {
    const styles = {
      Exam: 'bg-red-50 text-red-700 border-red-200',
      Holiday: 'bg-green-50 text-green-700 border-green-200',
      Event: 'bg-blue-50 text-blue-700 border-blue-200',
      Academic: 'bg-purple-50 text-purple-700 border-purple-200',
      Emergency: 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton to="/dashboard" />
        </div>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-indigo-600" />
              Announcements
            </h1>
            <p className="text-gray-500 mt-1">Stay updated with the latest news</p>
          </div>
          {canCreate && (
            <Link to="/announcements/create">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </Link>
          )}
        </div>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-gray-300">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              variant={showPinnedOnly ? 'default' : 'outline'}
              className={showPinnedOnly ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'border-gray-300'}
            >
              <Pin className="h-4 w-4 mr-2" />
              Pinned Only
            </Button>
          </div>

          {/* Announcements List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gray-800"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <Card className="bg-white border border-gray-200 p-12 text-center">
              <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No announcements</h3>
              <p className="text-gray-500">No announcements available at the moment</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement, index) => {
                // Determine if the user can delete: admin, author, or has read
                const isAdmin = user?.role === 'admin';
                const isAuthor = announcement.author?._id === user?._id;
                const hasRead = Array.isArray(announcement.readBy) && announcement.readBy.some(r => r.user === user?._id);

                const canDelete = isAdmin || isAuthor || hasRead;

                const handleDelete = async (e) => {
                  e.preventDefault();
                  if (!window.confirm('Are you sure you want to delete this announcement?')) return;
                  try {
                    await announcementAPI.delete(announcement._id);
                    toast.success('Announcement deleted');
                    fetchAnnouncements();
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Failed to delete announcement');
                  }
                };

                return (
                  <motion.div
                    key={announcement._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="relative group">
                      <Link to={`/announcements/${announcement._id}`}>
                        <Card className={`bg-white border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer ${
                          !announcement.isRead ? 'border-l-4 border-l-gray-800' : ''
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                              <Megaphone className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {announcement.isPinned && (
                                  <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                                )}
                                {!announcement.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-gray-800"></span>
                                )}
                                <h3 className="text-lg font-bold text-gray-800">{announcement.title}</h3>
                              </div>
                              <p className="text-gray-500 mt-2 line-clamp-2">{announcement.content}</p>
                              <div className="flex items-center gap-4 mt-4 flex-wrap">
                                <Badge variant="outline" className={getCategoryStyle(announcement.category)}>
                                  {announcement.category}
                                </Badge>
                                {announcement.priority !== 'normal' && (
                                  <Badge variant="outline" className={
                                    announcement.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                                    announcement.priority === 'high' ? 'bg-orange-50 text-orange-700' : ''
                                  }>
                                    {announcement.priority}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={announcement.author?.profileimage} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                      {getInitials(announcement.author?.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{announcement.author?.username}</span>
                                </div>
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(announcement.createdAt)}
                                </span>
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {announcement.readCount} views
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                      {canDelete && (
                        <button
                          onClick={handleDelete}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-2"
                          title="Delete announcement"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                variant="outline"
                className="border-gray-300"
              >
                Previous
              </Button>
              <span className="text-gray-600 px-4 py-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                variant="outline"
                className="border-gray-300"
              >
                Next
              </Button>
            </div>
          )}
        </div>
    </Layout>
  );
};

export default Announcements;

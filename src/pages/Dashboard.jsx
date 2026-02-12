import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { normalizeSkills } from '@/utils/skillUtils';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  BookOpen,
  Award,
  Calendar as CalendarIcon,
  LogOut,
  Settings,
  Bell,
  TrendingUp,
  Clock,
  Plus,
  X,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [date, setDate] = useState(new Date());

  // Load events from localStorage or use default events
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      return JSON.parse(savedEvents);
    }
    return [
      {
        id: 1,
        title: 'Parent-Teacher Meeting',
        date: '2025-11-25',
        time: '10:00 AM',
        type: 'meeting'
      },
      {
        id: 2,
        title: 'Annual Sports Day',
        date: '2025-12-02',
        time: 'All Day',
        type: 'event'
      }
    ];
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'event'
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    upcomingEvents: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Simulated stats - replace with actual API calls
    setStats({
      totalStudents: 245,
      activeClasses: 12,
      upcomingEvents: events.length,
    });
  }, [events]);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      return;
    }

    const event = {
      id: Date.now(),
      ...newEvent
    };

    setEvents([...events, event]);
    setNewEvent({ title: '', date: '', time: '', type: 'event' });
    setShowEventForm(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-indigo-200">
                  <AvatarImage src={user?.profileimage} alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Welcome back, {user?.username}!
                  </h2>
                  <p className="text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-gray-800 font-semibold">
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 text-sm">+12% from last month</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Active Classes</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeClasses}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-purple-500 text-sm">4 ongoing now</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Upcoming Events</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.upcomingEvents}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CalendarIcon className="h-4 w-4 text-pink-500" />
                    <span className="text-pink-500 text-sm">Next in 2 days</span>
                  </div>
                </div>
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Award className="h-8 w-8 text-pink-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Profile Information</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Username</p>
                    <p className="text-gray-800 font-medium">{user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Email</p>
                    <p className="text-gray-800 font-medium">{user?.email || 'N/A'}</p>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Phone</p>
                    <p className="text-gray-800 font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Gender</p>
                    <p className="text-gray-800 font-medium capitalize">{user?.gender || 'Not specified'}</p>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Date of Birth</p>
                    <p className="text-gray-800 font-medium">
                      {user?.dob ? formatDate(user.dob) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Age</p>
                    <p className="text-gray-800 font-medium">{user?.age || 'N/A'}</p>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div>
                  <p className="text-gray-500 text-sm mb-1">Address</p>
                  <p className="text-gray-800 font-medium">{user?.address || 'Not provided'}</p>
                </div>

                {/* Student Profile Info */}
                {user?.role === 'user' && user?.studentProfile && (
                  <>
                    <Separator className="bg-gray-200" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Current Semester</p>
                        <p className="text-gray-800 font-medium">Semester {user.studentProfile.currentSemester || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm mb-1">CGPA</p>
                        <p className="text-gray-800 font-medium">{user.studentProfile.cgpa?.toFixed(2) || '0.00'}</p>
                      </div>
                      {user.studentProfile.program && (
                        <div className="col-span-2">
                          <p className="text-gray-500 text-sm mb-1">Program</p>
                          <p className="text-gray-800 font-medium">{user.studentProfile.program}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator className="bg-gray-200" />

                <div>
                  <p className="text-gray-500 text-sm mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const skillsArray = normalizeSkills(user?.skills);
                      return skillsArray.length > 0 ? (
                        skillsArray.map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-indigo-100 text-indigo-700 border border-indigo-200"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-400">No skills added</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/profile/edit')}
                className="w-full mt-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-white"
              >
                Edit Profile
              </Button>
            </Card>
          </motion.div>

          {/* Calendar & Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Calendar</h3>
                <Button
                  onClick={() => setShowEventForm(!showEventForm)}
                  size="sm"
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
              </div>

              {showEventForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-700 text-sm">Event Title</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Enter event name"
                        className="bg-white border-gray-300 text-gray-800 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 text-sm">Date</Label>
                        <Input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          className="bg-white border-gray-300 text-gray-800 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 text-sm">Time</Label>
                        <Input
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          className="bg-white border-gray-300 text-gray-800 mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddEvent}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      >
                        Add
                      </Button>
                      <Button
                        onClick={() => setShowEventForm(false)}
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="calendar-container">
                <Calendar
                  onChange={setDate}
                  value={date}
                  className="custom-calendar bg-transparent border-none"
                />
              </div>

              <Separator className="bg-gray-200 my-6" />

              <div>
                <h4 className="text-gray-800 font-semibold mb-3">Upcoming Events</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 group"
                      >
                        <div className="p-2 bg-indigo-100 rounded">
                          {event.type === 'meeting' ? (
                            <CalendarIcon className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Award className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium text-sm">{event.title}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} • {event.time}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">No events scheduled</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

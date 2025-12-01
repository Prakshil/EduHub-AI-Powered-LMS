import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { assignmentAPI, courseAPI } from '@/services/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  Download,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'react-hot-toast';

const Assignments = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(courseId || 'all');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: courseId || '',
    type: 'assignment',
    dueDate: '',
    maxScore: 100,
    instructions: '',
    isPublished: false,
  });
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showExamGenerator, setShowExamGenerator] = useState(false);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [examFormData, setExamFormData] = useState({
    courseId: courseId || '',
    type: 'midterm',
    topic: '',
    numQuestions: 10,
    difficulty: 'medium',
    dueDate: '',
    maxScore: 100,
    instructions: '',
    isPublished: false,
  });

  useEffect(() => {
    fetchData();
  }, [selectedCourse, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher's courses
      if (user?.role === 'teacher' || user?.role === 'admin') {
        const coursesRes = await courseAPI.getMyCourses();
        if (coursesRes.success) {
          setCourses(coursesRes.data || []);
        }
      }

      // Fetch assignments
      const params = {};
      if (selectedCourse && selectedCourse !== 'all') params.courseId = selectedCourse;
      if (filterType !== 'all') params.type = filterType;

      const res = await assignmentAPI.getMyAssignments(params);
      if (res.success) {
        setAssignments(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('courseId', formData.courseId);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('maxScore', formData.maxScore);
      formDataToSend.append('instructions', formData.instructions || '');
      formDataToSend.append('isPublished', formData.isPublished);

      attachments.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      let res;
      if (editingAssignment) {
        res = await assignmentAPI.update(editingAssignment._id, formDataToSend);
      } else {
        res = await assignmentAPI.create(formDataToSend);
      }

      if (res.success) {
        toast.success(editingAssignment ? 'Assignment updated successfully' : 'Assignment created successfully');
        resetForm();
        fetchData();
      } else {
        toast.error(res.message || 'Failed to save assignment');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: courseId || '',
      type: 'assignment',
      dueDate: '',
      maxScore: 100,
      instructions: '',
      isPublished: false,
    });
    setAttachments([]);
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.course._id,
      type: assignment.type,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      maxScore: assignment.maxScore,
      instructions: assignment.instructions || '',
      isPublished: assignment.isPublished,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await assignmentAPI.delete(id);
      if (res.success) {
        toast.success('Assignment deleted successfully');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleTogglePublish = async (assignment) => {
    try {
      const res = await assignmentAPI.togglePublish(assignment._id);
      if (res.success) {
        toast.success(`Assignment ${assignment.isPublished ? 'unpublished' : 'published'} successfully`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const handleGenerateExam = async (e) => {
    e.preventDefault();
    try {
      setGeneratingExam(true);
      // Add saveAsAssignment flag if checkbox is checked
      const examData = {
        ...examFormData,
        saveAsAssignment: examFormData.saveAsAssignment !== false, // Default to true
      };
      const res = await assignmentAPI.generateExam(examData);
      if (res.success) {
        toast.success('Exam generated successfully!');
        if (res.data?.assignment) {
          toast.success('Exam saved as assignment. Students can now take it!');
        }
        setShowExamGenerator(false);
        fetchData();
      } else {
        const errorMsg = res.message || res.data?.message || 'Failed to generate exam';
        toast.error(errorMsg);
        console.error('Exam generation failed:', res);
      }
    } catch (error) {
      console.error('Error generating exam:', error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.errors?.[0] || 
                      error.message || 
                      'Failed to generate exam. Please check the console for details.';
      toast.error(errorMsg);
    } finally {
      setGeneratingExam(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'assignment': return 'bg-blue-100 text-blue-700';
      case 'midterm': return 'bg-orange-100 text-orange-700';
      case 'final': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton to="/dashboard" />
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-600" />
              Assignments
            </h1>
            <p className="text-gray-500 mt-1">Manage course assignments and exams</p>
          </div>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                variant="outline"
                className="border-gray-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
              <Button
                onClick={() => {
                  setExamFormData({
                    courseId: courseId || '',
                    type: 'midterm',
                    topic: '',
                    numQuestions: 10,
                    difficulty: 'medium',
                    dueDate: '',
                    maxScore: 100,
                    instructions: '',
                    saveAsAssignment: true,
                    isPublished: true,
                  });
                  setShowExamGenerator(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate AI Exam
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {(user?.role === 'teacher' || user?.role === 'admin') && courses.length > 0 && (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64 border-gray-300">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.subject?.name} - {course.subject?.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 border-gray-300">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
              <SelectItem value="midterm">Midterm Exams</SelectItem>
              <SelectItem value="final">Final Exams</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create/Edit Form */}
        {showForm && (user?.role === 'teacher' || user?.role === 'admin') && (
          <Card className="bg-white border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
              </h2>
              <Button variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseId">Course *</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.subject?.name} - {course.subject?.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="midterm">Midterm Exam</SelectItem>
                      <SelectItem value="final">Final Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title"
                  className="border-gray-300"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="border-gray-300"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxScore">Maximum Score *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                    className="border-gray-300"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Additional instructions for students"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              <div>
                <Label htmlFor="attachments">Attachments</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="border-gray-300"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publish immediately (students will be notified)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {submitting ? 'Saving...' : editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* AI Exam Generator */}
        {showExamGenerator && (user?.role === 'teacher' || user?.role === 'admin') && (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Generate AI-Powered Exam
                </h2>
                <p className="text-sm text-gray-600 mt-1">Use AI to automatically generate MCQ questions</p>
              </div>
              <Button variant="ghost" onClick={() => setShowExamGenerator(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleGenerateExam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="examCourseId">Course *</Label>
                  <Select
                    value={examFormData.courseId}
                    onValueChange={(value) => setExamFormData({ ...examFormData, courseId: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.subject?.name} - {course.subject?.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="examType">Exam Type *</Label>
                  <Select
                    value={examFormData.type}
                    onValueChange={(value) => setExamFormData({ ...examFormData, type: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midterm">Midterm Exam</SelectItem>
                      <SelectItem value="final">Final Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="topic">Topic/Focus Area</Label>
                <Input
                  id="topic"
                  value={examFormData.topic}
                  onChange={(e) => setExamFormData({ ...examFormData, topic: e.target.value })}
                  placeholder="e.g., Database Design, SQL Queries, Normalization (leave empty for general course content)"
                  className="border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Specify topics to focus on</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numQuestions">Number of Questions *</Label>
                  <Input
                    id="numQuestions"
                    type="number"
                    value={examFormData.numQuestions}
                    onChange={(e) => setExamFormData({ ...examFormData, numQuestions: parseInt(e.target.value) || 10 })}
                    className="border-gray-300"
                    min="5"
                    max="50"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select
                    value={examFormData.difficulty}
                    onValueChange={(value) => setExamFormData({ ...examFormData, difficulty: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="examMaxScore">Maximum Score *</Label>
                  <Input
                    id="examMaxScore"
                    type="number"
                    value={examFormData.maxScore}
                    onChange={(e) => setExamFormData({ ...examFormData, maxScore: parseInt(e.target.value) || 100 })}
                    className="border-gray-300"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="examDueDate">Due Date *</Label>
                <Input
                  id="examDueDate"
                  type="datetime-local"
                  value={examFormData.dueDate}
                  onChange={(e) => setExamFormData({ ...examFormData, dueDate: e.target.value })}
                  className="border-gray-300"
                  required
                />
              </div>

              <div>
                <Label htmlFor="examInstructions">Instructions (Optional)</Label>
                <textarea
                  id="examInstructions"
                  value={examFormData.instructions}
                  onChange={(e) => setExamFormData({ ...examFormData, instructions: e.target.value })}
                  placeholder="Additional instructions for students"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveAsAssignment"
                  checked={examFormData.saveAsAssignment !== false}
                  onChange={(e) => setExamFormData({ ...examFormData, saveAsAssignment: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="saveAsAssignment" className="cursor-pointer">
                  Save as Assignment (students can take exam)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="examIsPublished"
                  checked={examFormData.isPublished}
                  onChange={(e) => setExamFormData({ ...examFormData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="examIsPublished" className="cursor-pointer">
                  Publish immediately (students will be notified)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={generatingExam}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {generatingExam ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Generating Exam...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Exam
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowExamGenerator(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <Card className="bg-white border border-gray-200 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">No assignments found</h3>
            <p className="text-gray-500">
              {selectedCourse ? 'No assignments for this course yet' : 'Create your first assignment to get started'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(assignment.type)}>
                          {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
                        </Badge>
                        {!assignment.isPublished && (
                          <Badge variant="outline" className="border-gray-300">
                            Draft
                          </Badge>
                        )}
                        <h3 className="text-lg font-bold text-gray-800">{assignment.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {formatDate(assignment.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Max Score: {assignment.maxScore}</span>
                        </div>
                        {assignment.course && (
                          <span>{assignment.course.subject?.name} - {assignment.course.subject?.code}</span>
                        )}
                      </div>
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.attachments.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                <Download className="h-3 w-3" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Exam/Assignment Actions */}
                      <div className="flex gap-2 mt-4">
                        {/* Student: Take Exam button */}
                        {user?.role === 'user' && assignment.questions && assignment.questions.length > 0 && assignment.isPublished && (
                          <Link to={`/exam/${assignment._id}/take`}>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                              Take Exam
                            </Button>
                          </Link>
                        )}
                        {/* Teacher: View Results button */}
                        {(user?.role === 'teacher' || user?.role === 'admin') && assignment.questions && assignment.questions.length > 0 && (
                          <Link to={`/exam/${assignment._id}/results`}>
                            <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                              View Results
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(assignment)}
                          className="border-gray-300"
                        >
                          {assignment.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(assignment)}
                          className="border-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(assignment._id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default Assignments;


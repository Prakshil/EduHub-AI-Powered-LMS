import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { generateExamQuestions } from '../services/examService';
import { courseAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function ExamGenerator() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    numberOfQuestions: 10,
    difficulty: '',
    topic: '',
    instructions: '',
    courseId: '',
    examType: '',
    maxScore: '',
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [questions, setQuestions] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch courses if user is a teacher
  useEffect(() => {
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = user?.role === 'teacher' 
        ? await courseAPI.getMyCourses()
        : await courseAPI.getAll();
      
      if (response.success) {
        setCourses(response.data?.courses || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions('');
    setMetadata(null);

    try {
      const result = await generateExamQuestions(formData);
      setQuestions(result.questions);
      setMetadata(result.metadata);
      toast.success('Exam questions generated successfully!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate exam questions';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(questions);
      setCopied(true);
      toast.success('Questions copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy questions');
    }
  };

  const handleDownload = () => {
    const content = `Generated Exam Questions\n\n${questions}\n\nGenerated on: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-questions-${formData.subject}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Questions downloaded!');
  };

  const selectedCourse = courses.find(c => c._id === formData.courseId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <span className="text-indigo-700 font-medium">AI-Powered Exam Generator</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Generate Exam Questions
          </h1>
          <p className="text-gray-600">
            Create high-quality multiple-choice questions using OpenAI
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 mb-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject and Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject" className="text-gray-700 font-medium">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g., Computer Science, Mathematics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 border-gray-300"
                  required
                />
              </div>

              {courses.length > 0 && (
                <div>
                  <Label htmlFor="courseId" className="text-gray-700 font-medium">
                    Course (Optional)
                  </Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger className="mt-1 border-gray-300">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.subject?.name || 'N/A'} - {course.subject?.code || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCourse && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedCourse.subject?.description || 'No description available'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Number of Questions, Difficulty, Exam Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numberOfQuestions" className="text-gray-700 font-medium">
                  Number of Questions <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numberOfQuestions"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.numberOfQuestions}
                  onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) || 10 })}
                  className="mt-1 border-gray-300"
                  required
                />
              </div>

              <div>
                <Label htmlFor="difficulty" className="text-gray-700 font-medium">
                  Difficulty Level
                </Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="examType" className="text-gray-700 font-medium">
                  Exam Type
                </Label>
                <Select
                  value={formData.examType}
                  onValueChange={(value) => setFormData({ ...formData, examType: value })}
                >
                  <SelectTrigger className="mt-1 border-gray-300">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="midterm">Midterm Exam</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Topic and Max Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topic" className="text-gray-700 font-medium">
                  Topic/Focus Area
                </Label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="e.g., Database Design, SQL Queries"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="mt-1 border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Specify specific topics to focus on
                </p>
              </div>

              <div>
                <Label htmlFor="maxScore" className="text-gray-700 font-medium">
                  Maximum Score
                </Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  placeholder="e.g., 100"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  className="mt-1 border-gray-300"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <Label htmlFor="instructions" className="text-gray-700 font-medium">
                Additional Instructions
              </Label>
              <textarea
                id="instructions"
                placeholder="e.g., Focus on practical applications, include real-world examples, emphasize problem-solving..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || loadingCourses}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Exam Questions
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </Card>
        )}

        {/* Results Display */}
        {questions && (
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Generated Questions
                </h2>
                {metadata && (
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-indigo-100 rounded">
                      {metadata.numberOfQuestions} Questions
                    </span>
                    {metadata.difficulty !== 'not specified' && (
                      <span className="px-2 py-1 bg-purple-100 rounded capitalize">
                        {metadata.difficulty}
                      </span>
                    )}
                    {metadata.examType !== 'not specified' && (
                      <span className="px-2 py-1 bg-pink-100 rounded capitalize">
                        {metadata.examType}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="border-gray-300"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="border-gray-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {questions}
              </pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

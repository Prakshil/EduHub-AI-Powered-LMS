import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getExamResults } from '@/services/examService';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Download,
  Search,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  FileText,
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { toast } from 'react-hot-toast';

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [exam, setExam] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, score, percentage

  useEffect(() => {
    loadResults();
  }, [examId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await getExamResults(examId);
      
      if (response.success) {
        setExam(response.data.exam);
        setResults(response.data.results || []);
        setStatistics(response.data.statistics || {});
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load exam results');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Student Name', 'Email', 'Score', 'Max Score', 'Percentage', 'Time Spent', 'Submitted At'];
    const rows = filteredAndSortedResults.map(result => [
      result.student?.username || 'N/A',
      result.student?.email || 'N/A',
      result.score,
      result.maxScore,
      `${result.percentage}%`,
      formatTime(result.timeSpent || 0),
      new Date(result.submittedAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-results-${exam?.title || 'exam'}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Results exported successfully!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredAndSortedResults = results
    .filter(result => {
      const name = result.student?.username || '';
      const email = result.student?.email || '';
      const search = searchTerm.toLowerCase();
      return name.toLowerCase().includes(search) || email.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'percentage':
          return b.percentage - a.percentage;
        case 'name':
        default:
          const nameA = (a.student?.username || '').toLowerCase();
          const nameB = (b.student?.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton />
            <Button onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Exam Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold">{exam?.title || 'Exam Results'}</h1>
                <p className="text-gray-600">
                  {exam?.type} • Max Score: {exam?.maxScore}
                </p>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold">{statistics.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted</p>
                    <p className="text-3xl font-bold">{statistics.submitted}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold">{statistics.averageScore}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average %</p>
                    <p className="text-3xl font-bold">{statistics.averagePercentage}%</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Additional Stats */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.highestScore} / {exam?.maxScore}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-600 mb-1">Lowest Score</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.lowestScore} / {exam?.maxScore}
                </p>
              </Card>
            </div>
          )}

          {/* Search and Sort */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Sort by Name</option>
                <option value="score">Sort by Score</option>
                <option value="percentage">Sort by Percentage</option>
              </select>
            </div>
          </Card>

          {/* Results Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Student Results ({filteredAndSortedResults.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Student Name</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-center p-3 font-semibold">Score</th>
                    <th className="text-center p-3 font-semibold">Percentage</th>
                    <th className="text-center p-3 font-semibold">Time Spent</th>
                    <th className="text-center p-3 font-semibold">Submitted At</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedResults.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-gray-500">
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedResults.map((result, index) => (
                      <motion.tr
                        key={result._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {result.student?.profileimage ? (
                              <img
                                src={result.student.profileimage}
                                alt={result.student.username}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold">
                                  {result.student?.username?.charAt(0).toUpperCase() || 'S'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{result.student?.username || 'N/A'}</p>
                              {result.student?.studentProfile?.rollNumber && (
                                <p className="text-xs text-gray-500">
                                  {result.student.studentProfile.rollNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{result.student?.email || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">
                            {result.score} / {result.maxScore}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              result.percentage >= 80
                                ? 'default'
                                : result.percentage >= 60
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {result.percentage}%
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-gray-600">
                          {formatTime(result.timeSpent || 0)}
                        </td>
                        <td className="p-3 text-center text-gray-600 text-sm">
                          {new Date(result.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={result.status === 'submitted' ? 'default' : 'outline'}>
                            {result.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ExamResults;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getExam, submitExam, getMyExamResult } from '@/services/examService';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Send,
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import { toast } from 'react-hot-toast';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    loadExam();
    
    // Timer
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await getExam(examId);
      
      if (response.success) {
        const examData = response.data;
        
        if (examData.hasSubmitted && examData.result) {
          // Already submitted, load result
          setHasSubmitted(true);
          loadResult();
          return;
        }
        
        setExam(examData.exam);
        
        // Initialize answers array
        if (examData.existingResult && examData.existingResult.answers) {
          setAnswers(examData.existingResult.answers);
        } else {
          setAnswers(
            examData.exam.questions.map((_, index) => ({
              questionIndex: index,
              selectedAnswer: null,
            }))
          );
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load exam');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const loadResult = async () => {
    try {
      const response = await getMyExamResult(examId);
      if (response.success) {
        setResult(response.data);
      }
    } catch (error) {
      console.error('Failed to load result:', error);
    }
  };

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = {
      questionIndex,
      selectedAnswer,
    };
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitExam(examId, {
        answers,
        timeSpent,
      });

      if (response.success) {
        toast.success('Exam submitted successfully!');
        setHasSubmitted(true);
        setResult(response.data.result);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length;
  const totalQuestions = exam?.questions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (hasSubmitted && result) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Card className="p-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Exam Submitted Successfully!
                </h1>
                <p className="text-gray-600">
                  {exam?.title || 'Exam'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {result.score} / {result.maxScore}
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(result.timeSpent || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </Card>
              </div>

              {result.examDetails && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Question Review</h2>
                  {result.examDetails.questions.map((q, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">Question {idx + 1}</h3>
                        <Badge variant={q.isCorrect ? 'default' : 'destructive'}>
                          {q.isCorrect ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Correct</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Incorrect</>
                          )}
                        </Badge>
                      </div>
                      <p className="mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map(option => (
                          <div
                            key={option}
                            className={`p-2 rounded ${
                              option === q.correctAnswer
                                ? 'bg-green-100 border-2 border-green-500'
                                : option === q.studentAnswer && !q.isCorrect
                                ? 'bg-red-100 border-2 border-red-500'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">{option})</span> {q.options[option]}
                            {option === q.correctAnswer && (
                              <Badge className="ml-2">Correct Answer</Badge>
                            )}
                            {option === q.studentAnswer && !q.isCorrect && (
                              <Badge variant="destructive" className="ml-2">Your Answer</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Points: {q.points} / {q.points}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Exam Not Found</h2>
            <p className="text-gray-600 mb-4">The exam you're looking for doesn't exist or you don't have access to it.</p>
            <BackButton />
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton />
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatTime(timeSpent)}
              </Badge>
            </div>
          </div>

          {/* Exam Info */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
            <p className="text-gray-600 mb-4">{exam.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge>{exam.type}</Badge>
              <Badge variant="outline">Max Score: {exam.maxScore}</Badge>
              <Badge variant="outline">{totalQuestions} Questions</Badge>
            </div>
          </Card>

          {/* Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                {answeredCount} / {totalQuestions} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            {exam.questions.map((question, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Question {index + 1}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({question.points || 1} point{question.points !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {answers[index]?.selectedAnswer && (
                    <Badge variant="outline">Answered</Badge>
                  )}
                </div>
                <p className="mb-4 text-gray-700">{question.question}</p>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map(option => (
                    <label
                      key={option}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        answers[index]?.selectedAnswer === option
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index]?.selectedAnswer === option}
                        onChange={() => handleAnswerChange(index, option)}
                        className="mr-3 h-4 w-4 text-indigo-600"
                      />
                      <span className="font-medium mr-2">{option})</span>
                      <span>{question.options[option]}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <Card className="p-6 sticky bottom-4 bg-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {answeredCount} of {totalQuestions} questions answered
                </p>
                {answeredCount < totalQuestions && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Please answer all questions before submitting
                  </p>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < totalQuestions}
                size="lg"
                className="min-w-[150px]"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Exam
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default TakeExam;


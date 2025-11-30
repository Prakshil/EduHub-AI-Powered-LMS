import api from './api.js';

/**
 * Generate exam questions using Google Gemini
 * @param {Object} params - Exam generation parameters
 * @param {string} params.subject - Subject name (required)
 * @param {number} params.numberOfQuestions - Number of questions (default: 10)
 * @param {string} params.difficulty - Difficulty level (easy/medium/hard)
 * @param {string} params.topic - Topic/focus area
 * @param {string} params.instructions - Additional instructions
 * @param {string} params.courseId - Course ID (optional)
 * @param {string} params.examType - Exam type (midterm/final)
 * @param {number} params.maxScore - Maximum score
 * @param {boolean} params.saveAsAssignment - Save exam as assignment (default: false)
 * @returns {Promise<Object>} Response with questions and metadata
 */
export async function generateExamQuestions(params) {
  try {
    const response = await api.post('/exam/generate', params);
    
    // Handle the new response format
    if (response.data.success) {
      return {
        questions: response.data.data.questions,
        assignment: response.data.data.assignment,
        metadata: response.data.data.metadata
      };
    }
    
    // Fallback for old format
    return {
      questions: response.data.questions || response.data.data?.questions,
      assignment: response.data.assignment || response.data.data?.assignment,
      metadata: response.data.metadata || response.data.data?.metadata
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to generate exam questions';
    throw new Error(errorMessage);
  }
}

/**
 * Get exam for student to take
 * @param {string} examId - Exam/Assignment ID
 * @returns {Promise<Object>} Exam data with questions
 */
export async function getExam(examId) {
  try {
    const response = await api.get(`/exam/${examId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to get exam';
    throw new Error(errorMessage);
  }
}

/**
 * Submit exam answers
 * @param {string} examId - Exam/Assignment ID
 * @param {Object} data - Submission data
 * @param {Array} data.answers - Array of answers with questionIndex and selectedAnswer
 * @param {number} data.timeSpent - Time spent in seconds
 * @returns {Promise<Object>} Result with score
 */
export async function submitExam(examId, data) {
  try {
    const response = await api.post(`/exam/${examId}/submit`, data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to submit exam';
    throw new Error(errorMessage);
  }
}

/**
 * Get exam results (Teacher/Admin)
 * @param {string} examId - Exam/Assignment ID
 * @returns {Promise<Object>} Results with statistics
 */
export async function getExamResults(examId) {
  try {
    const response = await api.get(`/exam/${examId}/results`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to get exam results';
    throw new Error(errorMessage);
  }
}

/**
 * Get student's own exam result
 * @param {string} examId - Exam/Assignment ID
 * @returns {Promise<Object>} Student's result with answers
 */
export async function getMyExamResult(examId) {
  try {
    const response = await api.get(`/exam/${examId}/my-result`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to get exam result';
    throw new Error(errorMessage);
  }
}

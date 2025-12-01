import express from 'express';
import { 
    generateExam, 
    getExam, 
    submitExam, 
    getExamResults, 
    getMyExamResult 
} from '../Controllers/exam.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';

const router = express.Router();

// POST /api/v1/exam/generate - Generate exam questions (Teacher/Admin)
router.post('/generate', isAuthenticated, isTeacherOrAdmin, generateExam);

// GET /api/v1/exam/:examId - Get exam for student to take (Student)
router.get('/:examId', isAuthenticated, getExam);

// POST /api/v1/exam/:examId/submit - Submit exam answers (Student)
router.post('/:examId/submit', isAuthenticated, submitExam);

// GET /api/v1/exam/:examId/results - Get all results for an exam (Teacher/Admin)
router.get('/:examId/results', isAuthenticated, isTeacherOrAdmin, getExamResults);

// GET /api/v1/exam/:examId/my-result - Get student's own result (Student)
router.get('/:examId/my-result', isAuthenticated, getMyExamResult);

export default router;

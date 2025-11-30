import express from 'express';
import {
    assignGrade,
    finalizeGrade,
    getMyGrades,
    getGradeById,
    getCourseGrades,
    generateTranscript,
    getGradeAnalytics,
    bulkFinalizeGrades,
    createGrade,
    getTeacherGradeAnalytics,
    getAdminGradeAnalytics,
} from '../Controllers/grade.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';

const router = express.Router();

// Student routes
router.get('/my-grades', verifyJWT, getMyGrades);
router.get('/transcript', verifyJWT, generateTranscript);
router.get('/transcript/:studentId', verifyJWT, generateTranscript);
router.get('/analytics', verifyJWT, getGradeAnalytics);
router.get('/analytics/:studentId', verifyJWT, getGradeAnalytics);

// Teacher routes
router.post('/', verifyJWT, isTeacherOrAdmin, createGrade); // Direct grade creation
router.get('/course/:courseId', verifyJWT, isTeacherOrAdmin, getCourseGrades);
router.post('/assign/:enrollmentId', verifyJWT, isTeacherOrAdmin, assignGrade);
router.patch('/finalize/:gradeId', verifyJWT, isTeacherOrAdmin, finalizeGrade);
router.post('/bulk-finalize/:courseId', verifyJWT, isTeacherOrAdmin, bulkFinalizeGrades);
router.get('/analytics/teacher/overview', verifyJWT, isTeacherOrAdmin, getTeacherGradeAnalytics);
router.get('/analytics/admin/overview', verifyJWT, isAdmin, getAdminGradeAnalytics);

// Generic route must come last to avoid intercepting analytics paths
router.get('/:id', verifyJWT, getGradeById);

export default router;


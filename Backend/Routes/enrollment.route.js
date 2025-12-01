import express from 'express';
import {
    enrollInCourse,
    dropCourse,
    getMyEnrollments,
    getEnrollmentById,
    updateEnrollmentProgress,
    updateEnrollmentScores,
    getCourseEnrollments,
    adminEnrollStudent,
    getStudentEnrollments,
} from '../Controllers/enrollment.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';

const router = express.Router();

// Student routes
router.post('/enroll', verifyJWT, enrollInCourse);
router.get('/my-enrollments', verifyJWT, getMyEnrollments);
router.patch('/:enrollmentId/drop', verifyJWT, dropCourse);

// Teacher routes
router.get('/student/:studentId', verifyJWT, isTeacherOrAdmin, getStudentEnrollments);
router.get('/course/:courseId', verifyJWT, isTeacherOrAdmin, getCourseEnrollments);
router.patch('/:enrollmentId/progress', verifyJWT, isTeacherOrAdmin, updateEnrollmentProgress);
router.patch('/:enrollmentId/scores', verifyJWT, isTeacherOrAdmin, updateEnrollmentScores);

// Shared route (after specific ones)
router.get('/:id', verifyJWT, getEnrollmentById);

// Admin routes
router.post('/admin-enroll', verifyJWT, isAdmin, adminEnrollStudent);

export default router;


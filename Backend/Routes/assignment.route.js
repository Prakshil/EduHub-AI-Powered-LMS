import express from 'express';
import {
    createAssignment,
    getCourseAssignments,
    getMyAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    togglePublishAssignment,
    generateExam,
} from '../Controllers/assignment.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';
import { assignmentUpload } from '../middlewares/assignmentUpload.middleware.js';

const router = express.Router();

// All routes require authentication
router.post('/', verifyJWT, isTeacherOrAdmin, assignmentUpload.array('attachments', 10), createAssignment);
router.post('/generate-exam', verifyJWT, isTeacherOrAdmin, generateExam);
router.get('/course/:courseId', verifyJWT, getCourseAssignments);
router.get('/my-assignments', verifyJWT, getMyAssignments);
router.get('/:id', verifyJWT, getAssignmentById);
router.put('/:id', verifyJWT, isTeacherOrAdmin, assignmentUpload.array('attachments', 10), updateAssignment);
router.delete('/:id', verifyJWT, isTeacherOrAdmin, deleteAssignment);
router.patch('/:id/toggle-publish', verifyJWT, isTeacherOrAdmin, togglePublishAssignment);

export default router;

import express from 'express';
import {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCoursesByTeacher,
    getAvailableCourses,
    getCourseStudents,
    assignTeacherToCourse,
    removeTeacherFromCourse,
    getUnassignedCourses,
} from '../Controllers/course.controller.js';
// Admin: Get unassigned courses for assignment
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';

const router = express.Router();


router.get('/unassigned', verifyJWT, isAdmin, getUnassignedCourses);
// Public routes (authenticated users)
router.get('/', verifyJWT, getAllCourses);
router.get('/available', verifyJWT, getAvailableCourses);
router.get('/my-courses', verifyJWT, isTeacherOrAdmin, getCoursesByTeacher);
router.get('/teacher/:teacherId', verifyJWT, getCoursesByTeacher);
router.get('/:id', verifyJWT, getCourseById);
router.get('/:id/students', verifyJWT, isTeacherOrAdmin, getCourseStudents);

// Admin only routes
router.post('/', verifyJWT, isAdmin, createCourse);
router.patch('/:id/assign-teacher', verifyJWT, isAdmin, assignTeacherToCourse);
router.patch('/:id/remove-teacher', verifyJWT, isAdmin, removeTeacherFromCourse);
router.delete('/:id', verifyJWT, isAdmin, deleteCourse);

// Teacher or Admin routes
router.put('/:id', verifyJWT, isTeacherOrAdmin, updateCourse);

export default router;


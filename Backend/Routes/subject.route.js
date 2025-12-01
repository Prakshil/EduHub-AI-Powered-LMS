import express from 'express';
import {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
    getDepartments,
} from '../Controllers/subject.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', verifyJWT, getAllSubjects);
router.get('/departments', verifyJWT, getDepartments);
router.get('/:id', verifyJWT, getSubjectById);

// Admin only routes
router.post('/', verifyJWT, isAdmin, createSubject);
router.put('/:id', verifyJWT, isAdmin, updateSubject);
router.delete('/:id', verifyJWT, isAdmin, deleteSubject);

export default router;


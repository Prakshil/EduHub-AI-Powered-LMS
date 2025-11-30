import express from 'express';
import {
    createSemester,
    getAllSemesters,
    getCurrentSemester,
    getSemesterById,
    updateSemester,
    deleteSemester,
    setCurrentSemester,
} from '../Controllers/semester.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', verifyJWT, getAllSemesters);
router.get('/current', verifyJWT, getCurrentSemester);
router.get('/:id', verifyJWT, getSemesterById);

// Admin only routes
router.post('/', verifyJWT, isAdmin, createSemester);
router.put('/:id', verifyJWT, isAdmin, updateSemester);
router.delete('/:id', verifyJWT, isAdmin, deleteSemester);
router.patch('/:id/set-current', verifyJWT, isAdmin, setCurrentSemester);

export default router;


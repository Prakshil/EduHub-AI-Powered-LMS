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

// Read-only semester info is safe to expose without auth
router.get('/', getAllSemesters);
router.get('/current', getCurrentSemester);
router.get('/:id', getSemesterById);

// Admin only routes
router.post('/', verifyJWT, isAdmin, createSemester);
router.put('/:id', verifyJWT, isAdmin, updateSemester);
router.delete('/:id', verifyJWT, isAdmin, deleteSemester);
router.patch('/:id/set-current', verifyJWT, isAdmin, setCurrentSemester);

export default router;


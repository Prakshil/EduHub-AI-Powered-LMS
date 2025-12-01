import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';
import { getStudentUsers, getStudentProfileDetails } from '../Controllers/admin.controller.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

const canViewStudentProfile = (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        const requester = req.user;
        const requestedId = req.params.id;

        if (requester.role === 'admin' || requester.role === 'teacher') {
            return next();
        }

        if (requester.role === 'user' && requester._id.toString() === requestedId) {
            return next();
        }

        throw new ApiError(403, 'Access denied');
    } catch (error) {
        next(error);
    }
};

router.use(isAuthenticated);

router.get('/students', isTeacherOrAdmin, getStudentUsers);
router.get('/students/:id', canViewStudentProfile, getStudentProfileDetails);

export default router;


import express from 'express';
import {
    createAnnouncement,
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    getCategories,
    getMyAnnouncements,
    getUnreadCount,
} from '../Controllers/announcement.controller.js';
import { isAuthenticated as verifyJWT } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import { isTeacherOrAdmin } from '../middlewares/teacher.middleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', verifyJWT, getAllAnnouncements);
router.get('/categories', verifyJWT, getCategories);
router.get('/unread-count', verifyJWT, getUnreadCount);
router.get('/my-announcements', verifyJWT, isTeacherOrAdmin, getMyAnnouncements);
router.get('/:id', verifyJWT, getAnnouncementById);

// Teacher/Admin routes
router.post('/', verifyJWT, isTeacherOrAdmin, createAnnouncement);
router.put('/:id', verifyJWT, isTeacherOrAdmin, updateAnnouncement);
router.delete('/:id', verifyJWT, isTeacherOrAdmin, deleteAnnouncement);

// Admin only routes
router.patch('/:id/toggle-pin', verifyJWT, isAdmin, togglePin);

export default router;


import Announcement from '../Models/Announcement.model.js';
import User from '../Models/user.model.js';
import Course from '../Models/Course.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import nodemailer from 'nodemailer';

// Create announcement (Admin/Teacher)
export const createAnnouncement = async (req, res, next) => {
    try {
        const {
            title,
            content,
            category,
            priority,
            audience,
            course,
            semester,
            isPinned,
            publishAt,
            expiresAt,
            attachments,
            sendEmail,
        } = req.body;
        
        // Validate course access for teachers
        if (course && req.user.role === 'teacher') {
            const courseDoc = await Course.findById(course);
            if (!courseDoc || courseDoc.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to post to this course');
            }
        }
        
        const announcement = await Announcement.create({
            title,
            content,
            category: category || 'General',
            priority: priority || 'normal',
            author: req.user._id,
            audience: audience || 'all',
            course,
            semester,
            isPinned: isPinned || false,
            publishAt: publishAt || new Date(),
            expiresAt,
            attachments,
            sendEmail: sendEmail || false,
        });
        
        // Get recipients based on audience
        let recipients = [];
        
        if (course) {
            // Course-specific announcement
            const enrollments = await Enrollment.find({ course, status: 'enrolled' });
            recipients = enrollments.map(e => e.student);
        } else {
            // General announcement based on audience
            const query = {};
            if (audience === 'students') {
                query.role = 'user';
            } else if (audience === 'teachers') {
                query.role = 'teacher';
            } else if (audience === 'admins') {
                query.role = 'admin';
            }
            
            const users = await User.find(query).select('_id email');
            recipients = users.map(u => u._id);
        }
        
        // Send email notifications if requested
        if (sendEmail && recipients.length > 0) {
            // Queue email sending (in production, use a job queue)
            const users = await User.find({ _id: { $in: recipients } }).select('email');
            const emails = users.map(u => u.email);
            
            // Mark email as sent (actual sending would be done via job queue)
            announcement.emailSentAt = new Date();
            await announcement.save();
        }
        
        await announcement.populate('author', 'username email profileimage');
        
        res.status(201).json(new ApiResponse(201, announcement, 'Announcement created successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all announcements
export const getAllAnnouncements = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            course,
            isPinned,
            search,
        } = req.query;
        
        const query = {
            isPublished: true,
            publishAt: { $lte: new Date() },
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gte: new Date() } },
            ],
        };
        
        // Filter by audience based on user role
        const audienceFilter = ['all'];
        if (req.user.role === 'user') {
            audienceFilter.push('students');
        } else if (req.user.role === 'teacher') {
            audienceFilter.push('teachers');
        } else if (req.user.role === 'admin') {
            audienceFilter.push('admins');
        }
        query.audience = { $in: audienceFilter };
        
        if (category) {
            query.category = category;
        }
        
        if (course) {
            query.course = course;
        } else if (req.user.role === 'user') {
            // For students, also show course-specific announcements they're enrolled in
            const enrollments = await Enrollment.find({
                student: req.user._id,
                status: 'enrolled',
            }).select('course');
            const courseIds = enrollments.map(e => e.course);
            
            query.$or = [
                { course: { $exists: false } },
                { course: null },
                { course: { $in: courseIds } },
            ];
        }
        
        if (isPinned !== undefined) {
            query.isPinned = isPinned === 'true';
        }
        
        if (search) {
            query.$text = { $search: search };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const announcements = await Announcement.find(query)
            .populate('author', 'username profileimage')
            .populate('course', 'subject')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Announcement.countDocuments(query);
        
        // Add read status for current user
        const announcementsWithReadStatus = announcements.map(ann => {
            const isRead = ann.readBy?.some(
                r => r.user.toString() === req.user._id.toString()
            );
            return {
                ...ann.toObject(),
                isRead,
            };
        });
        
        res.status(200).json(new ApiResponse(200, {
            announcements: announcementsWithReadStatus,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Announcements fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get announcement by ID
export const getAnnouncementById = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('author', 'username email profileimage')
            .populate({
                path: 'course',
                populate: { path: 'subject', select: 'name code' },
            });
        
        if (!announcement) {
            throw new ApiError(404, 'Announcement not found');
        }
        
        // Mark as read
        const alreadyRead = announcement.readBy?.some(
            r => r.user.toString() === req.user._id.toString()
        );
        
        if (!alreadyRead) {
            announcement.readBy.push({
                user: req.user._id,
                readAt: new Date(),
            });
            await announcement.save();
        }
        
        res.status(200).json(new ApiResponse(200, announcement, 'Announcement fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update announcement (Author or Admin)
export const updateAnnouncement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const announcement = await Announcement.findById(id);
        
        if (!announcement) {
            throw new ApiError(404, 'Announcement not found');
        }
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            announcement.author.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to update this announcement');
        }
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'author' && key !== 'readBy') {
                announcement[key] = updates[key];
            }
        });
        
        await announcement.save();
        await announcement.populate('author', 'username email profileimage');
        
        res.status(200).json(new ApiResponse(200, announcement, 'Announcement updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete announcement (Author or Admin)
export const deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            throw new ApiError(404, 'Announcement not found');
        }
        
        // Check permission: allow admin, author, or user who has read the announcement
        const isAdmin = req.user.role === 'admin';
        const isAuthor = announcement.author.toString() === req.user._id.toString();
        const hasRead = Array.isArray(announcement.readBy) && announcement.readBy.some(r => r.user.toString() === req.user._id.toString());
        if (!isAdmin && !isAuthor && !hasRead) {
            throw new ApiError(403, 'Not authorized to delete this announcement');
        }
        
        await Announcement.findByIdAndDelete(req.params.id);
        
        res.status(200).json(new ApiResponse(200, null, 'Announcement deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Pin/Unpin announcement (Admin only)
export const togglePin = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        
        if (!announcement) {
            throw new ApiError(404, 'Announcement not found');
        }
        
        announcement.isPinned = !announcement.isPinned;
        await announcement.save();
        
        res.status(200).json(new ApiResponse(200, announcement, 
            `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`
        ));
    } catch (error) {
        next(error);
    }
};

// Get categories
export const getCategories = async (req, res, next) => {
    try {
        const categories = [
            "General",
            "Exam",
            "Holiday",
            "Event",
            "Academic",
            "Administrative",
            "Emergency",
        ];
        
        res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get my announcements (for teachers/admins)
export const getMyAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find({ author: req.user._id })
            .populate({
                path: 'course',
                populate: { path: 'subject', select: 'name code' },
            })
            .sort({ createdAt: -1 });
        
        res.status(200).json(new ApiResponse(200, announcements, 'My announcements fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get unread count
export const getUnreadCount = async (req, res, next) => {
    try {
        // Build query similar to getAllAnnouncements
        const audienceFilter = ['all'];
        if (req.user.role === 'user') {
            audienceFilter.push('students');
        } else if (req.user.role === 'teacher') {
            audienceFilter.push('teachers');
        } else if (req.user.role === 'admin') {
            audienceFilter.push('admins');
        }
        
        const query = {
            isPublished: true,
            publishAt: { $lte: new Date() },
            audience: { $in: audienceFilter },
            'readBy.user': { $ne: req.user._id },
        };
        
        const count = await Announcement.countDocuments(query);
        
        res.status(200).json(new ApiResponse(200, { unreadCount: count }, 'Unread count fetched'));
    } catch (error) {
        next(error);
    }
};


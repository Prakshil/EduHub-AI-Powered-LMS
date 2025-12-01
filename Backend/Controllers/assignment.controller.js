import Assignment from '../Models/Assignment.model.js';
import Course from '../Models/Course.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import Announcement from '../Models/Announcement.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import fs from 'fs';
import mongoose from 'mongoose';
import { uploadDocumentOnCloudinary } from '../utils/Cloudinary.js';


// Create assignment (Teacher)
export const createAssignment = async (req, res, next) => {
    try {
        const {
            title,
            description,
            courseId,
            type,
            dueDate,
            maxScore,
            instructions,
            isPublished,
        } = req.body;

        const course = await Course.findById(courseId).populate('subject');
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        // Check if teacher is authorized (admin can create for any course)
        if (req.user.role !== 'admin') {
            if (!course.teacher || course.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to create assignments for this course');
            }
        }

        // Handle file uploads
        const attachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadRes = await uploadDocumentOnCloudinary(file.path);
                    if (uploadRes?.secure_url) {
                        // Determine file type
                        let fileType = 'other';
                        const ext = file.originalname.split('.').pop().toLowerCase();
                        if (['pdf'].includes(ext)) fileType = 'pdf';
                        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
                        else if (['txt'].includes(ext)) fileType = 'txt';
                        else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) fileType = 'image';

                        attachments.push({
                            name: file.originalname,
                            url: uploadRes.secure_url,
                            type: fileType,
                            size: file.size,
                        });
                    }
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                } finally {
                    // Cleanup temp file
                    try {
                        if (file.path) fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting temp file:', unlinkError);
                    }
                }
            }
        }

        const assignment = await Assignment.create({
            title,
            description,
            course: courseId,
            teacher: req.user._id,
            type: type || 'assignment',
            dueDate: new Date(dueDate),
            maxScore: maxScore || 100,
            instructions,
            attachments,
            isPublished: isPublished === 'true' || isPublished === true,
            publishedAt: isPublished === 'true' || isPublished === true ? new Date() : null,
        });

        // If published, notify enrolled students via announcement
        if (assignment.isPublished) {
            await notifyStudentsAboutAssignment(assignment, course);
        }

        await assignment.populate([
            { path: 'course', populate: { path: 'subject', select: 'name code' } },
            { path: 'teacher', select: 'username email' },
        ]);

        res.status(201).json(new ApiResponse(201, assignment, 'Assignment created successfully'));
    } catch (error) {
        next(error);
    }
};

// Helper function to notify students
const notifyStudentsAboutAssignment = async (assignment, course) => {
    try {
        const enrollments = await Enrollment.find({
            course: assignment.course,
            status: 'enrolled',
        });

        if (enrollments.length === 0) return;

        const typeLabels = {
            assignment: 'Assignment',
            midterm: 'Midterm Exam',
            final: 'Final Exam',
        };

        // Create announcement for enrolled students
        await Announcement.create({
            title: `New ${typeLabels[assignment.type]}: ${assignment.title}`,
            content: `A new ${assignment.type} has been posted for ${course.subject?.name || 'your course'}. Due date: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            category: 'Academic',
            priority: 'high',
            author: assignment.teacher,
            audience: 'students',
            course: assignment.course,
            isPublished: true,
            publishAt: new Date(),
        });
    } catch (error) {
        console.error('Error creating assignment notification:', error);
    }
};

// Get assignments for a course (Teacher/Student)
export const getCourseAssignments = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { type } = req.query;

        const course = await Course.findById(courseId);
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        // Check authorization
        if (req.user.role === 'user') {
            // Student: check if enrolled
            const enrollment = await Enrollment.findOne({
                student: req.user._id,
                course: courseId,
                status: 'enrolled',
            });
            if (!enrollment) {
                throw new ApiError(403, 'Not enrolled in this course');
            }
        } else if (req.user.role === 'teacher') {
            // Teacher: check if teaching this course
            if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                throw new ApiError(403, 'Not authorized to view assignments for this course');
            }
        }

        const query = { course: courseId, isPublished: true };
        if (type) {
            query.type = type;
        }

        const assignments = await Assignment.find(query)
            .populate('teacher', 'username email')
            .populate({ path: 'course', populate: { path: 'subject', select: 'name code' } })
            .sort({ dueDate: 1, createdAt: -1 });

        res.status(200).json(new ApiResponse(200, assignments, 'Assignments fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all assignments for teacher's courses (or all for admin)
export const getMyAssignments = async (req, res, next) => {
    try {
        const { type, courseId } = req.query;

        let query = {};
        
        if (req.user.role === 'admin') {
            // Admin can see all assignments across all courses
            // No course filter needed - admins see everything
        } else if (req.user.role === 'teacher') {
            // Get teacher's courses
            const courses = await Course.find({ teacher: req.user._id }).select('_id');
            const courseIds = courses.map(c => c._id);
            query.course = { $in: courseIds };
        } else if (req.user.role === 'user') {
            // Get student's enrolled courses
            const enrollments = await Enrollment.find({
                student: req.user._id,
                status: 'enrolled',
            }).select('course');
            const courseIds = enrollments.map(e => e.course);
            query.course = { $in: courseIds };
            query.isPublished = true;
        }

        if (type) {
            query.type = type;
        }

        // Only filter by courseId if it's provided and not 'all'
        if (courseId && courseId !== 'all') {
            // Admins can filter by any course
            if (req.user.role === 'admin') {
                query.course = courseId;
            } else if (query.course && query.course.$in) {
                // Check if the courseId is in the allowed courses
                const courseIds = query.course.$in;
                if (courseIds.some(id => id.toString() === courseId)) {
                    query.course = courseId;
                } else {
                    // Course not in teacher's/student's courses, return empty
                    query.course = new mongoose.Types.ObjectId('000000000000000000000000'); // Invalid ObjectId to return no results
                }
            } else {
                query.course = courseId;
            }
        }

        const assignments = await Assignment.find(query)
            .populate('teacher', 'username email')
            .populate({ path: 'course', populate: { path: 'subject', select: 'name code' } })
            .sort({ dueDate: 1, createdAt: -1 });

        res.status(200).json(new ApiResponse(200, assignments, 'Assignments fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get assignment by ID
export const getAssignmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id)
            .populate('teacher', 'username email profileimage')
            .populate({ path: 'course', populate: { path: 'subject', select: 'name code' } });

        if (!assignment) {
            throw new ApiError(404, 'Assignment not found');
        }

        // Check authorization
        if (req.user.role === 'user') {
            // Student: check if enrolled and assignment is published
            if (!assignment.isPublished) {
                throw new ApiError(403, 'Assignment not available');
            }
            const enrollment = await Enrollment.findOne({
                student: req.user._id,
                course: assignment.course._id,
                status: 'enrolled',
            });
            if (!enrollment) {
                throw new ApiError(403, 'Not enrolled in this course');
            }
        } else if (req.user.role === 'teacher') {
            // Teacher: check if teaching this course
            if (assignment.course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                throw new ApiError(403, 'Not authorized to view this assignment');
            }
        }

        res.status(200).json(new ApiResponse(200, assignment, 'Assignment fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update assignment (Teacher)
export const updateAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            type,
            dueDate,
            maxScore,
            instructions,
            isPublished,
        } = req.body;

        const assignment = await Assignment.findById(id).populate('course');
        if (!assignment) {
            throw new ApiError(404, 'Assignment not found');
        }

        // Check authorization
        if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to update this assignment');
        }

        // Update fields
        if (title !== undefined) assignment.title = title;
        if (description !== undefined) assignment.description = description;
        if (type !== undefined) assignment.type = type;
        if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
        if (maxScore !== undefined) assignment.maxScore = maxScore;
        if (instructions !== undefined) assignment.instructions = instructions;

        // Handle publishing
        const wasPublished = assignment.isPublished;
        if (isPublished !== undefined) {
            assignment.isPublished = isPublished === 'true' || isPublished === true;
            if (assignment.isPublished && !wasPublished) {
                assignment.publishedAt = new Date();
                // Notify students if newly published
                await notifyStudentsAboutAssignment(assignment, assignment.course);
            }
        }

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const uploadRes = await uploadDocumentOnCloudinary(file.path);
                    if (uploadRes?.secure_url) {
                        const ext = file.originalname.split('.').pop().toLowerCase();
                        let fileType = 'other';
                        if (['pdf'].includes(ext)) fileType = 'pdf';
                        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
                        else if (['txt'].includes(ext)) fileType = 'txt';
                        else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) fileType = 'image';

                        assignment.attachments.push({
                            name: file.originalname,
                            url: uploadRes.secure_url,
                            type: fileType,
                            size: file.size,
                        });
                    }
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                } finally {
                    try {
                        if (file.path) fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting temp file:', unlinkError);
                    }
                }
            }
        }

        await assignment.save();

        await assignment.populate([
            { path: 'course', populate: { path: 'subject', select: 'name code' } },
            { path: 'teacher', select: 'username email' },
        ]);

        res.status(200).json(new ApiResponse(200, assignment, 'Assignment updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete assignment (Teacher)
export const deleteAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            throw new ApiError(404, 'Assignment not found');
        }

        // Check authorization
        if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to delete this assignment');
        }

        await Assignment.findByIdAndDelete(id);

        res.status(200).json(new ApiResponse(200, null, 'Assignment deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Publish/Unpublish assignment
export const togglePublishAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findById(id).populate('course');
        if (!assignment) {
            throw new ApiError(404, 'Assignment not found');
        }

        // Check authorization
        if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to modify this assignment');
        }

        assignment.isPublished = !assignment.isPublished;
        if (assignment.isPublished && !assignment.publishedAt) {
            assignment.publishedAt = new Date();
            // Notify students if newly published
            await notifyStudentsAboutAssignment(assignment, assignment.course);
        }

        await assignment.save();

        res.status(200).json(new ApiResponse(200, assignment, 
            `Assignment ${assignment.isPublished ? 'published' : 'unpublished'} successfully`
        ));
    } catch (error) {
        next(error);
    }
};


// Generate MCQ exam using Google Gemini (Teacher) - re-export from exam controller
export { generateExam } from './exam.controller.js';


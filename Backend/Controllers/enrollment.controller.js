import Enrollment from '../Models/Enrollment.model.js';
import Course from '../Models/Course.model.js';
import Semester from '../Models/Semester.model.js';
import Grade from '../Models/Grade.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Enroll in a course
export const enrollInCourse = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user._id;
        
        // Get course with semester
        const course = await Course.findById(courseId)
            .populate('subject')
            .populate('semester');
        
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        if (!course.isActive) {
            throw new ApiError(400, 'This course is not active');
        }
        
        // Check if registration is open
        if (!course.semester.registrationOpen) {
            throw new ApiError(400, 'Registration is not open for this semester');
        }
        
        // Check capacity
        if (course.currentEnrollment >= course.maxCapacity) {
            throw new ApiError(400, 'Course is at maximum capacity');
        }
        
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
        });
        
        if (existingEnrollment) {
            if (existingEnrollment.status === 'enrolled') {
                throw new ApiError(400, 'Already enrolled in this course');
            }
            if (existingEnrollment.status === 'completed') {
                throw new ApiError(400, 'Already completed this course');
            }
        }
        
        // Check prerequisites
        if (course.prerequisites && course.prerequisites.length > 0) {
            const completedEnrollments = await Enrollment.find({
                student: studentId,
                status: 'completed',
            }).populate('course');
            
            const completedSubjectIds = completedEnrollments.map(
                e => e.course.subject.toString()
            );
            
            const missingPrereqs = course.prerequisites.filter(
                prereq => !completedSubjectIds.includes(prereq.toString())
            );
            
            if (missingPrereqs.length > 0) {
                throw new ApiError(400, 'Prerequisites not met for this course');
            }
        }
        
        // Create enrollment
        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
            semester: course.semester._id,
            progress: {
                totalWeeks: course.syllabus?.length || 16,
            },
        });
        
        // Update course enrollment count
        course.currentEnrollment += 1;
        await course.save();
        
        await enrollment.populate([
            { path: 'course', populate: { path: 'subject teacher', select: 'name code username email' } },
            { path: 'semester', select: 'name year term' },
        ]);
        
        res.status(201).json(new ApiResponse(201, enrollment, 'Enrolled successfully'));
    } catch (error) {
        next(error);
    }
};

// Drop a course
export const dropCourse = async (req, res, next) => {
    try {
        const { enrollmentId } = req.params;
        const { reason } = req.body;
        const studentId = req.user._id;
        
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate('course')
            .populate('semester');
        
        if (!enrollment) {
            throw new ApiError(404, 'Enrollment not found');
        }
        
        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && enrollment.student.toString() !== studentId.toString()) {
            throw new ApiError(403, 'Not authorized to drop this enrollment');
        }
        
        if (enrollment.status !== 'enrolled') {
            throw new ApiError(400, `Cannot drop a ${enrollment.status} enrollment`);
        }
        
        // Update enrollment
        enrollment.status = 'dropped';
        enrollment.dropReason = reason;
        await enrollment.save();
        
        // Update course enrollment count
        await Course.findByIdAndUpdate(enrollment.course._id, {
            $inc: { currentEnrollment: -1 },
        });
        
        res.status(200).json(new ApiResponse(200, enrollment, 'Course dropped successfully'));
    } catch (error) {
        next(error);
    }
};

// Get student's enrollments
export const getMyEnrollments = async (req, res, next) => {
    try {
        const studentId = req.user._id;
        const { semester, status } = req.query;
        
        const query = { student: studentId };
        
        if (semester) {
            query.semester = semester;
        }
        
        if (status) {
            query.status = status;
        }
        
        const enrollments = await Enrollment.find(query)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits department' },
                    { path: 'teacher', select: 'username email profileimage teacherProfile' },
                ],
            })
            .populate('semester', 'name year term isCurrent')
            .sort({ createdAt: -1 });
        
        res.status(200).json(new ApiResponse(200, enrollments, 'Enrollments fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get enrollment by ID
export const getEnrollmentById = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits department' },
                    { path: 'teacher', select: 'username email profileimage teacherProfile' },
                    { path: 'semester', select: 'name year term' },
                ],
            })
            .populate('semester', 'name year term');
        
        if (!enrollment) {
            throw new ApiError(404, 'Enrollment not found');
        }
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            req.user.role !== 'teacher' &&
            enrollment.student.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to view this enrollment');
        }
        
        res.status(200).json(new ApiResponse(200, enrollment, 'Enrollment fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update enrollment progress (Teacher)
export const updateEnrollmentProgress = async (req, res, next) => {
    try {
        const { enrollmentId } = req.params;
        const { completedWeeks, attendancePercentage } = req.body;
        
        const enrollment = await Enrollment.findById(enrollmentId).populate('course');
        
        if (!enrollment) {
            throw new ApiError(404, 'Enrollment not found');
        }
        
        // Check if teacher is authorized
        if (
            req.user.role !== 'admin' &&
            enrollment.course.teacher.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to update this enrollment');
        }
        
        if (completedWeeks !== undefined) {
            enrollment.progress.completedWeeks = completedWeeks;
        }
        if (attendancePercentage !== undefined) {
            enrollment.progress.attendancePercentage = attendancePercentage;
        }
        enrollment.progress.lastAccessed = new Date();
        
        await enrollment.save();
        
        res.status(200).json(new ApiResponse(200, enrollment, 'Progress updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Update enrollment scores (Teacher)
export const updateEnrollmentScores = async (req, res, next) => {
    try {
        const { enrollmentId } = req.params;
        const { assignments, midterm, final, attendance, participation } = req.body;
        
        const enrollment = await Enrollment.findById(enrollmentId).populate('course');
        
        if (!enrollment) {
            throw new ApiError(404, 'Enrollment not found');
        }
        
        // Check if teacher is authorized
        if (
            req.user.role !== 'admin' &&
            enrollment.course.teacher.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to update scores');
        }
        
        // Update scores
        if (assignments) {
            enrollment.scores.assignments = assignments;
        }
        if (midterm) {
            enrollment.scores.midterm = midterm;
        }
        if (final) {
            enrollment.scores.final = final;
        }
        if (attendance) {
            enrollment.scores.attendance = attendance;
        }
        if (participation) {
            enrollment.scores.participation = participation;
        }
        
        await enrollment.save();
        
        res.status(200).json(new ApiResponse(200, enrollment, 'Scores updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Get enrollments for a course (Teacher/Admin)
export const getCourseEnrollments = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            course.teacher.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to view course enrollments');
        }
        
        const enrollments = await Enrollment.find({ course: courseId })
            .populate('student', 'username email profileimage studentProfile')
            .sort({ 'student.username': 1 });
        
        res.status(200).json(new ApiResponse(200, enrollments, 'Course enrollments fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Admin: Enroll student in course
export const adminEnrollStudent = async (req, res, next) => {
    try {
        const { studentId, courseId } = req.body;
        
        const course = await Course.findById(courseId).populate('subject semester');
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
        });
        
        if (existingEnrollment && existingEnrollment.status === 'enrolled') {
            throw new ApiError(400, 'Student already enrolled');
        }
        
        // Create enrollment
        const enrollment = await Enrollment.create({
            student: studentId,
            course: courseId,
            semester: course.semester._id,
            progress: {
                totalWeeks: course.syllabus?.length || 16,
            },
        });
        
        // Update course enrollment count
        course.currentEnrollment += 1;
        await course.save();
        
        await enrollment.populate([
            { path: 'student', select: 'username email profileimage' },
            { path: 'course', populate: { path: 'subject', select: 'name code' } },
        ]);
        
        res.status(201).json(new ApiResponse(201, enrollment, 'Student enrolled successfully'));
    } catch (error) {
        next(error);
    }
};

// Get enrollments for a specific student (Teacher/Admin)
export const getStudentEnrollments = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { status } = req.query;
        
        const query = { student: studentId };
        if (status) {
            query.status = status;
        }
        
        if (req.user.role === 'teacher') {
            const teacherCourseIds = await Course.find({ teacher: req.user._id }).distinct('_id');
            if (!teacherCourseIds.length) {
                return res.status(200).json(new ApiResponse(200, [], 'No enrollments for this student under your courses'));
            }
            query.course = { $in: teacherCourseIds };
        }
        
        const enrollments = await Enrollment.find(query)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits department' },
                    { path: 'teacher', select: 'username email profileimage' },
                ],
            })
            .populate('semester', 'name year term isCurrent startDate endDate')
            .sort({ createdAt: -1 });
        
        res.status(200).json(new ApiResponse(200, enrollments, 'Student enrollments fetched successfully'));
    } catch (error) {
        next(error);
    }
};


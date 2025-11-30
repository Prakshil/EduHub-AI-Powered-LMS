// Get unassigned courses (teacher is null)
export const getUnassignedCourses = async (req, res, next) => {
    try {
        const { semester, section } = req.query;
        const query = { teacher: null };
        if (semester) query.semester = semester;
        if (section) query.section = section;
        const courses = await Course.find(query)
            .populate('subject', 'name code credits department')
            .populate('semester', 'name year term')
            .sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, courses, 'Unassigned courses fetched successfully'));
    } catch (error) {
        next(error);
    }
};
import Course from '../Models/Course.model.js';
import Subject from '../Models/Subject.model.js';
import Semester from '../Models/Semester.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import Grade from '../Models/Grade.model.js';
import User from '../Models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Create a new course (Admin only)
export const createCourse = async (req, res, next) => {
    try {
        let {
            subject,
            semester,
            teacher,
            section,
            maxCapacity,
            schedule,
            syllabus,
            prerequisites,
            description,
            gradingPolicy,
            subjectCodeName, // new field for direct input (e.g., "CS101 - Database Systems")
            credits,
            department,
        } = req.body;

        // If subject is not a valid ObjectId, treat as new subject in format "CODE - Name"
        let subjectDoc;
        if (subjectCodeName && typeof subjectCodeName === 'string' && subjectCodeName.includes('-')) {
            const [codePart, ...nameParts] = subjectCodeName.split('-');
            const code = codePart.trim().toUpperCase();
            const name = nameParts.join('-').trim();
            if (!code || !name) {
                throw new ApiError(400, 'Invalid subject format. Use CODE - Name');
            }
            // Check if subject already exists
            subjectDoc = await Subject.findOne({ code });
            if (!subjectDoc) {
                if (!credits || !department) {
                    throw new ApiError(400, 'Credits and department are required for new subject');
                }
                subjectDoc = await Subject.create({
                    name,
                    code,
                    credits,
                    department,
                });
            }
        } else if (subject) {
            subjectDoc = await Subject.findById(subject);
            if (!subjectDoc) {
                throw new ApiError(404, 'Subject not found');
            }
        } else {
            throw new ApiError(400, 'Subject or subjectCodeName is required');
        }

        // Validate semester exists
        const semesterDoc = await Semester.findById(semester);
        if (!semesterDoc) {
            throw new ApiError(404, 'Semester not found');
        }

        // Validate teacher exists and is a teacher when provided
        if (teacher) {
            const teacherDoc = await User.findById(teacher);
            if (!teacherDoc) {
                throw new ApiError(404, 'Teacher not found');
            }
            if (teacherDoc.role !== 'teacher' && teacherDoc.role !== 'admin') {
                throw new ApiError(400, 'Assigned user is not a teacher');
            }
        }

        // Check for duplicate course
        const existingCourse = await Course.findOne({
            subject: subjectDoc._id,
            semester,
            section: section || 'A',
            teacher: teacher || null,
        });
        if (existingCourse) {
            throw new ApiError(400, 'This course already exists for this semester, section, and teacher');
        }

        const course = await Course.create({
            subject: subjectDoc._id,
            semester,
            teacher: teacher || null,
            section: section || 'A',
            maxCapacity: maxCapacity || 30,
            schedule,
            syllabus,
            prerequisites,
            description,
            gradingPolicy,
        });

        await course.populate([
            { path: 'subject', select: 'name code credits department' },
            { path: 'semester', select: 'name year term' },
            { path: 'teacher', select: 'username email teacherProfile' },
        ]);

        res.status(201).json(new ApiResponse(201, course, 'Course created successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all courses with filters
export const getAllCourses = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            semester, 
            teacher, 
            department,
            status,
            isActive,
            includeStudents
        } = req.query;
        
        const query = {};
        
        if (semester) {
            query.semester = semester;
        }
        
        if (teacher) {
            query.teacher = teacher;
        }
        
        if (status) {
            query.status = status;
        }
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        let courses = await Course.find(query)
            .populate('subject', 'name code credits department')
            .populate('semester', 'name year term isCurrent')
            .populate('teacher', 'username email teacherProfile profileimage')
            .populate('prerequisites', 'name code')
            .sort({ createdAt: -1 });
        
        // Filter by search (subject name or code) or department
        if (search || department) {
            courses = courses.filter(course => {
                const matchSearch = !search || 
                    course.subject.name.toLowerCase().includes(search.toLowerCase()) ||
                    course.subject.code.toLowerCase().includes(search.toLowerCase());
                const matchDepartment = !department || course.subject.department === department;
                return matchSearch && matchDepartment;
            });
        }
        
        const total = courses.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let paginatedCourses = courses.slice(skip, skip + parseInt(limit));

        if (includeStudents === 'true') {
            paginatedCourses = await Promise.all(
                paginatedCourses.map(async (course) => {
                    const enrollments = await Enrollment.find({
                        course: course._id,
                        status: { $in: ['enrolled', 'graded', 'completed'] },
                    }).populate('student', 'username email profileimage studentProfile phone gender address');

                    return {
                        ...course.toObject(),
                        enrollmentCount: enrollments.length,
                        enrolledStudents: enrollments,
                    };
                })
            );
        }
        
        res.status(200).json(new ApiResponse(200, {
            courses: paginatedCourses,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Courses fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get course by ID
export const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('subject', 'name code credits department description')
            .populate('semester', 'name year term startDate endDate isCurrent')
            .populate('teacher', 'username email teacherProfile profileimage')
            .populate('prerequisites', 'name code');
        
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Get enrollment count
        const enrollmentCount = await Enrollment.countDocuments({ 
            course: course._id, 
            status: 'enrolled' 
        });
        
        res.status(200).json(new ApiResponse(200, {
            ...course.toObject(),
            enrollmentCount,
        }, 'Course fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update course (Admin or assigned Teacher)
export const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const course = await Course.findById(id);
        
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check permission (admin or assigned teacher)
        if (req.user.role !== 'admin') {
            if (!course.teacher || course.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to update this course');
            }
        }
        
        // Update the course
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                course[key] = updates[key];
            }
        });
        
        await course.save();
        
        await course.populate([
            { path: 'subject', select: 'name code credits department' },
            { path: 'semester', select: 'name year term' },
            { path: 'teacher', select: 'username email teacherProfile' },
        ]);
        
        res.status(200).json(new ApiResponse(200, course, 'Course updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete course (Admin only)
export const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check if there are enrollments
        const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
        if (enrollmentCount > 0) {
            throw new ApiError(400, `Cannot delete course with ${enrollmentCount} enrolled students. Deactivate instead.`);
        }
        
        await Course.findByIdAndDelete(req.params.id);
        
        res.status(200).json(new ApiResponse(200, null, 'Course deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Get courses by teacher
export const getCoursesByTeacher = async (req, res, next) => {
    try {
        const teacherId = req.params.teacherId || req.user._id;
        const { semester } = req.query;
        
        // Admins can see all courses, teachers see only their courses
        let query = {};
        if (req.user.role === 'admin') {
            // Admin sees all courses - no teacher filter
        } else {
            query.teacher = teacherId;
        }
        
        if (semester) {
            query.semester = semester;
        }
        
        const courses = await Course.find(query)
            .populate('subject', 'name code credits department')
            .populate('semester', 'name year term isCurrent startDate endDate')
            .sort({ createdAt: -1 });

        const courseIds = courses.map(course => course._id);

        const [enrollments, grades] = await Promise.all([
            Enrollment.find({
                course: { $in: courseIds },
                status: { $in: ['enrolled', 'graded', 'completed'] },
            })
                .populate('student', 'username email profileimage phone gender address role studentProfile skills')
                .lean(),
            Grade.find({ course: { $in: courseIds } })
                .select('student course letterGrade totalPercentage status remarks gradePoints credits gradedAt')
                .lean(),
        ]);

        const gradeMap = new Map();
        grades.forEach((grade) => {
            const key = `${grade.course.toString()}_${grade.student.toString()}`;
            gradeMap.set(key, grade);
        });

        const enrollmentsByCourse = enrollments.reduce((acc, enrollment) => {
            const key = enrollment.course.toString();
            if (!acc.has(key)) acc.set(key, []);
            acc.get(key).push({
                ...enrollment,
                grade: gradeMap.get(`${key}_${enrollment.student?._id?.toString()}`) || null,
            });
            return acc;
        }, new Map());

        const coursesWithEnrollment = courses.map((course) => {
            const enrichedEnrollments = enrollmentsByCourse.get(course._id.toString()) || [];
            return {
                ...course.toObject(),
                enrollmentCount: enrichedEnrollments.length,
                enrolledStudents: enrichedEnrollments,
            };
        });
        
        res.status(200).json(new ApiResponse(200, coursesWithEnrollment, 'Teacher courses fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get available courses for enrollment (for students)
export const getAvailableCourses = async (req, res, next) => {
    try {
        const { semester } = req.query;
        const studentId = req.user._id;
        
        // Get current semester if not specified
        let semesterId = semester;
        if (!semesterId) {
            const currentSemester = await Semester.findOne({ isCurrent: true, registrationOpen: true });
            if (!currentSemester) {
                return res.status(200).json(new ApiResponse(200, [], 'No open registration period'));
            }
            semesterId = currentSemester._id;
        }
        
        // Get courses for the semester
        const courses = await Course.find({
            semester: semesterId,
            isActive: true,
        })
            .populate('subject', 'name code credits department')
            .populate('semester', 'name year term')
            .populate('teacher', 'username email teacherProfile profileimage')
            .populate('prerequisites', 'name code');
        
        // Get student's enrollments
        const enrollments = await Enrollment.find({
            student: studentId,
            status: { $in: ['enrolled', 'graded', 'completed'] },
        }).populate('course');
        
        const enrolledCourseIds = enrollments.map(e => e.course._id.toString());
        const completedSubjectIds = enrollments
            .filter(e => e.status === 'completed')
            .map(e => e.course.subject?.toString());
        
        // Filter available courses
        const availableCourses = courses.map(course => {
            const isEnrolled = enrolledCourseIds.includes(course._id.toString());
            const hasCapacity = course.currentEnrollment < course.maxCapacity;
            const prerequisitesMet = course.prerequisites.every(prereq => 
                completedSubjectIds.includes(prereq._id.toString())
            );
            
            return {
                ...course.toObject(),
                isEnrolled,
                hasCapacity,
                prerequisitesMet,
                canEnroll: !isEnrolled && hasCapacity && prerequisitesMet,
            };
        });
        
        res.status(200).json(new ApiResponse(200, availableCourses, 'Available courses fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get enrolled students for a course (Teacher/Admin)
export const getCourseStudents = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const course = await Course.findById(id);
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check permission
        if (req.user.role !== 'admin' && course.teacher.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this course students');
        }
        
        const enrollments = await Enrollment.find({ 
            course: id,
            status: 'enrolled',
        })
            .populate('student', 'username email profileimage studentProfile')
            .sort({ 'student.username': 1 });
        
        res.status(200).json(new ApiResponse(200, enrollments, 'Course students fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Assign a teacher to an existing course (Admin only)
export const assignTeacherToCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { teacherId } = req.body;

        if (!teacherId) {
            throw new ApiError(400, 'teacherId is required');
        }

        const course = await Course.findById(id);
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        const teacher = await User.findById(teacherId);
        if (!teacher) {
            throw new ApiError(404, 'Teacher not found');
        }
        if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
            throw new ApiError(400, 'Selected user is not a teacher');
        }

        course.teacher = teacherId;
        await course.save();

        await course.populate([
            { path: 'subject', select: 'name code credits department' },
            { path: 'semester', select: 'name year term' },
            { path: 'teacher', select: 'username email teacherProfile profileimage' },
        ]);

        res.status(200).json(new ApiResponse(200, course, 'Teacher assigned to course'));
    } catch (error) {
        if (error.code === 11000) {
            return next(new ApiError(400, 'A course with the same subject, semester, section, and teacher already exists'));
        }
        next(error);
    }
};

// Remove the assigned teacher from a course (Admin only)
export const removeTeacherFromCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            throw new ApiError(404, 'Course not found');
        }

        if (!course.teacher) {
            return res.status(200).json(new ApiResponse(200, course, 'Course already has no teacher assigned'));
        }

        course.teacher = null;
        await course.save();

        await course.populate([
            { path: 'subject', select: 'name code credits department' },
            { path: 'semester', select: 'name year term' },
            { path: 'teacher', select: 'username email teacherProfile profileimage' },
        ]);

        res.status(200).json(new ApiResponse(200, course, 'Teacher removed from course'));
    } catch (error) {
        next(error);
    }
};


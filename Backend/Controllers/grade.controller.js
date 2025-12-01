import Grade from '../Models/Grade.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import Course from '../Models/Course.model.js';
import User from '../Models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import PDFDocument from 'pdfkit';

const gradeBuckets = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const buildDistribution = (grades = []) => {
    const distribution = gradeBuckets.reduce((acc, bucket) => {
        acc[bucket] = 0;
        return acc;
    }, {});

    grades.forEach(grade => {
        const letter = grade.letterGrade || 'F';
        if (distribution[letter] !== undefined) {
            distribution[letter] += 1;
        } else {
            distribution['F'] += 1;
        }
    });
    return distribution;
};

const averagePercentage = (grades = []) => {
    if (!grades.length) return 0;
    const total = grades.reduce((sum, grade) => sum + (grade.totalPercentage || 0), 0);
    return Math.round(total / grades.length);
};

const summarizeStudents = (grades = []) => {
    const studentMap = new Map();
    grades.forEach(grade => {
        if (!grade.student) return;
        const id = grade.student._id?.toString() || grade.student.toString();
        if (!studentMap.has(id)) {
            studentMap.set(id, {
                studentId: id,
                name: grade.student.username || grade.student.firstname || 'Student',
                email: grade.student.email,
                profileimage: grade.student.profileimage,
                totalPercentage: 0,
                grades: 0,
            });
        }
        const entry = studentMap.get(id);
        entry.totalPercentage += grade.totalPercentage || 0;
        entry.grades += 1;
    });

    return Array.from(studentMap.values()).map(entry => ({
        ...entry,
        average: entry.grades ? Math.round(entry.totalPercentage / entry.grades) : 0,
    }));
};

const buildCourseBreakdown = (courses = [], grades = []) => {
    const map = new Map();
    courses.forEach(course => {
        map.set(course._id.toString(), {
            courseId: course._id,
            name: course.subject?.name || 'Course',
            code: course.subject?.code,
            semester: course.semester?.name,
            totalGrades: 0,
            totalPercentage: 0,
        });
    });

    grades.forEach(grade => {
        const id = grade.course?.toString();
        if (!map.has(id)) return;
        const entry = map.get(id);
        entry.totalGrades += 1;
        entry.totalPercentage += grade.totalPercentage || 0;
    });

    return Array.from(map.values()).map(entry => ({
        ...entry,
        average: entry.totalGrades ? Math.round(entry.totalPercentage / entry.totalGrades) : 0,
    }));
};

const markEnrollmentAsGraded = async (enrollmentId) => {
    if (!enrollmentId) return;
    await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'graded' });
};

// Create or update grade directly (Teacher/Admin)
export const createGrade = async (req, res, next) => {
    try {
        const { student, course, grade, percentage, remarks } = req.body;
        
        if (!student || !course || !grade) {
            throw new ApiError(400, 'Student, course, and grade are required');
        }
        
        const courseDoc = await Course.findById(course).populate('subject semester');
        if (!courseDoc) {
            throw new ApiError(404, 'Course not found');
        }
        
        // Check permission
        if (req.user.role !== 'admin') {
            if (!courseDoc.teacher || courseDoc.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to assign grades for this course');
            }
        }
        
        // Get grade points for the letter grade
        const gradePoints = Grade.getGradePoints ? Grade.getGradePoints(grade) : {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0
        }[grade] || 0;
        
        const credits = courseDoc.subject?.credits || 3;
        const qualityPoints = gradePoints * credits;
        
        // Find existing enrollment
        const enrollment = await Enrollment.findOne({ student, course });
        
        // Check if grade already exists
        let gradeDoc = await Grade.findOne({ student, course });
        
        if (gradeDoc) {
            if (gradeDoc.status === 'finalized') {
                throw new ApiError(400, 'Grade has already been finalized and cannot be modified');
            }
            // Update existing
            gradeDoc.letterGrade = grade;
            gradeDoc.totalPercentage = percentage || 0;
            gradeDoc.gradePoints = gradePoints;
            gradeDoc.qualityPoints = qualityPoints;
            gradeDoc.status = 'graded';
            gradeDoc.gradedBy = req.user._id;
            gradeDoc.gradedAt = new Date();
            gradeDoc.remarks = remarks;
            await gradeDoc.save();
        } else {
            // Create new
            gradeDoc = await Grade.create({
                student,
                course,
                enrollment: enrollment?._id,
                semester: courseDoc.semester?._id,
                totalPercentage: percentage || 0,
                letterGrade: grade,
                gradePoints,
                credits,
                qualityPoints,
                status: 'graded',
                gradedBy: req.user._id,
                gradedAt: new Date(),
                remarks,
            });
        }

        await markEnrollmentAsGraded(enrollment?._id);
        
        res.status(201).json(new ApiResponse(201, gradeDoc, 'Grade created successfully'));
    } catch (error) {
        next(error);
    }
};

// Calculate and assign grade for an enrollment (Teacher)
export const assignGrade = async (req, res, next) => {
    try {
        const { enrollmentId } = req.params;
        const { remarks } = req.body;
        
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits' },
                    { path: 'semester', select: 'name year term' },
                ],
            });
        
        if (!enrollment) {
            throw new ApiError(404, 'Enrollment not found');
        }
        
        // Check permission
        if (req.user.role !== 'admin') {
            if (!enrollment.course.teacher || enrollment.course.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to assign grades');
            }
        }
        
        const course = enrollment.course;
        const scores = enrollment.scores;
        const policy = course.gradingPolicy;
        
        // Calculate weighted scores
        const componentScores = {
            assignments: 0,
            midterm: 0,
            final: 0,
            attendance: 0,
            participation: 0,
        };
        
        // Calculate assignments average
        if (scores.assignments && scores.assignments.length > 0) {
            const avgAssignment = scores.assignments.reduce((sum, a) => {
                return sum + (a.score / a.maxScore) * 100;
            }, 0) / scores.assignments.length;
            componentScores.assignments = (avgAssignment * policy.assignments) / 100;
        }
        
        // Midterm
        if (scores.midterm.score !== null) {
            componentScores.midterm = ((scores.midterm.score / scores.midterm.maxScore) * 100 * policy.midterm) / 100;
        }
        
        // Final
        if (scores.final.score !== null) {
            componentScores.final = ((scores.final.score / scores.final.maxScore) * 100 * policy.final) / 100;
        }
        
        // Attendance
        if (scores.attendance.total > 0) {
            const attendancePercent = (scores.attendance.present / scores.attendance.total) * 100;
            componentScores.attendance = (attendancePercent * policy.attendance) / 100;
        }
        
        // Participation
        if (scores.participation.score !== null) {
            componentScores.participation = ((scores.participation.score / scores.participation.maxScore) * 100 * policy.participation) / 100;
        }
        
        // Total percentage
        const totalPercentage = Math.round(
            componentScores.assignments +
            componentScores.midterm +
            componentScores.final +
            componentScores.attendance +
            componentScores.participation
        );
        
        // Get letter grade and grade points
        const { letter, points } = Grade.calculateLetterGrade(totalPercentage);
        const credits = course.subject.credits;
        const qualityPoints = points * credits;
        
        // Check if grade already exists
        let grade = await Grade.findOne({
            student: enrollment.student,
            course: course._id,
        });
        
        if (grade) {
            if (grade.status === 'finalized') {
                throw new ApiError(400, 'Grade has already been finalized and cannot be modified');
            }
            // Update existing grade
            grade.componentScores = componentScores;
            grade.totalPercentage = totalPercentage;
            grade.letterGrade = letter;
            grade.gradePoints = points;
            grade.qualityPoints = qualityPoints;
            grade.status = 'graded';
            grade.gradedBy = req.user._id;
            grade.gradedAt = new Date();
            grade.remarks = remarks;
            await grade.save();
        } else {
            // Create new grade
            grade = await Grade.create({
                student: enrollment.student,
                course: course._id,
                enrollment: enrollment._id,
                semester: course.semester._id,
                componentScores,
                totalPercentage,
                letterGrade: letter,
                gradePoints: points,
                credits,
                qualityPoints,
                status: 'graded',
                gradedBy: req.user._id,
                gradedAt: new Date(),
                remarks,
            });
        }
        
        await grade.populate([
            { path: 'student', select: 'username email' },
            { path: 'course', populate: { path: 'subject', select: 'name code' } },
        ]);
        
        await markEnrollmentAsGraded(enrollment._id);
        
        res.status(200).json(new ApiResponse(200, grade, 'Grade assigned successfully'));
    } catch (error) {
        next(error);
    }
};

// Finalize grade (Admin/Teacher)
export const finalizeGrade = async (req, res, next) => {
    try {
        const { gradeId } = req.params;
        
        const grade = await Grade.findById(gradeId).populate('course');
        
        if (!grade) {
            throw new ApiError(404, 'Grade not found');
        }
        
        // Check permission
        if (req.user.role !== 'admin') {
            if (!grade.course.teacher || grade.course.teacher.toString() !== req.user._id.toString()) {
                throw new ApiError(403, 'Not authorized to finalize grades');
            }
        }
        
        if (grade.status === 'finalized') {
            throw new ApiError(400, 'Grade is already finalized');
        }
        
        grade.status = 'finalized';
        grade.finalizedAt = new Date();
        await grade.save();
        
        // Update enrollment status
        await Enrollment.findByIdAndUpdate(grade.enrollment, {
            status: grade.letterGrade === 'F' ? 'failed' : 'completed',
        });
        
        // Update student's CGPA
        const gpaData = await Grade.calculateGPA(grade.student);
        await User.findByIdAndUpdate(grade.student, {
            'studentProfile.cgpa': gpaData.gpa,
            'studentProfile.totalCredits': gpaData.totalCredits,
        });
        
        res.status(200).json(new ApiResponse(200, grade, 'Grade finalized successfully'));
    } catch (error) {
        next(error);
    }
};

// Get student's grades
export const getMyGrades = async (req, res, next) => {
    try {
        const studentId = req.user._id;
        const { semester } = req.query;
        
        const query = { student: studentId };
        if (semester) {
            query.semester = semester;
        }
        
        const grades = await Grade.find(query)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits department' },
                    { path: 'teacher', select: 'username' },
                ],
            })
            .populate('semester', 'name year term')
            .sort({ 'semester.year': -1, 'semester.term': -1 });
        
        // Calculate GPA
        const gpaData = semester
            ? await Grade.calculateGPA(studentId, semester)
            : await Grade.calculateGPA(studentId);
        
        res.status(200).json(new ApiResponse(200, {
            grades,
            gpa: gpaData,
        }, 'Grades fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get grade by ID
export const getGradeById = async (req, res, next) => {
    try {
        const grade = await Grade.findById(req.params.id)
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits' },
                    { path: 'teacher', select: 'username email' },
                ],
            })
            .populate('semester', 'name year term')
            .populate('student', 'username email studentProfile')
            .populate('gradedBy', 'username');
        
        if (!grade) {
            throw new ApiError(404, 'Grade not found');
        }
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            req.user.role !== 'teacher' &&
            grade.student._id.toString() !== req.user._id.toString()
        ) {
            throw new ApiError(403, 'Not authorized to view this grade');
        }
        
        res.status(200).json(new ApiResponse(200, grade, 'Grade fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get grades for a course (Teacher)
export const getCourseGrades = async (req, res, next) => {
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
            throw new ApiError(403, 'Not authorized to view course grades');
        }
        
        const grades = await Grade.find({ course: courseId })
            .populate('student', 'username email profileimage studentProfile')
            .populate('enrollment')
            .sort({ totalPercentage: -1 });
        
        // Calculate statistics
        const stats = {
            total: grades.length,
            average: grades.length > 0
                ? Math.round(grades.reduce((sum, g) => sum + g.totalPercentage, 0) / grades.length)
                : 0,
            distribution: {
                A: grades.filter(g => g.letterGrade.startsWith('A')).length,
                B: grades.filter(g => g.letterGrade.startsWith('B')).length,
                C: grades.filter(g => g.letterGrade.startsWith('C')).length,
                D: grades.filter(g => g.letterGrade.startsWith('D')).length,
                F: grades.filter(g => g.letterGrade === 'F').length,
            },
        };
        
        res.status(200).json(new ApiResponse(200, { grades, stats }, 'Course grades fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Generate transcript PDF
export const generateTranscript = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.user._id;
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            req.user._id.toString() !== studentId
        ) {
            throw new ApiError(403, 'Not authorized to generate this transcript');
        }
        
        const student = await User.findById(studentId).select('-password');
        if (!student) {
            throw new ApiError(404, 'Student not found');
        }
        
        const grades = await Grade.find({
            student: studentId,
            status: 'finalized',
        })
            .populate({
                path: 'course',
                populate: { path: 'subject', select: 'name code credits' },
            })
            .populate('semester', 'name year term')
            .sort({ 'semester.year': 1, 'semester.term': 1 });
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=transcript_${student.username}_${Date.now()}.pdf`
        );
        
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('OFFICIAL TRANSCRIPT', { align: 'center' });
        doc.moveDown();
        
        // Student Info
        doc.fontSize(12).font('Helvetica');
        doc.text(`Student Name: ${student.username}`);
        doc.text(`Email: ${student.email}`);
        if (student.studentProfile?.rollNumber) {
            doc.text(`Roll Number: ${student.studentProfile.rollNumber}`);
        }
        if (student.studentProfile?.program) {
            doc.text(`Program: ${student.studentProfile.program}`);
        }
        doc.text(`Generated: ${new Date().toLocaleDateString()}`);
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        
        // Group grades by semester
        const gradesBySemester = {};
        grades.forEach(grade => {
            const semKey = grade.semester.name;
            if (!gradesBySemester[semKey]) {
                gradesBySemester[semKey] = [];
            }
            gradesBySemester[semKey].push(grade);
        });
        
        // Print grades by semester
        let cumulativeCredits = 0;
        let cumulativePoints = 0;
        
        for (const [semName, semGrades] of Object.entries(gradesBySemester)) {
            doc.fontSize(14).font('Helvetica-Bold').text(semName);
            doc.moveDown(0.5);
            
            // Table header
            doc.fontSize(10).font('Helvetica-Bold');
            const startY = doc.y;
            doc.text('Code', 50, startY, { width: 80 });
            doc.text('Course Name', 130, startY, { width: 200 });
            doc.text('Credits', 330, startY, { width: 50 });
            doc.text('Grade', 380, startY, { width: 50 });
            doc.text('Points', 430, startY, { width: 50 });
            
            doc.moveDown();
            
            // Grades
            let semCredits = 0;
            let semPoints = 0;
            
            doc.font('Helvetica').fontSize(10);
            semGrades.forEach(grade => {
                const y = doc.y;
                doc.text(grade.course.subject.code, 50, y, { width: 80 });
                doc.text(grade.course.subject.name, 130, y, { width: 200 });
                doc.text(grade.credits.toString(), 330, y, { width: 50 });
                doc.text(grade.letterGrade, 380, y, { width: 50 });
                doc.text(grade.gradePoints.toFixed(2), 430, y, { width: 50 });
                doc.moveDown();
                
                semCredits += grade.credits;
                semPoints += grade.qualityPoints;
            });
            
            const semGPA = semCredits > 0 ? (semPoints / semCredits) : 0;
            cumulativeCredits += semCredits;
            cumulativePoints += semPoints;
            
            doc.font('Helvetica-Bold');
            doc.text(`Semester GPA: ${semGPA.toFixed(2)} | Credits: ${semCredits}`, 50);
            doc.moveDown();
        }
        
        // Cumulative GPA
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        
        const cgpa = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits) : 0;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`CUMULATIVE GPA: ${cgpa.toFixed(2)}`);
        doc.text(`TOTAL CREDITS: ${cumulativeCredits}`);
        
        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica');
        doc.text('This is a computer-generated document.', { align: 'center' });
        
        doc.end();
    } catch (error) {
        next(error);
    }
};

// Get grade analytics for a student
export const getGradeAnalytics = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.user._id;
        
        // Check permission
        if (
            req.user.role !== 'admin' &&
            req.user.role !== 'teacher' &&
            req.user._id.toString() !== studentId
        ) {
            throw new ApiError(403, 'Not authorized to view these analytics');
        }
        
        const grades = await Grade.find({ student: studentId })
            .populate({
                path: 'course',
                populate: { path: 'subject', select: 'name code credits department' },
            })
            .populate('semester', 'name year term')
            .sort({ 'semester.year': 1, 'semester.term': 1 });
        
        // GPA over time
        const gradesBySemester = {};
        
        grades.forEach(grade => {
            const semKey = grade.semester.name;
            if (!gradesBySemester[semKey]) {
                gradesBySemester[semKey] = { credits: 0, points: 0 };
            }
            gradesBySemester[semKey].credits += grade.credits;
            gradesBySemester[semKey].points += grade.qualityPoints;
        });
        
        const gpaHistory = Object.entries(gradesBySemester).map(([sem, data]) => ({
            semester: sem,
            gpa: data.credits > 0 ? Math.round((data.points / data.credits) * 100) / 100 : 0,
            credits: data.credits,
        }));
        
        // Performance by department
        const byDepartment = {};
        grades.forEach(grade => {
            const dept = grade.course.subject.department;
            if (!byDepartment[dept]) {
                byDepartment[dept] = { total: 0, sum: 0 };
            }
            byDepartment[dept].total++;
            byDepartment[dept].sum += grade.totalPercentage;
        });
        
        const departmentPerformance = Object.entries(byDepartment).map(([dept, data]) => ({
            department: dept,
            average: Math.round(data.sum / data.total),
            courses: data.total,
        }));
        
        // Grade distribution
        const distribution = {
            'A+': 0, A: 0, 'A-': 0,
            'B+': 0, B: 0, 'B-': 0,
            'C+': 0, C: 0, 'C-': 0,
            'D+': 0, D: 0, 'D-': 0,
            F: 0,
        };
        
        grades.forEach(grade => {
            if (distribution.hasOwnProperty(grade.letterGrade)) {
                distribution[grade.letterGrade]++;
            }
        });
        
        // Calculate overall GPA
        const overallGPA = await Grade.calculateGPA(studentId);
        
        res.status(200).json(new ApiResponse(200, {
            overallGPA,
            gpaHistory,
            departmentPerformance,
            distribution,
            totalCourses: grades.length,
        }, 'Analytics fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Teacher grade analytics
export const getTeacherGradeAnalytics = async (req, res, next) => {
    try {
        const teacherId = req.user.role === 'teacher' ? req.user._id : req.query.teacherId;
        if (!teacherId) {
            throw new ApiError(400, 'Teacher id is required');
        }

        const courses = await Course.find({ teacher: teacherId })
            .populate('subject', 'name code')
            .populate('semester', 'name');

        if (!courses.length) {
            return res.status(200).json(new ApiResponse(200, {
                totalCourses: 0,
                totalGrades: 0,
                averagePercentage: 0,
                distribution: buildDistribution(),
                courseBreakdown: [],
                topStudents: [],
                recentGrades: [],
            }, 'No courses found for teacher'));
        }

        const courseIds = courses.map(course => course._id);
        const grades = await Grade.find({ course: { $in: courseIds } })
            .populate('student', 'username email profileimage')
            .sort({ gradedAt: -1 });

        const distribution = buildDistribution(grades);
        const courseBreakdown = buildCourseBreakdown(courses, grades);
        const studentSummaries = summarizeStudents(grades);

        const courseLookup = courses.reduce((acc, course) => {
            acc[course._id.toString()] = {
                name: course.subject?.name,
                code: course.subject?.code,
                semester: course.semester?.name,
            };
            return acc;
        }, {});

        const recentGrades = grades.slice(0, 10).map(grade => ({
            student: grade.student,
            letterGrade: grade.letterGrade,
            totalPercentage: grade.totalPercentage,
            course: courseLookup[grade.course?.toString()],
            gradedAt: grade.gradedAt,
        }));

        res.status(200).json(new ApiResponse(200, {
            totalCourses: courses.length,
            totalGrades: grades.length,
            averagePercentage: averagePercentage(grades),
            distribution,
            courseBreakdown,
            topStudents: studentSummaries.sort((a, b) => b.average - a.average).slice(0, 5),
            recentGrades,
        }, 'Teacher analytics fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Admin grade analytics
export const getAdminGradeAnalytics = async (req, res, next) => {
    try {
        const grades = await Grade.find()
            .populate('student', 'username email profileimage')
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code' },
                    { path: 'semester', select: 'name' },
                    { path: 'teacher', select: 'username email profileimage' },
                ],
            })
            .sort({ gradedAt: -1 });

        const courses = await Course.find()
            .populate('subject', 'name code')
            .populate('semester', 'name');

        const distribution = buildDistribution(grades);
        const courseBreakdown = buildCourseBreakdown(courses, grades);
        const studentSummaries = summarizeStudents(grades);

        const teacherLeaderboard = grades.reduce((acc, grade) => {
            const teacher = grade.course?.teacher;
            if (!teacher) return acc;
            const id = teacher._id?.toString() || teacher.toString();
            if (!acc.has(id)) {
                acc.set(id, {
                    teacherId: id,
                    name: teacher.username || 'Teacher',
                    email: teacher.email,
                    totalGrades: 0,
                });
            }
            const entry = acc.get(id);
            entry.totalGrades += 1;
            return acc;
        }, new Map());

        const recentGrades = grades.slice(0, 15).map(grade => ({
            student: grade.student,
            course: grade.course,
            letterGrade: grade.letterGrade,
            totalPercentage: grade.totalPercentage,
            gradedAt: grade.gradedAt,
        }));

        res.status(200).json(new ApiResponse(200, {
            totalGrades: grades.length,
            averagePercentage: averagePercentage(grades),
            distribution,
            courseBreakdown,
            topStudents: studentSummaries.sort((a, b) => b.average - a.average).slice(0, 10),
            teacherLeaderboard: Array.from(teacherLeaderboard.values()).sort((a, b) => b.totalGrades - a.totalGrades).slice(0, 10),
            recentGrades,
        }, 'Admin grade analytics fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Bulk finalize grades for a course
export const bulkFinalizeGrades = async (req, res, next) => {
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
            throw new ApiError(403, 'Not authorized to finalize grades');
        }
        
        // Finalize all graded but not finalized grades
        const result = await Grade.updateMany(
            { course: courseId, status: 'graded' },
            {
                status: 'finalized',
                finalizedAt: new Date(),
            }
        );
        
        // Update enrollment statuses
        const grades = await Grade.find({ course: courseId, status: 'finalized' });
        
        for (const grade of grades) {
            await Enrollment.findByIdAndUpdate(grade.enrollment, {
                status: grade.letterGrade === 'F' ? 'failed' : 'completed',
            });
            
            // Update student CGPA
            const gpaData = await Grade.calculateGPA(grade.student);
            await User.findByIdAndUpdate(grade.student, {
                'studentProfile.cgpa': gpaData.gpa,
                'studentProfile.totalCredits': gpaData.totalCredits,
            });
        }
        
        res.status(200).json(new ApiResponse(200, {
            finalized: result.modifiedCount,
        }, 'Grades finalized successfully'));
    } catch (error) {
        next(error);
    }
};


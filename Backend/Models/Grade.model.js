import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Student is required"],
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course is required"],
    },
    enrollment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
        required: [true, "Enrollment is required"],
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
        required: [true, "Semester is required"],
    },
    // Weighted scores (after applying grading policy)
    componentScores: {
        assignments: { type: Number, default: 0 }, // weighted score
        midterm: { type: Number, default: 0 },
        final: { type: Number, default: 0 },
        attendance: { type: Number, default: 0 },
        participation: { type: Number, default: 0 },
    },
    // Total percentage (0-100)
    totalPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    // Letter grade
    letterGrade: {
        type: String,
        required: true,
        enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "W", "I", "P", "NP"],
    },
    // Grade points (for GPA calculation)
    gradePoints: {
        type: Number,
        required: true,
        min: 0,
        max: 4.0,
    },
    // Credits for this course
    credits: {
        type: Number,
        required: true,
        min: 1,
    },
    // Quality points (gradePoints * credits)
    qualityPoints: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "graded", "finalized", "appealed"],
        default: "pending",
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    gradedAt: {
        type: Date,
    },
    finalizedAt: {
        type: Date,
    },
    remarks: {
        type: String,
        trim: true,
        maxLength: [500, "Remarks must be at most 500 characters"],
    },
}, { timestamps: true });

// Compound index for unique grade per student-course
gradeSchema.index({ student: 1, course: 1 }, { unique: true });
gradeSchema.index({ student: 1, semester: 1 });
gradeSchema.index({ course: 1 });

// Static method to calculate letter grade from percentage
gradeSchema.statics.calculateLetterGrade = function(percentage) {
    if (percentage >= 97) return { letter: "A+", points: 4.0 };
    if (percentage >= 93) return { letter: "A", points: 4.0 };
    if (percentage >= 90) return { letter: "A-", points: 3.7 };
    if (percentage >= 87) return { letter: "B+", points: 3.3 };
    if (percentage >= 83) return { letter: "B", points: 3.0 };
    if (percentage >= 80) return { letter: "B-", points: 2.7 };
    if (percentage >= 77) return { letter: "C+", points: 2.3 };
    if (percentage >= 73) return { letter: "C", points: 2.0 };
    if (percentage >= 70) return { letter: "C-", points: 1.7 };
    if (percentage >= 67) return { letter: "D+", points: 1.3 };
    if (percentage >= 63) return { letter: "D", points: 1.0 };
    if (percentage >= 60) return { letter: "D-", points: 0.7 };
    return { letter: "F", points: 0.0 };
};

// Static method to calculate GPA
gradeSchema.statics.calculateGPA = async function(studentId, semesterId = null) {
    const query = { student: studentId, status: 'finalized' };
    if (semesterId) {
        query.semester = semesterId;
    }
    
    const grades = await this.find(query);
    
    if (grades.length === 0) {
        return { gpa: 0, totalCredits: 0, totalQualityPoints: 0 };
    }
    
    const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
    const totalQualityPoints = grades.reduce((sum, g) => sum + g.qualityPoints, 0);
    const gpa = totalCredits > 0 ? (totalQualityPoints / totalCredits) : 0;
    
    return {
        gpa: Math.round(gpa * 100) / 100,
        totalCredits,
        totalQualityPoints: Math.round(totalQualityPoints * 100) / 100,
    };
};

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;


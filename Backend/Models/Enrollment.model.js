import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
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
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
        required: [true, "Semester is required"],
    },
    enrollmentDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["enrolled", "graded", "dropped", "completed", "failed", "withdrawn"],
        default: "enrolled",
    },
    progress: {
        completedWeeks: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalWeeks: {
            type: Number,
            default: 16,
        },
        attendancePercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        lastAccessed: {
            type: Date,
            default: Date.now,
        },
    },
    // Track individual component scores
    scores: {
        assignments: [{
            name: String,
            score: Number,
            maxScore: Number,
            submittedAt: Date,
        }],
        midterm: {
            score: { type: Number, default: null },
            maxScore: { type: Number, default: 100 },
        },
        final: {
            score: { type: Number, default: null },
            maxScore: { type: Number, default: 100 },
        },
        attendance: {
            present: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        participation: {
            score: { type: Number, default: null },
            maxScore: { type: Number, default: 100 },
        },
    },
    dropReason: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

// Compound index for unique enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, semester: 1 });
enrollmentSchema.index({ course: 1 });

// Virtual for progress percentage
enrollmentSchema.virtual('progressPercentage').get(function() {
    if (this.progress.totalWeeks === 0) return 0;
    return Math.round((this.progress.completedWeeks / this.progress.totalWeeks) * 100);
});

enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;


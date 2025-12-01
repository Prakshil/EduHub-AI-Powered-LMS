import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        minLength: [3, "Title must be at least 3 characters"],
        maxLength: [200, "Title must be at most 200 characters"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxLength: [5000, "Description must be at most 5000 characters"],
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course is required"],
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Teacher is required"],
    },
    type: {
        type: String,
        enum: ["assignment", "midterm", "final"],
        default: "assignment",
    },
    dueDate: {
        type: Date,
        required: [true, "Due date is required"],
    },
    maxScore: {
        type: Number,
        required: [true, "Maximum score is required"],
        min: [1, "Maximum score must be at least 1"],
        default: 100,
    },
    attachments: [{
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["pdf", "doc", "docx", "txt", "image", "other"],
        },
        size: {
            type: Number, // in bytes
        },
    }],
    instructions: {
        type: String,
        trim: true,
        maxLength: [2000, "Instructions must be at most 2000 characters"],
    },
    // MCQ Questions (for exams generated with AI)
    questions: [{
        question: {
            type: String,
            required: true,
        },
        options: {
            A: { type: String, required: true },
            B: { type: String, required: true },
            C: { type: String, required: true },
            D: { type: String, required: true },
        },
        correctAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
            required: true,
        },
        explanation: {
            type: String,
        },
        points: {
            type: Number,
            default: 1,
        },
    }],
    isPublished: {
        type: Boolean,
        default: false,
    },
    publishedAt: {
        type: Date,
    },
    // Track submissions
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        files: [{
            name: String,
            url: String,
            type: String,
            size: Number,
        }],
        score: {
            type: Number,
            default: null,
        },
        feedback: {
            type: String,
            trim: true,
        },
        gradedAt: {
            type: Date,
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    }],
    // Statistics
    totalSubmissions: {
        type: Number,
        default: 0,
    },
    gradedSubmissions: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

// Indexes
assignmentSchema.index({ course: 1, type: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ isPublished: 1, publishedAt: -1 });
assignmentSchema.index({ "submissions.student": 1 });

// Virtual for submission count
assignmentSchema.virtual('submissionCount').get(function() {
    return this.submissions ? this.submissions.length : 0;
});

assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;


import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: [true, "Exam is required"],
    },
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
    // Student's answers for each question
    answers: [{
        questionIndex: {
            type: Number,
            required: true,
        },
        selectedAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D', null],
        },
        isCorrect: {
            type: Boolean,
            default: false,
        },
        points: {
            type: Number,
            default: 0,
        },
    }],
    // Overall score
    score: {
        type: Number,
        default: 0,
        min: 0,
    },
    maxScore: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    // Time tracking
    startedAt: {
        type: Date,
        default: Date.now,
    },
    submittedAt: {
        type: Date,
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0,
    },
    // Status
    status: {
        type: String,
        enum: ['in-progress', 'submitted', 'graded'],
        default: 'in-progress',
    },
    // Auto-graded flag
    isAutoGraded: {
        type: Boolean,
        default: true,
    },
    // Teacher feedback (optional)
    feedback: {
        type: String,
        trim: true,
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    gradedAt: {
        type: Date,
    },
}, { timestamps: true });

// Indexes for efficient queries
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });
examResultSchema.index({ student: 1, course: 1 });
examResultSchema.index({ exam: 1 });
examResultSchema.index({ course: 1 });
examResultSchema.index({ submittedAt: -1 });

// Virtual for student name
examResultSchema.virtual('studentName', {
    ref: 'User',
    localField: 'student',
    foreignField: '_id',
    justOne: true,
    select: 'username email'
});

// Method to calculate score
examResultSchema.methods.calculateScore = function() {
    let totalScore = 0;
    let totalPoints = 0;
    
    this.answers.forEach(answer => {
        if (answer.isCorrect) {
            totalScore += answer.points || 1;
        }
        totalPoints += answer.points || 1;
    });
    
    this.score = totalScore;
    this.maxScore = totalPoints || this.maxScore;
    this.percentage = this.maxScore > 0 ? Math.round((totalScore / this.maxScore) * 100) : 0;
    
    return {
        score: totalScore,
        maxScore: totalPoints || this.maxScore,
        percentage: this.percentage
    };
};

examResultSchema.set('toJSON', { virtuals: true });
examResultSchema.set('toObject', { virtuals: true });

const ExamResult = mongoose.model("ExamResult", examResultSchema);
export default ExamResult;


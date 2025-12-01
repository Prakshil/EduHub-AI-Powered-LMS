import mongoose from "mongoose";

const syllabusItemSchema = new mongoose.Schema({
    week: {
        type: Number,
        required: true,
    },
    topic: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    materials: [{
        type: String,
        trim: true,
    }],
}, { _id: false });

const courseSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: [true, "Subject is required"],
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
        required: [true, "Semester is required"],
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    section: {
        type: String,
        trim: true,
        uppercase: true,
        default: "A",
        // e.g., "A", "B", "C"
    },
    maxCapacity: {
        type: Number,
        required: [true, "Maximum capacity is required"],
        min: [1, "Capacity must be at least 1"],
        max: [500, "Capacity must be at most 500"],
        default: 30,
    },
    currentEnrollment: {
        type: Number,
        default: 0,
        min: 0,
    },
    schedule: {
        days: [{
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        }],
        startTime: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"],
        },
        endTime: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"],
        },
        room: {
            type: String,
            trim: true,
        },
    },
    syllabus: [syllabusItemSchema],
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
    }],
    description: {
        type: String,
        trim: true,
        maxLength: [1000, "Description must be at most 1000 characters"],
    },
    gradingPolicy: {
        assignments: { type: Number, default: 20 }, // percentage
        midterm: { type: Number, default: 25 },
        final: { type: Number, default: 35 },
        attendance: { type: Number, default: 10 },
        participation: { type: Number, default: 10 },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming",
    },
}, { timestamps: true });

// Compound index for unique course per subject-semester-section-teacher
courseSchema.index({ subject: 1, semester: 1, section: 1, teacher: 1 }, { unique: true });
courseSchema.index({ teacher: 1 });
courseSchema.index({ semester: 1 });

// Validate grading policy totals to 100
courseSchema.pre('save', function(next) {
    const policy = this.gradingPolicy;
    const total = policy.assignments + policy.midterm + policy.final + policy.attendance + policy.participation;
    if (total !== 100) {
        next(new Error(`Grading policy must total 100%, currently: ${total}%`));
    }
    next();
});

const Course = mongoose.model("Course", courseSchema);
export default Course;


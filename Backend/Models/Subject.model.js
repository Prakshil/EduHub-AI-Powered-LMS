import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Subject name is required"],
        trim: true,
        minLength: [2, "Subject name must be at least 2 characters"],
        maxLength: [100, "Subject name must be at most 100 characters"],
    },
    code: {
        type: String,
        required: [true, "Subject code is required"],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{2,4}\d{3,4}$/, "Subject code must be in format like CS101, MATH201"],
    },
    description: {
        type: String,
        trim: true,
        maxLength: [500, "Description must be at most 500 characters"],
    },
    credits: {
        type: Number,
        required: [true, "Credits are required"],
        min: [1, "Credits must be at least 1"],
        max: [6, "Credits must be at most 6"],
    },
    department: {
        type: String,
        required: [true, "Department is required"],
        trim: true,
        enum: ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Economics", "Business", "Engineering", "Arts", "Other"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

subjectSchema.index({ name: 'text', code: 'text' });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;


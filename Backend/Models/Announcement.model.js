import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        minLength: [3, "Title must be at least 3 characters"],
        maxLength: [200, "Title must be at most 200 characters"],
    },
    content: {
        type: String,
        required: [true, "Content is required"],
        trim: true,
        maxLength: [5000, "Content must be at most 5000 characters"],
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: ["General", "Exam", "Holiday", "Event", "Academic", "Administrative", "Emergency"],
        default: "General",
    },
    priority: {
        type: String,
        enum: ["low", "normal", "high", "urgent"],
        default: "normal",
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"],
    },
    // Target audience
    audience: {
        type: String,
        enum: ["all", "students", "teachers", "admins"],
        default: "all",
    },
    // Specific course (optional - for course-specific announcements)
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },
    // Specific semester (optional)
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    publishAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
    },
    attachments: [{
        name: String,
        url: String,
        type: String, // pdf, image, document
    }],
    // Track who has read the announcement
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        readAt: {
            type: Date,
            default: Date.now,
        },
    }],
    // Notification settings
    sendEmail: {
        type: Boolean,
        default: false,
    },
    emailSentAt: {
        type: Date,
    },
}, { timestamps: true });

announcementSchema.index({ category: 1 });
announcementSchema.index({ author: 1 });
announcementSchema.index({ course: 1 });
announcementSchema.index({ publishAt: -1 });
announcementSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
    return this.readBy ? this.readBy.length : 0;
});

announcementSchema.set('toJSON', { virtuals: true });
announcementSchema.set('toObject', { virtuals: true });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;


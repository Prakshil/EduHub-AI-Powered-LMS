import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Semester name is required"],
        trim: true,
        // e.g., "Fall 2024", "Spring 2025", "Summer 2024"
    },
    year: {
        type: Number,
        required: [true, "Year is required"],
        min: [2000, "Year must be at least 2000"],
        max: [2100, "Year must be at most 2100"],
    },
    term: {
        type: String,
        required: [true, "Term is required"],
        enum: ["Fall", "Spring", "Summer", "Winter"],
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"],
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"],
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    isCurrent: {
        type: Boolean,
        default: false,
    },
    registrationOpen: {
        type: Boolean,
        default: false,
    },
    registrationDeadline: {
        type: Date,
    },
}, { timestamps: true });

// Ensure only one semester can be current at a time
semesterSchema.pre('save', async function(next) {
    if (this.isCurrent) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isCurrent: false }
        );
    }
    next();
});

// Virtual for formatted name
semesterSchema.virtual('fullName').get(function() {
    return `${this.term} ${this.year}`;
});

semesterSchema.set('toJSON', { virtuals: true });
semesterSchema.set('toObject', { virtuals: true });

const Semester = mongoose.model("Semester", semesterSchema);
export default Semester;


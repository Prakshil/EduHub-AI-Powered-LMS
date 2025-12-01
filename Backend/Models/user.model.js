import mongoose from 'mongoose';
import validator from 'validator';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email format, Please Check again.');
            }
        }
    },
    password: {
        type: String,
        required: true,
        select: false // do not return hashed password by default
    },
    phone:{
        type: Number,
        trim: true
    },
    dob:{
        type: Date,
        required: true,
        default: Date.now
    },
    age:{
        type: Number,
        min:18
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        trim: true,
        lowercase: true,
        enum: {
            values: ["male", "female", "other"],
            message: "Gender must be 'male', 'female' or 'other'",
        },
    },
    address: {
        type: String,
        // required: true,
        trim: true
    },
    skills: {
        type: [String],
        default: []
    },
    profileimage: {
        type: String,
        // required: true,
        default: 'https://imgs.search.brave.com/FWHa9QRttw1JSSHVgTxnaCCKeCisCTYKWv3idxlo3AI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c3ZncmVwby5jb20v/c2hvdy8zMzU0NTUv/cHJvZmlsZS1kZWZh/dWx0LnN2Zw'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'teacher'],
        default: 'user'
    },
    // Teacher-specific fields
    teacherProfile: {
        department: {
            type: String,
            trim: true,
        },
        designation: {
            type: String,
            trim: true,
            // e.g., "Professor", "Associate Professor", "Assistant Professor", "Lecturer"
        },
        specialization: [{
            type: String,
            trim: true,
        }],
        qualification: {
            type: String,
            trim: true,
        },
        joiningDate: {
            type: Date,
        },
        officeRoom: {
            type: String,
            trim: true,
        },
        officeHours: {
            type: String,
            trim: true,
        },
    },
    // Student-specific fields
    studentProfile: {
        rollNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },
        batch: {
            type: String,
            trim: true,
            // e.g., "2023-2027"
        },
        program: {
            type: String,
            trim: true,
            // e.g., "B.Tech Computer Science"
        },
        currentSemester: {
            type: Number,
            min: 1,
            max: 12,
        },
        semesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Semester",
        },
        semesterName: {
            type: String,
            trim: true,
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 4.0,
            default: 0,
        },
        totalCredits: {
            type: Number,
            default: 0,
        },
        admissionDate: {
            type: Date,
        },
    }
}, {
    timestamps: true
}); 

export default mongoose.model("User", userSchema);
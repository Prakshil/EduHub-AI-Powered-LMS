import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../Models/user.model.js';

dotenv.config();

const { MONGODB_URL, DB_NAME } = process.env;

const connectToDatabase = async () => {
    if (!MONGODB_URL) {
        throw new Error('MONGODB_URL is not defined in .env');
    }

    await mongoose.connect(MONGODB_URL, {
        dbName: DB_NAME || 'studentMS',
        serverSelectionTimeoutMS: 15000,
        family: 4,
    });
};

const createTeacher = async () => {
    try {
        await connectToDatabase();
        console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

        const teacherData = {
            username: 'teacher1',
            email: 'teacher@example.com',
            password: await bcrypt.hash('teacher123', 10),
            gender: 'male',
            dob: new Date('1985-05-15'),
            age: 39,
            role: 'teacher',
            teacherProfile: {
                department: 'Computer Science',
                designation: 'Associate Professor',
                specialization: ['Data Structures', 'Algorithms', 'Web Development'],
                qualification: 'Ph.D. in Computer Science',
                joiningDate: new Date('2020-08-01'),
                officeRoom: 'CS-205',
                officeHours: 'Mon, Wed: 2:00 PM - 4:00 PM',
            },
        };

        // Check if teacher already exists
        const existingTeacher = await User.findOne({ email: teacherData.email });
        if (existingTeacher) {
            console.log('Teacher already exists!');
            console.log('Email:', existingTeacher.email);
            console.log('Role:', existingTeacher.role);
            process.exit(0);
        }

        const teacher = await User.create(teacherData);
        console.log('Teacher created successfully!');
        console.log('Email:', teacher.email);
        console.log('Password: teacher123');
        console.log('Role:', teacher.role);
        console.log('Department:', teacher.teacherProfile.department);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating teacher:', error);
        process.exit(1);
    }
};

createTeacher();


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

const teachers = [
  {
    username: 'prof_alex',
    email: 'alex.roberts@example.com',
    gender: 'male',
    dob: new Date('1982-04-18'),
    age: 42,
    teacherProfile: {
      department: 'Computer Science',
      designation: 'Senior Lecturer',
      specialization: ['Machine Learning', 'Data Mining'],
      qualification: 'Ph.D. Computer Science',
      joiningDate: new Date('2018-07-10'),
      officeRoom: 'CS-302',
      officeHours: 'Tue & Thu • 10:00-12:00',
    },
  },
  {
    username: 'prof_julia',
    email: 'julia.martin@example.com',
    gender: 'female',
    dob: new Date('1987-11-02'),
    age: 37,
    teacherProfile: {
      department: 'Information Technology',
      designation: 'Assistant Professor',
      specialization: ['Web Development', 'UX Engineering'],
      qualification: 'M.Tech Information Systems',
      joiningDate: new Date('2019-01-15'),
      officeRoom: 'IT-214',
      officeHours: 'Mon & Wed • 14:00-16:00',
    },
  },
  {
    username: 'prof_samir',
    email: 'samir.ali@example.com',
    gender: 'male',
    dob: new Date('1979-09-25'),
    age: 45,
    teacherProfile: {
      department: 'Computer Science',
      designation: 'Associate Professor',
      specialization: ['Distributed Systems', 'Cloud Computing'],
      qualification: 'Ph.D. Distributed Systems',
      joiningDate: new Date('2015-03-01'),
      officeRoom: 'CS-110',
      officeHours: 'Fri • 10:00-13:00',
    },
  },
  {
    username: 'prof_lena',
    email: 'lena.hsu@example.com',
    gender: 'female',
    dob: new Date('1990-06-12'),
    age: 34,
    teacherProfile: {
      department: 'Mathematics',
      designation: 'Assistant Professor',
      specialization: ['Discrete Math', 'Statistics'],
      qualification: 'Ph.D. Applied Mathematics',
      joiningDate: new Date('2021-02-11'),
      officeRoom: 'MTH-109',
      officeHours: 'Tue & Thu • 09:00-11:00',
    },
  },
  {
    username: 'prof_diego',
    email: 'diego.ramos@example.com',
    gender: 'male',
    dob: new Date('1984-01-07'),
    age: 40,
    teacherProfile: {
      department: 'Electronics',
      designation: 'Professor',
      specialization: ['Embedded Systems', 'IoT'],
      qualification: 'Ph.D. Electronics',
      joiningDate: new Date('2016-09-21'),
      officeRoom: 'EE-401',
      officeHours: 'Mon & Wed • 11:00-13:00',
    },
  },
];

const DEFAULT_PASSWORD = 'teacher@123';

const seedTeachers = async () => {
  try {
    await connectToDatabase();
    console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

    let createdCount = 0;

    for (const data of teachers) {
      const exists = await User.findOne({ email: data.email });
      if (exists) {
        console.log(`Skipping ${data.email} (already exists)`);
        continue;
      }

      const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await User.create({
        ...data,
        password,
        role: 'teacher',
      });
      createdCount += 1;
      console.log(`Created teacher ${data.username} (${data.email})`);
    }

    if (!createdCount) {
      console.log('No new teachers were added.');
    } else {
      console.log(`✅ Seeded ${createdCount} teachers. Default password: ${DEFAULT_PASSWORD}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding teachers:', error);
    process.exit(1);
  }
};

seedTeachers();


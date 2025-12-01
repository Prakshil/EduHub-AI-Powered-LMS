import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../Models/user.model.js';

dotenv.config();

const { MONGODB_URL, DB_NAME } = process.env;
const DEFAULT_PASSWORD = 'student@123';

const students = [
  {
    username: 'Mithali Raj',
    email: 'mithali.raj@example.com',
    gender: 'female',
    dob: new Date('2000-06-03'),
    age: 24,
    phone: '9876543210',
    address: 'Hyderabad, India',
    skills: ['Java', 'DSA', 'React'],
    studentProfile: {
      rollNumber: 'CS2001',
      batch: '2020-2024',
      program: 'B.Tech Computer Science',
      currentSemester: 7,
      cgpa: 3.8,
      totalCredits: 120,
    },
    profileimage: 'https://i.pravatar.cc/150?img=31',
  },
  {
    username: 'Aditya Verma',
    email: 'aditya.verma@example.com',
    gender: 'male',
    dob: new Date('2001-02-14'),
    age: 23,
    phone: '9988776655',
    address: 'Delhi, India',
    skills: ['Python', 'Machine Learning', 'SQL'],
    studentProfile: {
      rollNumber: 'CS2002',
      batch: '2020-2024',
      program: 'B.Tech Computer Science',
      currentSemester: 7,
      cgpa: 3.6,
      totalCredits: 118,
    },
    profileimage: 'https://i.pravatar.cc/150?img=15',
  },
  {
    username: 'Jasmine Kaur',
    email: 'jasmine.kaur@example.com',
    gender: 'female',
    dob: new Date('2002-09-22'),
    age: 22,
    phone: '9123456780',
    address: 'Chandigarh, India',
    skills: ['HTML', 'CSS', 'JavaScript'],
    studentProfile: {
      rollNumber: 'CS2105',
      batch: '2021-2025',
      program: 'B.Tech Information Technology',
      currentSemester: 5,
      cgpa: 3.5,
      totalCredits: 80,
    },
    profileimage: 'https://i.pravatar.cc/150?img=47',
  },
  {
    username: 'Rohan Iyer',
    email: 'rohan.iyer@example.com',
    gender: 'male',
    dob: new Date('2003-01-11'),
    age: 21,
    phone: '9012345678',
    address: 'Bangalore, India',
    skills: ['C++', 'Competitive Programming'],
    studentProfile: {
      rollNumber: 'CS2109',
      batch: '2021-2025',
      program: 'B.Tech Computer Science',
      currentSemester: 5,
      cgpa: 3.7,
      totalCredits: 82,
    },
    profileimage: 'https://i.pravatar.cc/150?img=12',
  },
  {
    username: 'Saanvi Desai',
    email: 'saanvi.desai@example.com',
    gender: 'female',
    dob: new Date('2004-03-30'),
    age: 20,
    phone: '9345678923',
    address: 'Mumbai, India',
    skills: ['UI Design', 'Figma', 'Illustrator'],
    studentProfile: {
      rollNumber: 'IT2203',
      batch: '2022-2026',
      program: 'B.Des Interaction Design',
      currentSemester: 3,
      cgpa: 3.4,
      totalCredits: 48,
    },
    profileimage: 'https://i.pravatar.cc/150?img=36',
  },
  {
    username: 'Kabir Malhotra',
    email: 'kabir.malhotra@example.com',
    gender: 'male',
    dob: new Date('2004-07-18'),
    age: 20,
    phone: '9456123890',
    address: 'Jaipur, India',
    skills: ['Cybersecurity', 'Linux', 'Networking'],
    studentProfile: {
      rollNumber: 'CS2204',
      batch: '2022-2026',
      program: 'B.Tech Cyber Security',
      currentSemester: 3,
      cgpa: 3.3,
      totalCredits: 46,
    },
    profileimage: 'https://i.pravatar.cc/150?img=52',
  },
  {
    username: 'Leena George',
    email: 'leena.george@example.com',
    gender: 'female',
    dob: new Date('2005-05-12'),
    age: 19,
    phone: '9234567810',
    address: 'Kochi, India',
    skills: ['Data Analysis', 'Excel', 'PowerBI'],
    studentProfile: {
      rollNumber: 'DS2301',
      batch: '2023-2027',
      program: 'B.Sc Data Science',
      currentSemester: 1,
      cgpa: 3.2,
      totalCredits: 20,
    },
    profileimage: 'https://i.pravatar.cc/150?img=60',
  },
  {
    username: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    gender: 'male',
    dob: new Date('2005-08-08'),
    age: 19,
    phone: '9876123450',
    address: 'Ahmedabad, India',
    skills: ['JavaScript', 'Node.js'],
    studentProfile: {
      rollNumber: 'CS2303',
      batch: '2023-2027',
      program: 'B.Tech Computer Science',
      currentSemester: 1,
      cgpa: 3.1,
      totalCredits: 18,
    },
    profileimage: 'https://i.pravatar.cc/150?img=62',
  },
  {
    username: 'Ishita Banerjee',
    email: 'ishita.banerjee@example.com',
    gender: 'female',
    dob: new Date('2000-11-29'),
    age: 23,
    phone: '9765432109',
    address: 'Kolkata, India',
    skills: ['Research', 'Technical Writing'],
    studentProfile: {
      rollNumber: 'IT2007',
      batch: '2020-2024',
      program: 'B.Tech Information Technology',
      currentSemester: 7,
      cgpa: 3.5,
      totalCredits: 118,
    },
    profileimage: 'https://i.pravatar.cc/150?img=45',
  },
  {
    username: 'Farhan Qureshi',
    email: 'farhan.qureshi@example.com',
    gender: 'male',
    dob: new Date('2002-04-05'),
    age: 22,
    phone: '9654321098',
    address: 'Lucknow, India',
    skills: ['Leadership', 'Entrepreneurship'],
    studentProfile: {
      rollNumber: 'MBA2102',
      batch: '2021-2023',
      program: 'MBA Tech Management',
      currentSemester: 5,
      cgpa: 3.6,
      totalCredits: 90,
    },
    profileimage: 'https://i.pravatar.cc/150?img=7',
  },
  {
    username: 'Neha Bhandari',
    email: 'neha.bhandari@example.com',
    gender: 'female',
    dob: new Date('2003-10-17'),
    age: 21,
    phone: '9876501234',
    address: 'Pune, India',
    skills: ['Flutter', 'Firebase'],
    studentProfile: {
      rollNumber: 'CS2108',
      batch: '2021-2025',
      program: 'B.Tech Computer Science',
      currentSemester: 5,
      cgpa: 3.55,
      totalCredits: 81,
    },
    profileimage: 'https://i.pravatar.cc/150?img=64',
  },
  {
    username: 'Rahul Nair',
    email: 'rahul.nair@example.com',
    gender: 'male',
    dob: new Date('2002-12-01'),
    age: 21,
    phone: '9123409876',
    address: 'Chennai, India',
    skills: ['DevOps', 'Docker', 'AWS'],
    studentProfile: {
      rollNumber: 'CS2101',
      batch: '2021-2025',
      program: 'B.Tech Computer Science',
      currentSemester: 5,
      cgpa: 3.65,
      totalCredits: 83,
    },
    profileimage: 'https://i.pravatar.cc/150?img=17',
  },
];

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

const seedUsers = async () => {
  try {
    await connectToDatabase();
    console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

    let createdCount = 0;

    for (const student of students) {
      const exists = await User.findOne({ email: student.email });
      if (exists) {
        console.log(`Skipping ${student.email} (already exists)`);
        continue;
      }

      const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await User.create({
        ...student,
        password,
        role: 'user',
      });

      console.log(`Created student account for ${student.username} (${student.email})`);
      createdCount += 1;
    }

    if (!createdCount) {
      console.log('No new student accounts were added.');
    } else {
      console.log(`✅ Seeded ${createdCount} student accounts. Default password: ${DEFAULT_PASSWORD}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();


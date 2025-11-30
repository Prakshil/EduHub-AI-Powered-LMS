import mongoose from 'mongoose';
import Semester from '../Models/Semester.model.js';
import dotenv from 'dotenv';

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

const semesters = [
  {
    name: 'Semester 1',
    year: 2025,
    term: 'Fall',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-12-15'),
    registrationDeadline: new Date('2025-07-25'),
    isActive: true,
    isCurrent: true,
    registrationOpen: true,
  },
  {
    name: 'Semester 2',
    year: 2026,
    term: 'Spring',
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-05-15'),
    registrationDeadline: new Date('2026-01-05'),
    isActive: true,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 3',
    year: 2026,
    term: 'Fall',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-12-15'),
    registrationDeadline: new Date('2026-07-25'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 4',
    year: 2027,
    term: 'Spring',
    startDate: new Date('2027-01-10'),
    endDate: new Date('2027-05-15'),
    registrationDeadline: new Date('2027-01-05'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 5',
    year: 2027,
    term: 'Fall',
    startDate: new Date('2027-08-01'),
    endDate: new Date('2027-12-15'),
    registrationDeadline: new Date('2027-07-25'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 6',
    year: 2028,
    term: 'Spring',
    startDate: new Date('2028-01-10'),
    endDate: new Date('2028-05-15'),
    registrationDeadline: new Date('2028-01-05'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 7',
    year: 2028,
    term: 'Fall',
    startDate: new Date('2028-08-01'),
    endDate: new Date('2028-12-15'),
    registrationDeadline: new Date('2028-07-25'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
  {
    name: 'Semester 8',
    year: 2029,
    term: 'Spring',
    startDate: new Date('2029-01-10'),
    endDate: new Date('2029-05-15'),
    registrationDeadline: new Date('2029-01-05'),
    isActive: false,
    isCurrent: false,
    registrationOpen: false,
  },
];

const seedSemesters = async () => {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log(`Connected to database ${DB_NAME || 'studentMS'}`);
    
    // Check if semesters already exist
    const existingCount = await Semester.countDocuments();
    if (existingCount > 0) {
      console.log(`Semesters already exist (${existingCount} found). Skipping seed.`);
      process.exit(0);
    }
    
    // Insert semesters
    await Semester.insertMany(semesters);
    console.log(`Successfully seeded ${semesters.length} semesters`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding semesters:', error);
    process.exit(1);
  }
};

seedSemesters();


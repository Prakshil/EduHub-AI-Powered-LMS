import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../Models/Course.model.js';
import Subject from '../Models/Subject.model.js';
import Semester from '../Models/Semester.model.js';
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

const SUBJECTS = [
  { name: 'Data Structures', code: 'CS201', credits: 4, department: 'Computer Science', description: 'Core concepts of stacks, queues, trees, and graphs.' },
  { name: 'Algorithms', code: 'CS301', credits: 4, department: 'Computer Science', description: 'Design and analysis of algorithms.' },
  { name: 'Database Systems', code: 'CS205', credits: 3, department: 'Computer Science', description: 'Relational databases, SQL, and normalization.' },
  { name: 'Operating Systems', code: 'CS310', credits: 4, department: 'Computer Science', description: 'Processes, threads, scheduling, and memory management.' },
  { name: 'Computer Networks', code: 'CS315', credits: 3, department: 'Computer Science', description: 'Network models, protocols, and routing.' },
  { name: 'Software Engineering', code: 'CS320', credits: 3, department: 'Computer Science', description: 'Software development lifecycle and project management.' },
  { name: 'Artificial Intelligence', code: 'CS330', credits: 3, department: 'Computer Science', description: 'Search, knowledge representation, and reasoning.' },
  { name: 'Machine Learning', code: 'CS340', credits: 3, department: 'Computer Science', description: 'Supervised and unsupervised learning techniques.' },
  { name: 'Discrete Mathematics', code: 'MTH210', credits: 3, department: 'Mathematics', description: 'Logic, combinatorics, and graph theory.' },
  { name: 'Probability & Statistics', code: 'MTH220', credits: 3, department: 'Mathematics', description: 'Probability theory and statistical inference.' },
];

const scheduleTemplates = [
  { days: ['Monday', 'Wednesday'], startTime: '09:00', endTime: '10:30', room: 'B-101' },
  { days: ['Tuesday', 'Thursday'], startTime: '11:00', endTime: '12:30', room: 'B-205' },
  { days: ['Monday', 'Wednesday'], startTime: '13:30', endTime: '15:00', room: 'C-310' },
  { days: ['Tuesday', 'Thursday'], startTime: '15:30', endTime: '17:00', room: 'C-118' },
  { days: ['Friday'], startTime: '10:00', endTime: '13:00', room: 'Lab-401' },
];

const createSyllabus = (subjectName) => ([
  { week: 1, topic: `${subjectName} Overview`, description: 'Introduction and expectations.' },
  { week: 2, topic: 'Core Concepts', description: 'Dive into fundamental ideas.' },
  { week: 3, topic: 'Hands-on Session', description: 'Workshop / lab work.' },
  { week: 4, topic: 'Midterm Review', description: 'Recap and Q&A.' },
  { week: 5, topic: 'Advanced Topics', description: 'Exploring advanced use cases.' },
  { week: 6, topic: 'Project Presentations', description: 'Student presentations and feedback.' },
]);

const ensureSubjects = async () => {
  const documents = [];
  for (const subject of SUBJECTS) {
    const doc = await Subject.findOneAndUpdate(
      { code: subject.code },
      subject,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    documents.push(doc);
  }
  return documents;
};

const seedCourses = async () => {
  try {
    await connectToDatabase();
    console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

    const semesters = await Semester.find().sort({ startDate: 1 });
    if (!semesters.length) {
      console.error('No semesters found. Run seedSemesters.js first.');
      process.exit(1);
    }

    const teachers = await User.find({ role: 'teacher' });
    if (!teachers.length) {
      console.error('No teachers found. Run seedTeachers.js first.');
      process.exit(1);
    }

    const subjects = await ensureSubjects();
    let createdCount = 0;

    for (let semIndex = 0; semIndex < semesters.length; semIndex += 1) {
      const semester = semesters[semIndex];
      console.log(`Processing ${semester.name}`);

      for (let i = 0; i < 5; i += 1) {
        const subject = subjects[(semIndex * 5 + i) % subjects.length];
        const teacher = teachers[(semIndex + i) % teachers.length];
        const schedule = scheduleTemplates[i % scheduleTemplates.length];
        const section = String.fromCharCode(65 + (i % 5)); // A-E

        const exists = await Course.findOne({
          subject: subject._id,
          semester: semester._id,
          section,
          teacher: teacher._id,
        });
        if (exists) {
          console.log(`  • ${subject.code} already scheduled for ${semester.name} (section ${section})`);
          continue;
        }

        await Course.create({
          subject: subject._id,
          semester: semester._id,
          teacher: teacher._id,
          section,
          maxCapacity: 45,
          schedule,
          description: `${subject.name} offered in ${semester.name} with ${teacher.username}`,
          syllabus: createSyllabus(subject.name),
          prerequisites: [],
          status: semester.isCurrent ? 'ongoing' : (semester.isActive ? 'upcoming' : 'upcoming'),
        });

        createdCount += 1;
        console.log(`  ✅ Created ${subject.code} for ${semester.name} (section ${section})`);
      }
    }

    console.log(`Finished seeding courses. Total created: ${createdCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
};

seedCourses();


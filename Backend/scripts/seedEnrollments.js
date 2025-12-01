import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from '../Models/Enrollment.model.js';
import User from '../Models/user.model.js';
import Course from '../Models/Course.model.js';
import Semester from '../Models/Semester.model.js';

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

const seedEnrollments = async () => {
  try {
    await connectToDatabase();
    console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

    const students = await User.find({ role: 'user' });
    const courses = await Course.find().populate('semester');
    const semesters = await Semester.find();

    if (!students.length || !courses.length) {
      console.log('Students or courses not found. Seed them first.');
      process.exit(0);
    }

    let created = 0;

    const findSemesterByNumber = (semNumber) => {
      if (!semNumber) return null;
      return semesters.find((sem) =>
        sem.name?.toLowerCase().includes(`semester ${semNumber}`.toLowerCase())
      );
    };

    for (let i = 0; i < students.length; i += 1) {
      const student = students[i];
      const semNumber = student.studentProfile?.currentSemester || 1;
      const preferredSemester = findSemesterByNumber(semNumber);

      let candidateCourses = courses;
      if (preferredSemester) {
        candidateCourses = courses.filter((course) =>
          course.semester?.toString() === preferredSemester._id.toString()
        );
        if (candidateCourses.length === 0) candidateCourses = courses;
      }

      const startIndex = (i * 3) % candidateCourses.length;
      const assigned = [
        candidateCourses[startIndex],
        candidateCourses[(startIndex + 1) % candidateCourses.length],
        candidateCourses[(startIndex + 2) % candidateCourses.length],
      ];

      for (const course of assigned) {
        if (!course) continue;
        const exists = await Enrollment.findOne({
          student: student._id,
          course: course._id,
        });
        if (exists) continue;

        await Enrollment.create({
          student: student._id,
          course: course._id,
          semester: course.semester,
          status: 'enrolled',
        });

        await Course.findByIdAndUpdate(course._id, { $inc: { currentEnrollment: 1 } });
        created += 1;
      }
    }

    console.log(`✅ Created ${created} enrollment records.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding enrollments:', error);
    process.exit(1);
  }
};

seedEnrollments();


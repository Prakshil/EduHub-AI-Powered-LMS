import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../Models/user.model.js';

dotenv.config();

const { MONGODB_URL, DB_NAME } = process.env;
const DEFAULT_PASSWORD = 'Student@123';

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

const students = [
  { username: 'arianapatel', email: 'ariana.patel@example.com', phone: 15550000001, gender: 'female', age: 20, profileImage: 'https://i.pravatar.cc/150?img=1', dob: '2004-02-14', address: 'Mumbai, India', skills: ['Mathematics', 'Data Analysis'], program: 'B.Tech Computer Science', batch: '2023-2027', currentSemester: 3, rollNumber: 'CS2301' },
  { username: 'noahfernandez', email: 'noah.fernandez@example.com', phone: 15550000002, gender: 'male', age: 21, profileImage: 'https://i.pravatar.cc/150?img=2', dob: '2003-11-03', address: 'Lisbon, Portugal', skills: ['Algorithms', 'Python'], program: 'B.Sc Software Engineering', batch: '2022-2026', currentSemester: 5, rollNumber: 'SE2204' },
  { username: 'mayagupta', email: 'maya.gupta@example.com', phone: 15550000003, gender: 'female', age: 19, profileImage: 'https://i.pravatar.cc/150?img=3', dob: '2005-05-19', address: 'Delhi, India', skills: ['AI', 'Machine Learning'], program: 'B.Tech AI & DS', batch: '2023-2027', currentSemester: 3, rollNumber: 'AI2307' },
  { username: 'ethanwong', email: 'ethan.wong@example.com', phone: 15550000004, gender: 'male', age: 22, profileImage: 'https://i.pravatar.cc/150?img=4', dob: '2002-04-08', address: 'Singapore', skills: ['Networks', 'Go'], program: 'B.Eng Information Systems', batch: '2021-2025', currentSemester: 7, rollNumber: 'IS2102' },
  { username: 'sofiakhan', email: 'sofia.khan@example.com', phone: 15550000005, gender: 'female', age: 20, profileImage: 'https://i.pravatar.cc/150?img=5', dob: '2004-09-22', address: 'Doha, Qatar', skills: ['Databases', 'SQL'], program: 'B.Sc Information Technology', batch: '2022-2026', currentSemester: 5, rollNumber: 'IT2212' },
  { username: 'liambose', email: 'liam.bose@example.com', phone: 15550000006, gender: 'male', age: 21, profileImage: 'https://i.pravatar.cc/150?img=6', dob: '2003-03-15', address: 'Sydney, Australia', skills: ['Cybersecurity', 'Linux'], program: 'B.IT Cybersecurity', batch: '2021-2025', currentSemester: 7, rollNumber: 'CY2105' },
  { username: 'oliviasingh', email: 'olivia.singh@example.com', phone: 15550000007, gender: 'female', age: 18, profileImage: 'https://i.pravatar.cc/150?img=7', dob: '2006-12-04', address: 'Chandigarh, India', skills: ['HTML', 'CSS', 'JavaScript'], program: 'BCA', batch: '2024-2027', currentSemester: 1, rollNumber: 'BCA2401' },
  { username: 'carlosdiaz', email: 'carlos.diaz@example.com', phone: 15550000008, gender: 'male', age: 23, profileImage: 'https://i.pravatar.cc/150?img=8', dob: '2001-07-30', address: 'Bogotá, Colombia', skills: ['Cloud', 'DevOps'], program: 'B.Eng Cloud Engineering', batch: '2020-2024', currentSemester: 8, rollNumber: 'CL2003' },
  { username: 'jasmineali', email: 'jasmine.ali@example.com', phone: 15550000009, gender: 'female', age: 20, profileImage: 'https://i.pravatar.cc/150?img=9', dob: '2004-08-09', address: 'Dubai, UAE', skills: ['Product Design', 'UX'], program: 'B.Des Interaction Design', batch: '2022-2026', currentSemester: 5, rollNumber: 'UX2209' },
  { username: 'arjunmehta', email: 'arjun.mehta@example.com', phone: 15550000010, gender: 'male', age: 19, profileImage: 'https://i.pravatar.cc/150?img=10', dob: '2005-10-17', address: 'Ahmedabad, India', skills: ['Java', 'Spring'], program: 'B.Tech Information Technology', batch: '2023-2027', currentSemester: 3, rollNumber: 'IT2308' },
  { username: 'emilybrown', email: 'emily.brown@example.com', phone: 15550000011, gender: 'female', age: 22, profileImage: 'https://i.pravatar.cc/150?img=11', dob: '2002-01-26', address: 'Toronto, Canada', skills: ['Business Analysis', 'Python'], program: 'BBA Business Analytics', batch: '2021-2025', currentSemester: 7, rollNumber: 'BA2104' },
  { username: 'davidkim', email: 'david.kim@example.com', phone: 15550000012, gender: 'male', age: 21, profileImage: 'https://i.pravatar.cc/150?img=12', dob: '2003-02-19', address: 'Seoul, South Korea', skills: ['C++', 'Robotics'], program: 'B.Eng Mechatronics', batch: '2021-2025', currentSemester: 7, rollNumber: 'ME2106' },
  { username: 'priyasharma', email: 'priya.sharma@example.com', phone: 15550000013, gender: 'female', age: 20, profileImage: 'https://i.pravatar.cc/150?img=13', dob: '2004-03-07', address: 'Jaipur, India', skills: ['Project Management', 'SQL'], program: 'B.Tech Electronics', batch: '2022-2026', currentSemester: 5, rollNumber: 'EC2210' },
  { username: 'rohaniyer', email: 'rohan.iyer@example.com', phone: 15550000014, gender: 'male', age: 19, profileImage: 'https://i.pravatar.cc/150?img=14', dob: '2005-06-11', address: 'Pune, India', skills: ['Android', 'Kotlin'], program: 'BCA Mobile Computing', batch: '2023-2026', currentSemester: 3, rollNumber: 'MC2302' },
  { username: 'chloeharris', email: 'chloe.harris@example.com', phone: 15550000015, gender: 'female', age: 21, profileImage: 'https://i.pravatar.cc/150?img=15', dob: '2003-05-01', address: 'London, UK', skills: ['Statistics', 'R'], program: 'B.Sc Data Science', batch: '2021-2025', currentSemester: 7, rollNumber: 'DS2109' },
  { username: 'mateodominguez', email: 'mateo.dominguez@example.com', phone: 15550000016, gender: 'male', age: 20, profileImage: 'https://i.pravatar.cc/150?img=16', dob: '2004-04-18', address: 'Madrid, Spain', skills: ['AI Ethics', 'Python'], program: 'B.Sc Artificial Intelligence', batch: '2022-2026', currentSemester: 5, rollNumber: 'AI2215' },
  { username: 'hanaokada', email: 'hana.okada@example.com', phone: 15550000017, gender: 'female', age: 18, profileImage: 'https://i.pravatar.cc/150?img=17', dob: '2006-07-25', address: 'Osaka, Japan', skills: ['Illustrator', 'UI Kits'], program: 'B.Des Communication Design', batch: '2024-2028', currentSemester: 1, rollNumber: 'CD2403' },
  { username: 'gabrielsousa', email: 'gabriel.sousa@example.com', phone: 15550000018, gender: 'male', age: 23, profileImage: 'https://i.pravatar.cc/150?img=18', dob: '2001-09-15', address: 'Rio de Janeiro, Brazil', skills: ['Game Dev', 'Unity'], program: 'B.Sc Game Development', batch: '2020-2024', currentSemester: 8, rollNumber: 'GD2007' },
  { username: 'linhnguyen', email: 'linh.nguyen@example.com', phone: 15550000019, gender: 'female', age: 21, profileImage: 'https://i.pravatar.cc/150?img=19', dob: '2003-08-28', address: 'Hanoi, Vietnam', skills: ['Full Stack', 'Node.js'], program: 'B.IT Software Systems', batch: '2021-2025', currentSemester: 7, rollNumber: 'SS2108' },
  { username: 'ahmedsalim', email: 'ahmed.salim@example.com', phone: 15550000020, gender: 'male', age: 20, profileImage: 'https://i.pravatar.cc/150?img=20', dob: '2004-06-02', address: 'Cairo, Egypt', skills: ['Networking', 'Security'], program: 'B.Sc Computer Networks', batch: '2022-2026', currentSemester: 5, rollNumber: 'CN2211' },
];

const seedStudents = async () => {
  try {
    await connectToDatabase();
    console.log(`Connected to MongoDB (${DB_NAME || 'studentMS'})`);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let createdCount = 0;

    for (const data of students) {
      const exists = await User.findOne({ email: data.email });
      if (exists) {
        console.log(`Skipping ${data.email} (already exists)`);
        continue;
      }

      await User.create({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        dob: new Date(data.dob),
        age: data.age,
        gender: data.gender,
        address: data.address,
        skills: data.skills,
        profileimage: data.profileImage,
        role: 'user',
        studentProfile: {
          program: data.program,
          batch: data.batch,
          currentSemester: data.currentSemester,
          rollNumber: data.rollNumber,
          admissionDate: new Date(data.admissionDate || '2023-08-01'),
          semesterName: `${data.currentSemester} Semester`,
        },
      });

      createdCount += 1;
      console.log(`Created user ${data.username} (${data.email})`);
    }

    if (!createdCount) {
      console.log('No new students were added.');
    } else {
      console.log(`✅ Seeded ${createdCount} user records with default password "${DEFAULT_PASSWORD}".`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error);
    process.exit(1);
  }
};

seedStudents();


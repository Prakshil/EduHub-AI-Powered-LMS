import User from "../Models/user.model.js";
import Semester from "../Models/Semester.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dns from 'dns';
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import fs from 'fs';

async function validateEmail(email) {
    

    return new Promise((resolve) => {
        const domain= email.split('@')[1];
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                console.log('invalid domain', domain);
                resolve(false);
            }
            else {
                console.log('valid domain', domain);
                resolve(true);
            }
        });
    });
}


const clampSemesterNumber = (value) => {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), 12);
};

const extractSemesterNumber = (semesterDoc) => {
  if (!semesterDoc) return 1;
  if (semesterDoc.sequence) {
    return clampSemesterNumber(semesterDoc.sequence);
  }
  if (semesterDoc.name) {
    const numeric = parseInt(semesterDoc.name.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(numeric)) {
      return clampSemesterNumber(numeric);
    }
  }
  const termOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };
  if (semesterDoc.term && termOrder[semesterDoc.term]) {
    return termOrder[semesterDoc.term];
  }
  return 1;
};

const parseSkillsInput = (raw) => {
  if (!raw) return [];

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed !== value) {
          return toArray(parsed);
        }
      } catch {
        // ignore JSON parse errors and fall back to splitting
      }
      return value.split(',');
    }
    return [];
  };

  return toArray(raw)
    .map((item) => {
      if (!item) return '';
      return String(item)
        .replace(/\\+"/g, '"')
        .replace(/^"+|"+$/g, '')
        .trim();
    })
    .filter(Boolean);
};

const buildStudentProfile = async (semesterId) => {
  let semesterDoc = null;
  if (semesterId) {
    try {
      semesterDoc = await Semester.findById(semesterId);
    } catch (error) {
      console.warn('Invalid semester id supplied during signup:', error.message);
    }
  }

  return {
    currentSemester: clampSemesterNumber(extractSemesterNumber(semesterDoc)),
    semesterId: semesterDoc?._id,
    semesterName: semesterDoc?.name,
    admissionDate: new Date(),
  };
};

const signUp = async (req, res) => {
  try {
    const { username, email, password, phone, dob, age, gender, address, skills, profileimage, role, semester } = req.body;
    const normalizedGender = typeof gender === "string" ? gender.trim().toLowerCase() : gender;
    const emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailregex.test(email)) {
        return res.status(400).json(new ApiError(400, "Please provide a valid email address"));
    }
    const isEmailValid = await validateEmail(email);
    if (!isEmailValid) {
        return res.status(400).json(new ApiError(400, "Invalid email domain"));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;
    
        // If a file is uploaded, push to Cloudinary and prefer that URL
        let profileImg = profileimage;
        if (req.file?.path) {
            try {
                const uploadRes = await uploadOnCloudinary(req.file.path);
                if (!uploadRes?.secure_url) {
                    try { fs.unlinkSync(req.file.path); } catch {}
                    return res.status(500).json(new ApiError(500, "Failed to upload image to Cloudinary"));
                }
                profileImg = uploadRes.secure_url;
            } finally {
                try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
            }
        }

        const userDoc = {
            username,
            email,
            password: req.body.password, // already hashed above
            phone: phone ? String(phone) : undefined,
            dob,
            age,
            gender: normalizedGender,
            address,
            skills: parseSkillsInput(skills),
        };
        
        // Set role if provided (only allow 'user' or 'teacher' from signup)
        if (role && ['user', 'teacher'].includes(role)) {
            userDoc.role = role;
        }
        
        // If student (user role) prepare student profile
        if (!role || role === 'user') {
            userDoc.studentProfile = await buildStudentProfile(semester);
        }
        
        if (profileImg) userDoc.profileimage = profileImg; // only set when provided, otherwise let mongoose default apply

        const user = new User(userDoc);
    const newUser = await user.save();
       
        if (!newUser) {
            return res.status(400).json(new ApiError(400, "User creation failed"));
        }
        
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    const safeUser = newUser.toObject ? newUser.toObject() : newUser;
    delete safeUser.password;
    res.status(201).json(new ApiResponse(201, { user: safeUser, token }, "User created successfully"));
    } catch (error) {
        res.status(400).json(new ApiError(400, "Failed to create user", [error.message]));
    }
};



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(new ApiError(400, "Email and password are required"));
    }

    // Ensure password is selected even if schema has select:false
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }

    // Optional basic length guard for plain password only
    if (password.length < 6) {
      return res.status(400).json(new ApiError(400, "Password too short"));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json(new ApiError(401, "Invalid credentials"));
    }

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.password;

        return res
            .status(200)
            .json(new ApiResponse(200, { user: safeUser, token: newToken }, "Login successful"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to login", [error.message]));
  }
};



const singleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }
    res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, "Failed to retrieve user", [error.message]));
    }
};



const updateUser = async (req, res) => {
    try {
                // If a new file is uploaded, send to Cloudinary and set profileimage in body
                if (req.file?.path) {
                    try {
                        const uploadRes = await uploadOnCloudinary(req.file.path);
                        if (!uploadRes?.secure_url) {
                            try { fs.unlinkSync(req.file.path); } catch {}
                            return res.status(500).json(new ApiError(500, "Failed to upload image to Cloudinary"));
                        }
                        req.body.profileimage = uploadRes.secure_url;
                    } finally {
                        try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
                    }
                }

                if (req.body.skills) {
                    req.body.skills = parseSkillsInput(req.body.skills);
                }

                if (req.body.studentProfile && typeof req.body.studentProfile === 'string') {
                    try {
                        req.body.studentProfile = JSON.parse(req.body.studentProfile);
                    } catch {
                        // ignore invalid JSON
                    }
                }

                if (req.body.studentProfile?.currentSemester) {
                    req.body.studentProfile.currentSemester = clampSemesterNumber(
                        parseInt(req.body.studentProfile.currentSemester, 10)
                    );
                }

                const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }   
    res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
    } catch (error) {
        res.status(400).json(new ApiError(400, "Failed to update user", [error.message]));
    }
};



const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }
    res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
    }

     catch (error) {
        res.status(500).json(new ApiError(500, "Failed to delete user", [error.message]));
    }
};
export { signUp, login, singleUser, updateUser, deleteUser };
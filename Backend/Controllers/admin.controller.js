import User from '../Models/user.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        
        const query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            query.role = role;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const totalUsers = await User.countDocuments(query);
        
        res.status(200).json(
            new ApiResponse(200, {
                users,
                pagination: {
                    total: totalUsers,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalUsers / parseInt(limit))
                }
            }, 'Users fetched successfully')
        );
    } catch (error) {
        next(error);
    }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        
        res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete user
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Cannot delete another admin');
        }
        
        await User.findByIdAndDelete(req.params.id);
        
        res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'user' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        
        // Get users registered this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const newStudentsThisMonth = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startOfMonth }
        });
        
        // Get gender distribution for users
        const userGenderStats = await User.aggregate([
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);
        
        // Get gender distribution for students
        const studentGenderStats = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);
        
        // Get users by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const usersByMonth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        // Get students by month (last 6 months)
        const studentsByMonth = await User.aggregate([
            { $match: { role: 'user', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        // Get age distribution for users
        const userAgeStats = await User.aggregate([
            { $match: { age: { $exists: true, $ne: null } } },
            {
                $bucket: {
                    groupBy: '$age',
                    boundaries: [18, 25, 35, 45, 55, 120],
                    default: 'Unknown',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        
        // Get age distribution for students
        const studentAgeStats = await User.aggregate([
            { $match: { role: 'user', age: { $exists: true, $ne: null } } },
            {
                $bucket: {
                    groupBy: '$age',
                    boundaries: [3, 10, 15, 18, 25, 120],
                    default: 'Unknown',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        
        // Recent users
        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);
        
        // Recent students
        const recentStudents = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);
        
        res.status(200).json(
            new ApiResponse(200, {
                totalStudents,
                totalTeachers,
                totalAdmins,
                newStudentsThisMonth,
                userGenderStats,
                studentGenderStats,
                usersByMonth,
                studentsByMonth,
                userAgeStats,
                studentAgeStats,
                recentUsers,
                recentStudents
            }, 'Dashboard stats fetched successfully')
        );
    } catch (error) {
        next(error);
    }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            throw new ApiError(400, 'Invalid role');
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        
        res.status(200).json(new ApiResponse(200, user, 'User role updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all students
export const getAllStudents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const query = { role: 'user' };
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'studentProfile.program': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const students = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const totalStudents = await User.countDocuments(query);
        
        res.status(200).json(
            new ApiResponse(200, {
                students,
                pagination: {
                    total: totalStudents,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalStudents / parseInt(limit))
                }
            }, 'Students fetched successfully')
        );
    } catch (error) {
        next(error);
    }
};

// Get student by ID
export const getStudentById = async (req, res, next) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'user' }).select('-password');
        
        if (!student) {
            throw new ApiError(404, 'Student not found');
        }
        
        res.status(200).json(new ApiResponse(200, student, 'Student fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete student
export const deleteStudent = async (req, res, next) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, role: 'user' });
        
        if (!student) {
            throw new ApiError(404, 'Student not found');
        }
        
        res.status(200).json(new ApiResponse(200, null, 'Student deleted successfully'));
    } catch (error) {
        next(error);
    }
};

export const getStudentUsers = async (req, res, next) => {
    req.query = { ...req.query, role: 'user' };
    return getAllUsers(req, res, next);
};

export const getStudentProfileDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const requester = req.user;

        const student = await User.findById(id).select('-password');

        if (!student) {
            throw new ApiError(404, 'Student not found');
        }

        if (student.role !== 'user') {
            throw new ApiError(400, 'Requested user is not a student');
        }

        // Students can view only their own profile
        if (requester.role === 'user' && requester._id.toString() !== id.toString()) {
            throw new ApiError(403, 'Access denied');
        }

        const enrollments = await Enrollment.find({ student: id })
            .populate({
                path: 'course',
                populate: [
                    { path: 'subject', select: 'name code credits department' },
                    { path: 'teacher', select: 'username email profileimage' },
                    { path: 'semester', select: 'name year term isCurrent' },
                ],
            })
            .sort({ createdAt: -1 });

        res.status(200).json(
            new ApiResponse(
                200,
                { student, enrollments },
                'Student profile fetched successfully'
            )
        );
    } catch (error) {
        next(error);
    }
};


import ApiError from '../utils/ApiError.js';

// Teacher only middleware
export const isTeacher = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        if (req.user.role !== 'teacher') {
            throw new ApiError(403, 'Access denied. Teacher privileges required.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Teacher or Admin middleware
export const isTeacherOrAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            throw new ApiError(403, 'Access denied. Teacher or Admin privileges required.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Any authenticated staff (teacher or admin)
export const isStaff = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new ApiError(401, 'Authentication required');
        }

        if (req.user.role === 'user') {
            throw new ApiError(403, 'Access denied. Staff privileges required.');
        }

        next();
    } catch (error) {
        next(error);
    }
};


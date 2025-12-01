import Semester from '../Models/Semester.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Create a new semester (Admin only)
export const createSemester = async (req, res, next) => {
    try {
        const { name, year, term, startDate, endDate, registrationDeadline, isActive, isCurrent, registrationOpen } = req.body;
        
        // Check if semester already exists
        const existingSemester = await Semester.findOne({ year, term });
        if (existingSemester) {
            throw new ApiError(400, `${term} ${year} semester already exists`);
        }
        
        // Validate dates
        if (new Date(startDate) >= new Date(endDate)) {
            throw new ApiError(400, 'Start date must be before end date');
        }
        
        const semester = await Semester.create({
            name: name || `${term} ${year}`,
            year,
            term,
            startDate,
            endDate,
            registrationDeadline,
            isActive: isActive || false,
            isCurrent: isCurrent || false,
            registrationOpen: registrationOpen || false,
        });
        
        res.status(201).json(new ApiResponse(201, semester, 'Semester created successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all semesters
export const getAllSemesters = async (req, res, next) => {
    try {
        const { isActive, isCurrent } = req.query;
        
        const query = {};
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        if (isCurrent !== undefined) {
            query.isCurrent = isCurrent === 'true';
        }
        
        const semesters = await Semester.find(query).sort({ year: -1, term: 1 });
        
        res.status(200).json(new ApiResponse(200, semesters, 'Semesters fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get current semester
export const getCurrentSemester = async (req, res, next) => {
    try {
        const semester = await Semester.findOne({ isCurrent: true });
        
        if (!semester) {
            throw new ApiError(404, 'No current semester found');
        }
        
        res.status(200).json(new ApiResponse(200, semester, 'Current semester fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get semester by ID
export const getSemesterById = async (req, res, next) => {
    try {
        const semester = await Semester.findById(req.params.id);
        
        if (!semester) {
            throw new ApiError(404, 'Semester not found');
        }
        
        res.status(200).json(new ApiResponse(200, semester, 'Semester fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update semester (Admin only)
export const updateSemester = async (req, res, next) => {
    try {
        const { name, startDate, endDate, registrationDeadline, isActive, isCurrent, registrationOpen } = req.body;
        
        const semester = await Semester.findById(req.params.id);
        
        if (!semester) {
            throw new ApiError(404, 'Semester not found');
        }
        
        // Update fields
        if (name) semester.name = name;
        if (startDate) semester.startDate = startDate;
        if (endDate) semester.endDate = endDate;
        if (registrationDeadline) semester.registrationDeadline = registrationDeadline;
        if (isActive !== undefined) semester.isActive = isActive;
        if (isCurrent !== undefined) semester.isCurrent = isCurrent;
        if (registrationOpen !== undefined) semester.registrationOpen = registrationOpen;
        
        await semester.save();
        
        res.status(200).json(new ApiResponse(200, semester, 'Semester updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete semester (Admin only)
export const deleteSemester = async (req, res, next) => {
    try {
        const semester = await Semester.findByIdAndDelete(req.params.id);
        
        if (!semester) {
            throw new ApiError(404, 'Semester not found');
        }
        
        res.status(200).json(new ApiResponse(200, null, 'Semester deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Set current semester (Admin only)
export const setCurrentSemester = async (req, res, next) => {
    try {
        // First, unset current from all semesters
        await Semester.updateMany({}, { isCurrent: false });
        
        // Set the specified semester as current
        const semester = await Semester.findByIdAndUpdate(
            req.params.id,
            { isCurrent: true, isActive: true },
            { new: true }
        );
        
        if (!semester) {
            throw new ApiError(404, 'Semester not found');
        }
        
        res.status(200).json(new ApiResponse(200, semester, 'Current semester updated successfully'));
    } catch (error) {
        next(error);
    }
};


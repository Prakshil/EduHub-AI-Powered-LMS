import Subject from '../Models/Subject.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// Create a new subject (Admin only)
export const createSubject = async (req, res, next) => {
    try {
        const { name, code, description, credits, department } = req.body;
        
        const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
        if (existingSubject) {
            throw new ApiError(400, 'Subject with this code already exists');
        }
        
        const subject = await Subject.create({
            name,
            code: code.toUpperCase(),
            description,
            credits,
            department,
        });
        
        res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all subjects with filters
export const getAllSubjects = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '', department = '', isActive } = req.query;
        
        const query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }
        
        if (department) {
            query.department = department;
        }
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const subjects = await Subject.find(query)
            .sort({ code: 1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Subject.countDocuments(query);
        
        res.status(200).json(new ApiResponse(200, {
            subjects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Subjects fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Get subject by ID
export const getSubjectById = async (req, res, next) => {
    try {
        const subject = await Subject.findById(req.params.id);
        
        if (!subject) {
            throw new ApiError(404, 'Subject not found');
        }
        
        res.status(200).json(new ApiResponse(200, subject, 'Subject fetched successfully'));
    } catch (error) {
        next(error);
    }
};

// Update subject (Admin only)
export const updateSubject = async (req, res, next) => {
    try {
        const { name, description, credits, department, isActive } = req.body;
        
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            { name, description, credits, department, isActive },
            { new: true, runValidators: true }
        );
        
        if (!subject) {
            throw new ApiError(404, 'Subject not found');
        }
        
        res.status(200).json(new ApiResponse(200, subject, 'Subject updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete subject (Admin only)
export const deleteSubject = async (req, res, next) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        
        if (!subject) {
            throw new ApiError(404, 'Subject not found');
        }
        
        res.status(200).json(new ApiResponse(200, null, 'Subject deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Get departments list
export const getDepartments = async (req, res, next) => {
    try {
        const departments = [
            "Computer Science",
            "Mathematics", 
            "Physics",
            "Chemistry",
            "Biology",
            "English",
            "History",
            "Economics",
            "Business",
            "Engineering",
            "Arts",
            "Other"
        ];
        
        res.status(200).json(new ApiResponse(200, departments, 'Departments fetched successfully'));
    } catch (error) {
        next(error);
    }
};


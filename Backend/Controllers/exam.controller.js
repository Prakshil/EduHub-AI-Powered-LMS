import { GoogleGenerativeAI } from '@google/generative-ai';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Course from '../Models/Course.model.js';
import Announcement from '../Models/Announcement.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import Assignment from '../Models/Assignment.model.js';
import ExamResult from '../Models/ExamResult.model.js';


let genAI = null;
const getGeminiClient = () => {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new ApiError(500, 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.');
        }
        // Initialize with API key - SDK will handle API version internally
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

/**
 * List available models (helper function for debugging)
 */
const listAvailableModels = async () => {
    try {
        const client = getGeminiClient();
        // Note: The SDK doesn't directly expose listModels, but we can try common model names
        const commonModels = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-2.0-flash-exp'
        ];
        return commonModels;
    } catch (error) {
        console.error('Error listing models:', error);
        return [];
    }
};

/**
 * Generate exam questions using Google Gemini
 * POST /api/v1/exam/generate
 * Body: { 
 *   subject: string (required or courseId),
 *   numberOfQuestions: number (default: 10),
 *   difficulty: string (optional: easy/medium/hard),
 *   topic: string (optional),
 *   instructions: string (optional),
 *   courseId: string (optional),
 *   examType: string (optional: midterm/final),
 *   maxScore: number (optional),
 *   ...other fields
 * }
 */
export const generateExam = async (req, res, next) => {
    try {
        // Handle field name variations from different frontend forms
        const { 
            subject, 
            numberOfQuestions,
            numQuestions, // Alternative field name from Assignments form
            difficulty,
            topic,
            instructions,
            courseId,
            examType,
            type, // Alternative field name from Assignments form
            maxScore
        } = req.body;

        // Get course details if courseId is provided
        let course = null;
        let courseDetails = '';
        let subjectName = subject; // Use provided subject or derive from course
        
        if (courseId) {
            try {
                course = await Course.findById(courseId)
                    .populate('subject')
                    .populate('semester');
                
                if (course) {
                    // Derive subject name from course if not provided
                    if (!subjectName && course.subject?.name) {
                        subjectName = course.subject.name;
                    }
                    
                    courseDetails = `Course: ${course.subject?.name || 'N/A'} (${course.subject?.code || 'N/A'}). `;
                    if (course.subject?.description) {
                        courseDetails += `Course Description: ${course.subject.description}. `;
                    }
                } else {
                    throw new ApiError(404, 'Course not found');
                }
            } catch (error) {
                if (error instanceof ApiError) {
                    throw error;
                }
                console.warn('Could not fetch course details:', error.message);
            }
        }

        // Validate required fields - either subject or courseId must be provided
        if (!subjectName && !courseId) {
            throw new ApiError(400, 'Either subject or courseId is required');
        }

        // If courseId was provided but we couldn't get subject name
        if (!subjectName && courseId) {
            if (course && !course.subject) {
                throw new ApiError(400, 'The selected course does not have a subject assigned. Please provide a subject name manually or assign a subject to the course.');
            } else {
                throw new ApiError(400, 'Could not retrieve subject from course. Please provide a subject name manually.');
            }
        }

        // Final check - subject name is required
        if (!subjectName) {
            throw new ApiError(400, 'Subject is required. Please provide a subject name or select a course with an assigned subject.');
        }

        // Handle number of questions - support both field names
        const numQuestionsValue = numberOfQuestions || numQuestions || 10;
        const numQuestionsParsed = parseInt(numQuestionsValue, 10);
        if (isNaN(numQuestionsParsed) || numQuestionsParsed < 1 || numQuestionsParsed > 50) {
            throw new ApiError(400, 'Number of questions must be between 1 and 50');
        }

        // Handle exam type - support both field names
        const examTypeValue = examType || type;

        // Build comprehensive prompt
        let prompt = `You are an expert educational content creator. Generate ${numQuestionsParsed} high-quality multiple-choice questions (MCQs) for an exam.

${courseDetails}Subject: ${subjectName}

`;

        // Add exam type if provided
        if (examTypeValue) {
            prompt += `Exam Type: ${examTypeValue.charAt(0).toUpperCase() + examTypeValue.slice(1)} Exam. `;
        }

        // Add difficulty level
        if (difficulty) {
            const difficultyMap = {
                'easy': 'Beginner level - questions should test basic understanding and recall',
                'medium': 'Intermediate level - questions should test application and analysis',
                'hard': 'Advanced level - questions should test synthesis, evaluation, and complex problem-solving'
            };
            prompt += `Difficulty Level: ${difficultyMap[difficulty] || difficulty}. `;
        }

        // Add topic/focus area
        if (topic) {
            prompt += `\nFocus Area/Topic: ${topic}. The questions should primarily focus on this topic. `;
        }

        // Add instructions
        if (instructions) {
            prompt += `\nAdditional Instructions: ${instructions}. `;
        }

        // Add max score if provided
        if (maxScore) {
            prompt += `\nMaximum Score: ${maxScore} points. `;
        }

        // Main prompt structure
        prompt += `\n\nRequirements:
1. Generate exactly ${numQuestionsParsed} multiple-choice questions.
2. Each question must have exactly 4 options (A, B, C, D).
3. Clearly indicate the correct answer for each question.
4. Questions should be clear, unambiguous, and educationally valuable.
5. Avoid trick questions or overly ambiguous wording.
6. Ensure a good mix of question types (conceptual, application, analysis).
7. Format the output as follows:

Question 1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter]

Question 2: [Question text]
...
Continue this format for all ${numQuestionsParsed} questions.`;

        // Call Gemini API
        console.log('Starting Gemini API call...');
        console.log('Request details:', {
            subject: subjectName,
            numQuestions: numQuestionsParsed,
            courseId: courseId || 'none',
            hasApiKey: !!process.env.GEMINI_API_KEY
        });
        
        const geminiClient = getGeminiClient();
        
        try {
          
            // Try different models in order of preference
            // Using correct model names: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash
            // Can be overridden with GEMINI_MODEL env variable
            const preferredModels = [
                process.env.GEMINI_MODEL, // User override
                'gemini-1.5-pro',         // High quality, stable
                'gemini-1.5-flash',       // Faster, cheaper
                'gemini-2.0-flash',       // Latest flash model
                'gemini-pro'              // Fallback to older model
            ].filter(Boolean);
            
            let geminiModel;
            let result;
            let response;
            let generatedQuestions;
            let lastError = null;
            let successfulModel = null;
            
            // Try each model until one works
            for (const tryModel of preferredModels) {
                try {
                    console.log(`Attempting to use model: ${tryModel}`);
                    geminiModel = geminiClient.getGenerativeModel({ model: tryModel });
                    result = await geminiModel.generateContent(prompt);
                    response = await result.response;
                    generatedQuestions = response.text();
                    successfulModel = tryModel;
                    console.log(`✅ Successfully used model: ${tryModel}`);
                    break; // Success, exit loop
                } catch (modelError) {
                    console.warn(`❌ Model ${tryModel} failed:`, modelError.message);
                    lastError = modelError;

                    const msg = (modelError.message || '').toLowerCase();
                    const status = modelError.status || modelError.code;

                    // If it's clearly a quota/billing issue, stop trying
                    if ((status === 429) || msg.includes('quota') || msg.includes('billing')) {
                        console.warn('Stopping model attempts due to quota/billing error');
                        break;
                    }
                    // Otherwise continue to next model
                }
            }
            
            // If all models failed, throw the last error
            if (!generatedQuestions) {
                throw lastError || new Error('All model attempts failed');
            }
            
            console.log('Gemini API call successful');
            
            if (!generatedQuestions || generatedQuestions.trim().length === 0) {
                console.error('No content in Gemini response:', response);
                throw new ApiError(500, 'Failed to generate exam questions - no response from AI');
            }
            
            console.log('Successfully generated exam questions');
            
            // Notify enrolled students about the exam if courseId is provided
            if (courseId && course) {
                try {
                    await notifyStudentsAboutExam({
                        course,
                        subjectName,
                        examType: examTypeValue,
                        topic: topic || 'general',
                        numberOfQuestions: numQuestionsParsed,
                        teacherId: req.user._id
                    });
                } catch (notifyError) {
                    // Log error but don't fail the request
                    console.error('Error notifying students about exam:', notifyError);
                }
            }
            
            // Parse questions and save as assignment if saveAsAssignment is true
            let savedAssignment = null;
            if (req.body.saveAsAssignment === true && courseId && course) {
                try {
                    savedAssignment = await saveExamAsAssignment({
                        questions: generatedQuestions,
                        course,
                        subjectName,
                        examType: examTypeValue,
                        topic: topic || 'general',
                        maxScore: maxScore || numQuestionsParsed * 10,
                        teacherId: req.user._id,
                        dueDate: req.body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
                    });
                } catch (saveError) {
                    console.error('Error saving exam as assignment:', saveError);
                    // Continue even if saving fails
                }
            }
            
            // Return success response
            res.status(200).json(
                new ApiResponse(200, {
                    questions: generatedQuestions.trim(),
                    assignment: savedAssignment,
                    metadata: {
                        numberOfQuestions: numQuestionsParsed,
                        subject: subjectName,
                        difficulty: difficulty || 'not specified',
                        topic: topic || 'general',
                        examType: examTypeValue || 'not specified',
                        courseId: courseId || null,
                        model: successfulModel || 'unknown',
                        generatedAt: new Date().toISOString()
                    }
                }, 'Exam questions generated successfully')
            );
            return;
            
        } catch (geminiError) {
            console.error('Gemini API call failed:', {
                message: geminiError.message,
                status: geminiError.status,
                code: geminiError.code,
                response: geminiError.response
            });
            throw geminiError;
        }

    } catch (error) {
        // Handle API errors
        if (error instanceof ApiError) {
            console.error('ApiError in exam generation:', error.message);
            return next(error);
        }

        // Handle Gemini-specific errors
        if (error.message) {
            const errorMessage = error.message;
            console.error('Gemini API Error Details:', {
                message: errorMessage,
                name: error.name
            });
            
            // Provide user-friendly error messages
            let userMessage = 'Failed to generate exam questions';
            let httpStatus = 500;

            const lower = errorMessage.toLowerCase();
            
            if (lower.includes('api key') || lower.includes('invalid api key')) {
                userMessage = 'Gemini API key is invalid or missing. Please check your GEMINI_API_KEY in the backend environment.';
                httpStatus = 401;
            } else if (lower.includes('quota') || lower.includes('billing')) {
                userMessage = 'Gemini API quota exceeded. Please check your Google Cloud billing and quota limits.';
                httpStatus = 429;
            } else if (lower.includes('safety') || lower.includes('blocked')) {
                userMessage = 'Content was blocked by safety filters. Please try with different parameters.';
                httpStatus = 400;
            } else if (lower.includes('model') || lower.includes('not found')) {
                // This is a configuration issue, not a missing HTTP route,
                // so return 500 with a clear message instead of 404.
                userMessage = 'Gemini model configuration error. Please verify GEMINI_MODEL (if set) and that your API key has access to the selected model.';
                httpStatus = 500;
            } else {
                userMessage = `Gemini API error: ${errorMessage}`;
            }
            
            return next(new ApiError(
                httpStatus, 
                userMessage,
                [errorMessage]
            ));
        }

        // Handle other errors (network, timeout, etc.)
        console.error('Exam generation error (non-Gemini):', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return next(new ApiError(
            500, 
            `Failed to generate exam questions: ${error.message || 'Unknown error'}`,
            [error.message || 'Unknown error occurred']
        ));
    }
};

/**
 * Helper function to notify students about a generated exam
 */
const notifyStudentsAboutExam = async ({ course, subjectName, examType, topic, numberOfQuestions, teacherId }) => {
    try {
        // Find all enrolled students in the course
        const enrollments = await Enrollment.find({
            course: course._id,
            status: 'enrolled',
        });

        if (enrollments.length === 0) {
            console.log('No enrolled students found for course, skipping notification');
            return;
        }

        // Format exam type label
        const examTypeLabels = {
            midterm: 'Midterm Exam',
            final: 'Final Exam',
            quiz: 'Quiz',
            assignment: 'Assignment',
        };
        const examTypeLabel = examTypeLabels[examType] || 'Exam';

        // Create announcement title and content
        const title = `New ${examTypeLabel} Generated: ${subjectName}`;
        const content = `A new ${examTypeLabel.toLowerCase()} has been generated for ${course.subject?.name || subjectName}${topic && topic !== 'general' ? ` (Topic: ${topic})` : ''}. The exam contains ${numberOfQuestions} questions. Please check your assignments or course materials for details.`;

        // Create announcement for enrolled students
        await Announcement.create({
            title,
            content,
            category: 'Exam',
            priority: 'high',
            author: teacherId,
            audience: 'students',
            course: course._id,
            isPublished: true,
            publishAt: new Date(),
        });

        console.log(`✅ Created announcement for ${enrollments.length} enrolled students`);
    } catch (error) {
        console.error('Error creating exam notification:', error);
        throw error;
    }
};

/**
 * Parse AI-generated questions and save as Assignment
 */
const parseAndSaveQuestions = (questionsText) => {
    const questions = [];
    const questionBlocks = questionsText.split(/Question\s+\d+:/i).filter(block => block.trim());
    
    questionBlocks.forEach((block) => {
        const lines = block.trim().split('\n').filter(line => line.trim());
        if (lines.length < 5) return;
        
        const questionText = lines[0].trim();
        const options = {};
        let correctAnswer = null;
        
        lines.slice(1).forEach(line => {
            const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
            if (optionMatch) {
                options[optionMatch[1].toUpperCase()] = optionMatch[2].trim();
            }
            
            const answerMatch = line.match(/Correct Answer:\s*([A-D])/i);
            if (answerMatch) {
                correctAnswer = answerMatch[1].toUpperCase();
            }
        });
        
        if (questionText && Object.keys(options).length === 4 && correctAnswer) {
            questions.push({
                question: questionText,
                options: { A: options.A || '', B: options.B || '', C: options.C || '', D: options.D || '' },
                correctAnswer: correctAnswer,
                points: 1,
            });
        }
    });
    
    return questions;
};

/**
 * Save generated exam as an Assignment
 */
const saveExamAsAssignment = async ({ questions, course, subjectName, examType, topic, maxScore, teacherId, dueDate }) => {
    try {
        const parsedQuestions = parseAndSaveQuestions(questions);
        if (parsedQuestions.length === 0) {
            throw new Error('Could not parse questions from generated text');
        }
        
        const assignment = await Assignment.create({
            title: `${examType ? examType.charAt(0).toUpperCase() + examType.slice(1) : 'Exam'} - ${subjectName}${topic && topic !== 'general' ? ` (${topic})` : ''}`,
            description: `AI-generated ${examType || 'exam'} for ${subjectName}. Contains ${parsedQuestions.length} multiple-choice questions.`,
            course: course._id,
            teacher: teacherId,
            type: examType || 'midterm',
            dueDate: new Date(dueDate),
            maxScore: maxScore || parsedQuestions.length * 10,
            instructions: `Please answer all ${parsedQuestions.length} questions. Each question is worth ${Math.round((maxScore || parsedQuestions.length * 10) / parsedQuestions.length)} points.`,
            questions: parsedQuestions,
            isPublished: true,
            publishedAt: new Date(),
        });
        
        console.log(`✅ Saved exam as assignment: ${assignment._id}`);
        return assignment;
    } catch (error) {
        console.error('Error saving exam as assignment:', error);
        throw error;
    }
};

/**
 * Get exam/assignment for student to take
 * GET /api/v1/exam/:examId
 */
export const getExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;
        
        const exam = await Assignment.findById(examId)
            .populate('course', 'name subject')
            .populate('teacher', 'username email');
        
        if (!exam) {
            throw new ApiError(404, 'Exam not found');
        }
        
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: exam.course._id,
            status: 'enrolled',
        });
        
        if (!enrollment) {
            throw new ApiError(403, 'You are not enrolled in this course');
        }
        
        if (!exam.isPublished) {
            throw new ApiError(403, 'This exam is not yet published');
        }
        
        const existingResult = await ExamResult.findOne({
            exam: examId,
            student: studentId,
        });
        
        if (existingResult && existingResult.status === 'submitted') {
            return res.status(200).json(
                new ApiResponse(200, {
                    exam: {
                        _id: exam._id,
                        title: exam.title,
                        description: exam.description,
                        type: exam.type,
                        maxScore: exam.maxScore,
                        dueDate: exam.dueDate,
                    },
                    hasSubmitted: true,
                    result: existingResult,
                }, 'Exam retrieved (already submitted)')
            );
        }
        
        const examData = exam.toObject();
        const questionsWithoutAnswers = examData.questions.map(q => ({
            question: q.question,
            options: q.options,
            points: q.points,
        }));
        
        res.status(200).json(
            new ApiResponse(200, {
                exam: {
                    ...examData,
                    questions: questionsWithoutAnswers,
                },
                hasSubmitted: false,
                existingResult: existingResult || null,
            }, 'Exam retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Submit exam answers
 * POST /api/v1/exam/:examId/submit
 */
export const submitExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { answers, timeSpent } = req.body;
        const studentId = req.user._id;
        
        const exam = await Assignment.findById(examId)
            .populate('course', 'name subject');
        
        if (!exam) {
            throw new ApiError(404, 'Exam not found');
        }
        
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: exam.course._id,
            status: 'enrolled',
        });
        
        if (!enrollment) {
            throw new ApiError(403, 'You are not enrolled in this course');
        }
        
        let examResult = await ExamResult.findOne({
            exam: examId,
            student: studentId,
        });
        
        if (examResult && examResult.status === 'submitted') {
            throw new ApiError(400, 'You have already submitted this exam');
        }
        
        const gradedAnswers = exam.questions.map((question, index) => {
            const studentAnswer = answers[index]?.selectedAnswer || null;
            const isCorrect = studentAnswer === question.correctAnswer;
            const points = isCorrect ? (question.points || 1) : 0;
            
            return {
                questionIndex: index,
                selectedAnswer: studentAnswer,
                isCorrect,
                points,
            };
        });
        
        const totalScore = gradedAnswers.reduce((sum, answer) => sum + answer.points, 0);
        const maxScore = exam.maxScore || exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        if (examResult) {
            examResult.answers = gradedAnswers;
            examResult.score = totalScore;
            examResult.maxScore = maxScore;
            examResult.percentage = percentage;
            examResult.submittedAt = new Date();
            examResult.status = 'submitted';
            examResult.timeSpent = timeSpent || 0;
            await examResult.save();
        } else {
            examResult = await ExamResult.create({
                exam: examId,
                student: studentId,
                course: exam.course._id,
                answers: gradedAnswers,
                score: totalScore,
                maxScore: maxScore,
                percentage: percentage,
                submittedAt: new Date(),
                status: 'submitted',
                timeSpent: timeSpent || 0,
                isAutoGraded: true,
            });
        }
        
        await examResult.populate('student', 'username email');
        
        res.status(200).json(
            new ApiResponse(200, {
                result: examResult,
                score: totalScore,
                maxScore: maxScore,
                percentage: percentage,
            }, 'Exam submitted successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get exam results for a specific exam (Teacher)
 * GET /api/v1/exam/:examId/results
 */
export const getExamResults = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const teacherId = req.user._id;
        
        const exam = await Assignment.findById(examId);
        
        if (!exam) {
            throw new ApiError(404, 'Exam not found');
        }
        
        if (exam.teacher.toString() !== teacherId.toString() && req.user.role !== 'admin') {
            throw new ApiError(403, 'You are not authorized to view these results');
        }
        
        const results = await ExamResult.find({ exam: examId })
            .populate('student', 'username email profileimage studentProfile')
            .sort({ submittedAt: -1 });
        
        const stats = {
            totalStudents: results.length,
            submitted: results.filter(r => r.status === 'submitted').length,
            averageScore: results.length > 0 
                ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
                : 0,
            averagePercentage: results.length > 0
                ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
                : 0,
            highestScore: results.length > 0 ? Math.max(...results.map(r => r.score)) : 0,
            lowestScore: results.length > 0 ? Math.min(...results.map(r => r.score)) : 0,
        };
        
        res.status(200).json(
            new ApiResponse(200, {
                exam: {
                    _id: exam._id,
                    title: exam.title,
                    type: exam.type,
                    maxScore: exam.maxScore,
                },
                results,
                statistics: stats,
            }, 'Exam results retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get student's exam result
 * GET /api/v1/exam/:examId/my-result
 */
export const getMyExamResult = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const studentId = req.user._id;
        
        const result = await ExamResult.findOne({
            exam: examId,
            student: studentId,
        })
            .populate('exam', 'title type maxScore')
            .populate('course', 'name subject');
        
        if (!result) {
            throw new ApiError(404, 'No result found for this exam');
        }
        
        const exam = await Assignment.findById(examId);
        const resultWithAnswers = result.toObject();
        resultWithAnswers.examDetails = {
            questions: exam.questions.map((q, idx) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                studentAnswer: result.answers[idx]?.selectedAnswer || null,
                isCorrect: result.answers[idx]?.isCorrect || false,
                points: result.answers[idx]?.points || 0,
            })),
        };
        
        res.status(200).json(
            new ApiResponse(200, resultWithAnswers, 'Exam result retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 60 second timeout for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      try {
        // Clear any stale auth state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_) {
        // Ignore storage errors
      }

      // If running in a browser, redirect to login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        formData.append(key, JSON.stringify(userData[key]));
      } else if (key === 'profileimage' && userData[key] instanceof File) {
        formData.append(key, userData[key]);
      } else if (userData[key] !== undefined && userData[key] !== null) {
        formData.append(key, userData[key]);
      }
    });
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  requestOtp: async (email) => {
    const response = await api.post('/auth/request-otp', { email }, {
      timeout: 60000 // Extra timeout for potential cold start
    });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp }, {
      timeout: 30000 // 30 seconds for verification
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// User APIs
export const userAPI = {
  getUser: async (id) => {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        formData.append(key, JSON.stringify(userData[key]));
      } else if (key === 'profileimage' && userData[key] instanceof File) {
        formData.append(key, userData[key]);
      } else if (userData[key] !== undefined && userData[key] !== null) {
        formData.append(key, userData[key]);
      }
    });

    const response = await axios.put(`${API_BASE_URL}/update/user/${id}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true,
    });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/delete/user/${id}`);
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  getAllStudents: async (params = {}) => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },

  getStudentDirectory: async (params = {}) => {
    const response = await api.get('/people/students', { params });
    return response.data;
  },

  getStudentProfile: async (id) => {
    const response = await api.get(`/people/students/${id}`);
    return response.data;
  },
};

// Subject APIs
export const subjectAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },
  
  getDepartments: async () => {
    const response = await api.get('/subjects/departments');
    return response.data;
  },
};

// Semester APIs
export const semesterAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/semesters', { params });
    return response.data;
  },
  
  getCurrent: async () => {
    const response = await api.get('/semesters/current');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/semesters/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/semesters', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/semesters/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/semesters/${id}`);
    return response.data;
  },
  
  setCurrent: async (id) => {
    const response = await api.patch(`/semesters/${id}/set-current`);
    return response.data;
  },
};

// Course APIs
export const courseAPI = {
    getUnassigned: async () => {
      const response = await api.get('/courses/unassigned');
      return response.data;
    },
  getAll: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },
  
  getAvailable: async (params = {}) => {
    const response = await api.get('/courses/available', { params });
    return response.data;
  },
  
  getMyCourses: async (params = {}) => {
    const response = await api.get('/courses/my-courses', { params });
    return response.data;
  },
  
  getByTeacher: async (teacherId) => {
    const response = await api.get(`/courses/teacher/${teacherId}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  
  getStudents: async (id) => {
    const response = await api.get(`/courses/${id}/students`);
    return response.data;
  },
  
  assignTeacher: async (courseId, teacherId) => {
    const response = await api.patch(`/courses/${courseId}/assign-teacher`, { teacherId });
    return response.data;
  },
  
  removeTeacher: async (courseId) => {
    const response = await api.patch(`/courses/${courseId}/remove-teacher`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/courses', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};

// Enrollment APIs
export const enrollmentAPI = {
  enroll: async (courseId) => {
    const response = await api.post('/enrollments/enroll', { courseId });
    return response.data;
  },
  
  drop: async (enrollmentId, reason) => {
    const response = await api.patch(`/enrollments/${enrollmentId}/drop`, { reason });
    return response.data;
  },
  
  getMyEnrollments: async (params = {}) => {
    const response = await api.get('/enrollments/my-enrollments', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },
  
  getCourseEnrollments: async (courseId) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
  },
  
  getStudentEnrollments: async (studentId, params = {}) => {
    const response = await api.get(`/enrollments/student/${studentId}`, { params });
    return response.data;
  },
  
  updateProgress: async (enrollmentId, data) => {
    const response = await api.patch(`/enrollments/${enrollmentId}/progress`, data);
    return response.data;
  },
  
  updateScores: async (enrollmentId, data) => {
    const response = await api.patch(`/enrollments/${enrollmentId}/scores`, data);
    return response.data;
  },
  
  adminEnroll: async (studentId, courseId) => {
    const response = await api.post('/enrollments/admin-enroll', { studentId, courseId });
    return response.data;
  },
};

// Grade APIs
export const gradeAPI = {
  getMyGrades: async (params = {}) => {
    const response = await api.get('/grades/my-grades', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/grades', data);
    return response.data;
  },

  getTeacherOverview: async () => {
    const response = await api.get('/grades/analytics/teacher/overview');
    return response.data;
  },

  getAdminOverview: async () => {
    const response = await api.get('/grades/analytics/admin/overview');
    return response.data;
  },
  
  getCourseGrades: async (courseId) => {
    const response = await api.get(`/grades/course/${courseId}`);
    return response.data;
  },
  
  assignGrade: async (enrollmentId, remarks) => {
    const response = await api.post(`/grades/assign/${enrollmentId}`, { remarks });
    return response.data;
  },
  
  finalizeGrade: async (gradeId) => {
    const response = await api.patch(`/grades/finalize/${gradeId}`);
    return response.data;
  },
  
  bulkFinalize: async (courseId) => {
    const response = await api.post(`/grades/bulk-finalize/${courseId}`);
    return response.data;
  },
  
  getTranscript: async (studentId = null) => {
    const url = studentId ? `/grades/transcript/${studentId}` : '/grades/transcript';
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },
  
  getAnalytics: async (studentId = null) => {
    const url = studentId ? `/grades/analytics/${studentId}` : '/grades/analytics';
    const response = await api.get(url);
    return response.data;
  },
};

// Announcement APIs
export const announcementAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get('/announcements/categories');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/announcements/unread-count');
    return response.data;
  },
  
  getMyAnnouncements: async () => {
    const response = await api.get('/announcements/my-announcements');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
  
  togglePin: async (id) => {
    const response = await api.patch(`/announcements/${id}/toggle-pin`);
    return response.data;
  },
};

// Assignment APIs
export const assignmentAPI = {
  create: async (formData) => {
    const response = await axios.post(`${API_BASE_URL}/assignments`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true,
    });
    return response.data;
  },

  getCourseAssignments: async (courseId, params = {}) => {
    const response = await api.get(`/assignments/course/${courseId}`, { params });
    return response.data;
  },

  getMyAssignments: async (params = {}) => {
    const response = await api.get('/assignments/my-assignments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  update: async (id, formData) => {
    const response = await axios.put(`${API_BASE_URL}/assignments/${id}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true,
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  togglePublish: async (id) => {
    const response = await api.patch(`/assignments/${id}/toggle-publish`);
    return response.data;
  },

  generateExam: async (data) => {
    const response = await api.post('/assignments/generate-exam', data);
    return response.data;
  },
};

export default api;

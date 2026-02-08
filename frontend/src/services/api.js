import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const api = axios.create({ baseURL: API_BASE_URL });

// Interceptor for Auth
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- AUTH ---
export const login = (creds) => api.post('/auth/login', creds);
export const register = (data) => api.post('/auth/register', data);

// --- PASSWORD RESET ---
export const requestPasswordReset = (email) => axios.post(`${API_BASE_URL}/password-reset/request`, { email });
export const verifyResetCode = (email, code) => axios.post(`${API_BASE_URL}/password-reset/verify-code`, { email, code });
export const resetPassword = (email, code, newPassword) => axios.post(`${API_BASE_URL}/password-reset/reset`, { email, code, newPassword });

// --- ADMIN ROOM & REVENUE ---
export const getRooms = () => api.get('/rooms');
export const getAdminRoomsFull = () => api.get('/admin/rooms-full');
export const getPublicRooms = () => api.get('/public/rooms');
export const getAllRoomsWithBookingInfo = () => api.get('/rooms/all-with-booking-info');
export const getRoomFull = (id) => api.get(`/rooms/${id}/full`);
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);
export const sendToMaintenance = (id) => api.put(`/rooms/${id}/set-maintenance`);
export const sendToCleaning = (id) => api.put(`/rooms/${id}/set-cleaning`);
export const makeRoomAvailable = (id) => api.put(`/rooms/${id}/make-available`);
export const checkoutGuest = (id) => api.patch(`/admin/rooms/checkout/${id}`);
export const getRevenue = () => api.get('/admin/revenue');
export const getRevenueReport = () => api.get('/admin/revenue-report');

// --- COMING SOON ROOMS ---
export const createComingSoonRoom = (data) => api.post('/rooms/coming-soon', data);
export const getComingSoonRooms = () => api.get('/rooms/coming-soon');
export const updateComingSoonRoom = (id, data) => api.patch(`/rooms/coming-soon/${id}`, data);
export const makeComingSoonAvailable = (id, data) => api.patch(`/rooms/make-available/${id}`, data);

// --- ADMIN BOOKINGS ---
export const getPendingBookings = () => api.get('/admin/bookings/pending');
export const confirmBooking = (id) => api.patch(`/admin/bookings/confirm/${id}`);
export const getAllBookings = () => api.get('/bookings');

// --- USER BOOKING OPERATIONS ---
export const createBooking = (bookingData) => api.post('/user/book', bookingData);
export const bookRoom = (data) => api.post('/user/book', data);
export const getMyBookings = () => api.get('/user/my-bookings');

// --- STAFF OPERATIONS ---
export const getStaffTasks = () => api.get('/staff/tasks');
export const getRoomsNeedingCleaning = () => api.get('/rooms/cleaning');
export const startWork = (id) => api.patch(`/staff/start-work/${id}`);
export const completeWork = (id) => api.patch(`/staff/complete-work/${id}`);
export const markCleaned = (id) => api.put(`/rooms/${id}/clean`);

// --- PAYMENT & EMAIL ---
export const sendEmailInvoice = (data) => api.post('/admin/send-invoice', data);
export const createPaymentIntent = (data) => api.post('/user/create-payment-intent', data);

// --- DISCOUNTS ---
export const getActiveDiscounts = () => api.get('/discounts/active');
export const getAllDiscounts = () => api.get('/discounts');
export const createDiscount = (data) => api.post('/discounts', data);
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data);
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`);
export const calculateApplicableDiscounts = (data) => api.post('/discounts/calculate', data);

// --- CONTACT MESSAGES ---
export const submitContactForm = (data) => axios.post(`${API_BASE_URL}/contact/submit`, data);
export const getAllContacts = () => api.get('/contact');
export const replyToContact = (id, reply) => api.post(`/contact/${id}/reply`, { reply });
export const updateContactStatus = (id, status) => api.patch(`/contact/${id}/status`, { status });
export const deleteContact = (id) => api.delete(`/contact/${id}`);

// --- REVIEWS ---
export const getApprovedReviews = () => axios.get(`${API_BASE_URL}/reviews/approved`);
export const submitReview = (data) => api.post('/reviews/submit', data);
export const getMyReviews = () => api.get('/reviews/my-reviews');
export const getAllReviews = (status) => api.get('/reviews/all', { params: { status } });
export const getReviewStats = () => api.get('/reviews/stats');
export const approveReview = (id) => api.patch(`/reviews/${id}/approve`);
export const rejectReview = (id, reason) => api.patch(`/reviews/${id}/reject`, { reason });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);

export default api;

import { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Card, Row, Col, Table, Form, Modal, Alert, Badge, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, Calendar, Settings, LogOut, Plus, Edit3, Eye, 
  TrendingUp, Bed, Clock, CheckCircle, AlertCircle,
  BarChart3, PieChart, Download, Mail, Search, Filter,
  Star, Wifi, Car, Coffee, Dumbbell, MapPin, Phone,
  Brush, Wrench, PlayCircle, CheckSquare, AlertTriangle, Tag
} from 'lucide-react';
import PakistaniRupeeIcon from './PakistaniRupeeIcon';
import api, { 
  createRoom, 
  getRevenue, 
  getRevenueReport, 
  getRooms, 
  updateRoom, 
  getPendingBookings,
  getAllBookings,
  createComingSoonRoom,
  getComingSoonRooms,
  updateComingSoonRoom,
  makeComingSoonAvailable,
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewStats
} from '../services/api';

// --- PDF GENERATION ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CHART.JS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [revenueReport, setRevenueReport] = useState([]);
  const [detailedRevenue, setDetailedRevenue] = useState([]);
  const [comingSoonRooms, setComingSoonRooms] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('PENDING');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'WEEKEND',
    percentage: '',
    description: '',
    season: '',
    minRooms: 1,
    startDate: '',
    endDate: '',
    isActive: true
  });

  // --- SEARCH & FILTER STATES ---
  const [searchName, setSearchName] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // --- COMING SOON MODAL STATES ---
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showMakeAvailableModal, setShowMakeAvailableModal] = useState(false);
  const [selectedComingSoonRoom, setSelectedComingSoonRoom] = useState(null);
  const [comingSoonImages, setComingSoonImages] = useState([]);

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    type: 'single',
    price: '',
    capacity: 1,
    images: [],
    features: [],
  });

  const goldColor = "#d4af37";

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [roomsRes, revenueRes, reportRes, pendingRes, allBookingsRes, detailedRes] = await Promise.all([
        getRooms(),
        getRevenue(),
        getRevenueReport(),
        getPendingBookings(),
        getAllBookings(),
        api.get('/admin/revenue-detailed')
      ]);
      setAllRooms(roomsRes.data);
      setRevenue(revenueRes.data);
      setRevenueReport(reportRes.data);
      setPendingBookings(pendingRes.data);
      setAllBookings(allBookingsRes.data);
      setDetailedRevenue(detailedRes.data.history || []);
      
      // Fetch discounts separately with error handling
      try {
        const discountsRes = await getAllDiscounts();
        setDiscounts(discountsRes.data || []);
      } catch (discountError) {
        console.error('Error fetching discounts:', discountError);
        setDiscounts([]);
      }
      
      // Fetch reviews
      fetchReviews();
      
      // Also fetch coming soon rooms
      fetchComingSoonRooms();
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlert({ show: true, message: 'Failed to sync with server.', variant: 'danger' });
    }
  };

  const fetchReviews = async (status = '') => {
    try {
      const response = await getAllReviews(status);
      setReviews(response.data.reviews || []);
      
      // Fetch stats
      const statsResponse = await getReviewStats();
      setReviewStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleApproveReview = async (id) => {
    try {
      setLoading(true);
      await approveReview(id);
      showAlert('Review approved successfully!', 'success');
      fetchReviews(reviewFilter);
    } catch (error) {
      showAlert('Failed to approve review', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReview = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      setLoading(true);
      await rejectReview(id, reason);
      showAlert('Review rejected', 'warning');
      fetchReviews(reviewFilter);
    } catch (error) {
      showAlert('Failed to reject review', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setLoading(true);
      await deleteReview(id);
      showAlert('Review deleted successfully', 'success');
      fetchReviews(reviewFilter);
    } catch (error) {
      showAlert('Failed to delete review', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        fill={index < rating ? goldColor : 'none'}
        color={index < rating ? goldColor : 'rgba(255, 255, 255, 0.3)'}
      />
    ));
  };

  const fetchComingSoonRooms = async () => {
    try {
      const response = await getComingSoonRooms();
      setComingSoonRooms(response.data);
    } catch (error) {
      console.error('Error fetching coming soon rooms:', error);
    }
  };

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  // Image handling for coming soon rooms
  const handleComingSoonImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setComingSoonImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeComingSoonImage = (index) => {
    setComingSoonImages(prev => prev.filter((_, i) => i !== index));
  };

  // --- FILTER LOGIC ---
  const filteredRevenue = (detailedRevenue || []).filter((item) => {
    const matchesName = item.user?.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesDate = filterDate ? new Date(item.createdAt).toLocaleDateString() === new Date(filterDate).toLocaleDateString() : true;
    return matchesName && matchesDate;
  });

  // --- FIXED PDF GENERATION LOGIC ---
  const generateInvoicePDF = (type) => {
    const doc = new jsPDF();
    const title = type === 'monthly' ? "Monthly Revenue Report" : "Annual Financial Statement";

    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("GRAND HOTEL MANAGEMENT", 14, 15);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 25);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    if (searchName) doc.text(`Filter: Guest - ${searchName}`, 14, 39);

    // Table Setup
    const tableColumn = ["Date", "Guest", "Room", "Stay", "Method", "Paid"];
    const tableRows = filteredRevenue.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      item.user?.name || 'N/A',
      `Room ${item.room?.roomNumber}`,
      `${Math.ceil(Math.abs(new Date(item.checkOut) - new Date(item.checkIn)) / (1000 * 60 * 60 * 24))} Days`,
      item.paymentMethod,
      `Rs ${(item.amountPaid || 0).toFixed(0)}`
    ]);

    // Calling autoTable via the plugin reference to avoid "not a function" error
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 }
    });

    const total = filteredRevenue.reduce((sum, item) => sum + (item.amountPaid || 0), 0);
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Collected: Rs ${total.toFixed(0)}`, 14, finalY);

    doc.save(`Hotel_Report_${type}_${new Date().getTime()}.pdf`);
  };
  // --- ACTIONS ---
  const handleApproveBooking = async (bookingId) => {
    try {
      await api.patch(`/admin/bookings/confirm/${bookingId}`);
      setAlert({ show: true, message: 'Booking confirmed!', variant: 'success' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Approval failed', variant: 'danger' }); }
  };

  const handleCheckOut = async (roomId) => {
    try {
      await api.patch(`/admin/rooms/checkout/${roomId}`);
      setAlert({ show: true, message: 'Guest checked out. Room needs cleaning.', variant: 'info' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Check-out failed', variant: 'danger' }); }
  };

  const handleSendToMaintenance = async (roomId) => {
    try {
      await api.put(`/rooms/${roomId}/set-maintenance`);
      setAlert({ show: true, message: 'Room sent to maintenance.', variant: 'warning' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Update failed', variant: 'danger' }); }
  };

  const handleStartWork = async (roomId) => {
    try {
      await api.patch(`/staff/start-work/${roomId}`);
      setAlert({ show: true, message: 'Maintenance work started.', variant: 'info' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Update failed', variant: 'danger' }); }
  };

  const handleCompleteWork = async (roomId) => {
    try {
      await api.patch(`/staff/complete-work/${roomId}`);
      setAlert({ show: true, message: 'Maintenance work completed. Room is now available!', variant: 'success' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Update failed', variant: 'danger' }); }
  };

  const handleSendToCleaning = async (roomId) => {
    try {
      await api.put(`/rooms/${roomId}/set-cleaning`);
      setAlert({ show: true, message: 'Room sent for cleaning.', variant: 'info' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Update failed', variant: 'danger' }); }
  };

  const handleMakeAvailable = async (roomId) => {
    try {
      await api.put(`/rooms/${roomId}/make-available`);
      setAlert({ show: true, message: 'Room is now available!', variant: 'success' });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Update failed', variant: 'danger' }); }
  };

  const handleUpdateRoomStatuses = async () => {
    try {
      setLoading(true);
      await api.patch('/rooms/update-statuses');
      await fetchAllData();
      setAlert({ show: true, message: 'Room statuses updated based on current bookings', variant: 'success' });
    } catch (error) {
      setAlert({ show: true, message: 'Failed to update room statuses', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRoom({ ...roomForm, price: parseFloat(roomForm.price) });
      setAlert({ show: true, message: 'Room Created!', variant: 'success' });
      setShowModal(false);
      setRoomForm({ roomNumber: '', type: 'single', price: '', capacity: 1, images: [], features: [] });
      fetchAllData();
    } catch (error) { setAlert({ show: true, message: 'Failed to create room', variant: 'danger' }); } finally { setLoading(false); }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setRoomForm(prev => ({
        ...prev,
        images: [...prev.images, ...images]
      }));
    });
  };

  // Remove image
  const removeImage = (index) => {
    setRoomForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Add feature
  const addFeature = () => {
    const feature = prompt("Enter room feature:");
    if (feature && feature.trim()) {
      setRoomForm(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
    }
  };

  // Remove feature
  const removeFeature = (index) => {
    setRoomForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Show room details
  const showRoomDetails = (room) => {
    setSelectedRoom(room);
    setShowDetailsModal(true);
  };

  // Edit room details
  const editRoom = (room) => {
    console.log('Editing room:', room);
    setRoomForm({
      roomNumber: room.roomNumber || '',
      type: room.type || 'single',
      price: room.price?.toString() || '',
      capacity: room.capacity || 1,
      images: room.images || [],
      features: room.features || [],
    });
    setSelectedRoom(room);
    setShowDetailsModal(false); // Close details modal
    setShowModal(true); // Open edit modal
  };
  // Update room
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const updateData = { 
      ...roomForm, 
      price: parseFloat(roomForm.price) || 0 
    };
    
    console.log('Updating room:', selectedRoom._id);
    console.log('Update data:', updateData);
    
    try {
      const response = await updateRoom(selectedRoom._id, updateData);
      console.log('Update response:', response);
      setAlert({ show: true, message: 'Room Updated Successfully!', variant: 'success' });
      setShowModal(false);
      setSelectedRoom(null);
      setRoomForm({ roomNumber: '', type: 'single', price: '', capacity: 1, images: [], features: [] });
      fetchAllData();
    } catch (error) { 
      console.error('Update error:', error);
      console.error('Error response:', error.response);
      setAlert({ 
        show: true, 
        message: error.response?.data?.message || 'Failed to update room. Please check console for details.', 
        variant: 'danger' 
      }); 
    } finally { 
      setLoading(false); 
    }
  };

  const stats = {
    total: allRooms.length,
    available: allRooms.filter(r => r.status === 'AVAILABLE').length,
    occupied: allRooms.filter(r => r.status === 'OCCUPIED').length,
    needsCleaning: allRooms.filter(r => r.status === 'NEEDS_CLEANING').length,
    maintenance: allRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'WORKING_IN_PROGRESS').length,
    comingSoon: allRooms.filter(r => r.status === 'COMING_SOON').length,
    pending: pendingBookings.length
  };

  const totalRevenue = (revenue || []).reduce((sum, item) => sum + (item.revenue || 0), 0);

  // Chart data for monthly revenue
  const monthlyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: Array.from({ length: 12 }, (_, i) => {
          const monthRevenue = (detailedRevenue || [])
            .filter(item => item.createdAt && new Date(item.createdAt).getMonth() === i)
            .reduce((sum, item) => sum + (item.amountPaid || 0), 0);
          return monthRevenue;
        }),
        backgroundColor: 'rgba(212, 175, 55, 0.8)',
        borderColor: goldColor,
        borderWidth: 2,
      },
    ],
  };

  // Chart data for yearly revenue
  const currentYear = new Date().getFullYear();
  const yearlyChartData = {
    labels: Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString()),
    datasets: [
      {
        label: 'Yearly Revenue',
        data: Array.from({ length: 5 }, (_, i) => {
          const year = currentYear - 4 + i;
          const yearRevenue = (detailedRevenue || [])
            .filter(item => item.createdAt && new Date(item.createdAt).getFullYear() === year)
            .reduce((sum, item) => sum + (item.amountPaid || 0), 0);
          return yearRevenue;
        }),
        backgroundColor: 'rgba(25, 135, 84, 0.8)',
        borderColor: '#198754',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
      },
    ],
  };
  const handleEmailInvoice = async (item) => {
    const doc = new jsPDF();

    // 1. Generate the same PDF content
    doc.text("GRAND HOTEL INVOICE", 14, 15);
    autoTable(doc, {
      head: [["Date", "Guest", "Room", "Paid"]],
      body: [[
        new Date(item.createdAt).toLocaleDateString(),
        item.user?.name,
        `Room ${item.room?.roomNumber}`,
        `Rs ${item.amountPaid || 0}`
      ]],
      startY: 25
    });

    // 2. Convert PDF to Base64 string
    const pdfBase64 = doc.output('datauristring');

    // 3. Send to Backend
    setLoading(true);
    try {
      await api.post('/admin/send-invoice', {
        email: item.user?.email,
        guestName: item.user?.name,
        pdfBase64: pdfBase64
      });
      setAlert({ show: true, message: `Invoice sent to ${item.user?.email}`, variant: 'success' });
    } catch (error) {
      setAlert({ show: true, message: "Email failed to send.", variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  // Discount management functions
  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build clean discount data - only include non-empty fields
      const discountData = {
        name: discountForm.name,
        type: discountForm.type,
        percentage: parseFloat(discountForm.percentage),
        isActive: discountForm.isActive
      };
      
      // Add optional fields only if they have values
      if (discountForm.description && discountForm.description.trim()) {
        discountData.description = discountForm.description;
      }
      
      if (discountForm.season && discountForm.season.trim()) {
        discountData.season = discountForm.season;
      }
      
      if (discountForm.minRooms && discountForm.minRooms > 1) {
        discountData.minRooms = parseInt(discountForm.minRooms);
      }
      
      if (discountForm.startDate && discountForm.startDate.trim()) {
        discountData.startDate = discountForm.startDate;
      }
      
      if (discountForm.endDate && discountForm.endDate.trim()) {
        discountData.endDate = discountForm.endDate;
      }
      
      console.log('Sending discount data:', discountData);
      
      await createDiscount(discountData);
      showAlert('Discount created successfully!', 'success');
      setShowDiscountModal(false);
      setDiscountForm({
        name: '',
        type: 'WEEKEND',
        percentage: '',
        description: '',
        season: '',
        minRooms: 1,
        startDate: '',
        endDate: '',
        isActive: true
      });
      fetchAllData();
    } catch (error) {
      console.error('Create discount error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create discount';
      showAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build clean discount data - only include non-empty fields
      const discountData = {
        name: discountForm.name,
        type: discountForm.type,
        percentage: parseFloat(discountForm.percentage),
        isActive: discountForm.isActive
      };
      
      // Add optional fields only if they have values
      if (discountForm.description && discountForm.description.trim()) {
        discountData.description = discountForm.description;
      }
      
      if (discountForm.season && discountForm.season.trim()) {
        discountData.season = discountForm.season;
      }
      
      if (discountForm.minRooms && discountForm.minRooms > 1) {
        discountData.minRooms = parseInt(discountForm.minRooms);
      }
      
      if (discountForm.startDate && discountForm.startDate.trim()) {
        discountData.startDate = discountForm.startDate;
      }
      
      if (discountForm.endDate && discountForm.endDate.trim()) {
        discountData.endDate = discountForm.endDate;
      }
      
      console.log('Updating discount with data:', discountData);
      
      await updateDiscount(selectedDiscount._id, discountData);
      showAlert('Discount updated successfully!', 'success');
      setShowDiscountModal(false);
      setSelectedDiscount(null);
      setDiscountForm({
        name: '',
        type: 'WEEKEND',
        percentage: '',
        description: '',
        season: '',
        minRooms: 1,
        startDate: '',
        endDate: '',
        isActive: true
      });
      fetchAllData();
    } catch (error) {
      console.error('Update discount error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update discount';
      showAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;
    setLoading(true);
    try {
      await deleteDiscount(id);
      showAlert('Discount deleted successfully!', 'success');
      fetchAllData();
    } catch (error) {
      showAlert('Failed to delete discount', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const editDiscount = (discount) => {
    setSelectedDiscount(discount);
    setDiscountForm({
      name: discount.name,
      type: discount.type,
      percentage: discount.percentage.toString(),
      description: discount.description || '',
      season: discount.season || '',
      minRooms: discount.minRooms || 1,
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
      isActive: discount.isActive
    });
    setShowDiscountModal(true);
  };

  // Helper function to render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">📊 Dashboard Overview</h4>
              <div className="text-white opacity-75">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <Row className="g-4">
              <Col md={6}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Header className="border-0 text-white" style={{ background: 'rgba(13, 110, 253, 0.3)' }}>
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      <BarChart3 size={18} />
                      Monthly Revenue
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Bar data={monthlyChartData} options={{
                      responsive: true,
                      plugins: {
                        legend: { 
                          position: 'top',
                          labels: { color: 'white' }
                        },
                        title: { 
                          display: true, 
                          text: 'Monthly Revenue Breakdown',
                          color: 'white'
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          ticks: { color: 'white' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                          ticks: { color: 'white' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }} />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      <TrendingUp size={18} />
                      Yearly Trend
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Line data={yearlyChartData} options={{
                      responsive: true,
                      plugins: {
                        legend: { 
                          position: 'top',
                          labels: { color: 'white' }
                        },
                        title: { 
                          display: true, 
                          text: 'Yearly Revenue Growth',
                          color: 'white'
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          ticks: { color: 'white' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                          ticks: { color: 'white' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Card className="card-glass border-0 shadow-lg rounded-4 mt-4">
              <Card.Header className="border-0 text-white" style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <Clock size={18} />
                  Recent Bookings
                </h6>
              </Card.Header>
              <Card.Body>
                <Table className="table-glass rounded-3 overflow-hidden">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBookings.slice(0, 5).map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.user?.name}</td>
                        <td>Room {booking.room?.roomNumber}</td>
                        <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                        <td>
                          <Badge bg="warning" className="px-3 py-1">Pending</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      case 'rooms':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🏠 Room Management</h4>
              <Button 
                className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 shadow-lg"
                style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                onClick={() => setShowModal(true)}
              >
                <Plus size={18} />
                Add Room
              </Button>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Type & Price</th>
                      <th>Images</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.map((room) => (
                      <tr key={room._id}>
                        <td>
                          <div>
                            <div className="fw-bold text-white">Room #{room.roomNumber}</div>
                            <div className="small opacity-75">Capacity: {room.capacity} guests</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="text-capitalize text-white">{room.type}</div>
                            <div className="fw-bold" style={{ color: goldColor }}>Rs {room.price}/night</div>
                          </div>
                        </td>
                        <td>
                          {room.images && room.images.length > 0 ? (
                            <div className="d-flex gap-1">
                              {room.images.slice(0, 2).map((image, index) => (
                                <img 
                                  key={index}
                                  src={image} 
                                  alt={`Room ${room.roomNumber}`}
                                  style={{ width: '40px', height: '30px', objectFit: 'cover' }}
                                  className="rounded border shadow-sm"
                                />
                              ))}
                              {room.images.length > 2 && (
                                <Badge bg="secondary">+{room.images.length - 2}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-white opacity-50">No images</span>
                          )}
                        </td>
                        <td>
                          <Badge 
                            className="px-3 py-2 rounded-pill"
                            bg={
                              room.status === 'AVAILABLE' ? 'success' : 
                              room.status === 'OCCUPIED' ? 'danger' : 
                              room.status === 'NEEDS_CLEANING' ? 'warning' : 
                              room.status === 'COMING_SOON' ? 'secondary' :
                              room.status === 'MAINTENANCE' ? 'info' : 'dark'
                            }
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {room.status === 'NEEDS_CLEANING' ? 'Needs Cleaning' : 
                             room.status === 'COMING_SOON' ? 'Coming Soon' :
                             room.status === 'WORKING_IN_PROGRESS' ? 'Under Repair' : 
                             room.status || 'Available'}
                          </Badge>
                        </td>
                        <td>
                          <ButtonGroup size="sm">
                            <Button 
                              variant="outline-light" 
                              className="btn-glass"
                              onClick={() => showRoomDetails(room)}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="outline-light" 
                              className="btn-glass"
                              onClick={() => editRoom(room)}
                            >
                              <Edit3 size={14} />
                            </Button>
                          </ButtonGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      case 'bookings':
        const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'CHECKED_OUT');
        const pendingOnly = allBookings.filter(b => b.status === 'PENDING');
        
        return (
          <div>
            {/* CONFIRMED BOOKINGS SECTION */}
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="text-white fw-bold mb-0">✅ Confirmed Bookings ({confirmedBookings.length})</h4>
              </div>

              <Card className="card-glass border-0 shadow-lg rounded-4">
                <Card.Body className="p-0">
                  <Table className="table-glass rounded-3 overflow-hidden mb-0">
                    <thead>
                      <tr>
                        <th>Guest Name</th>
                        <th>Email</th>
                        <th>Room</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Stay Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedBookings.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-white py-4">
                            No confirmed bookings yet
                          </td>
                        </tr>
                      ) : (
                        confirmedBookings.map(booking => (
                          <tr key={booking._id}>
                            <td>
                              <div className="fw-bold text-white">{booking.user?.name}</div>
                            </td>
                            <td>
                              <div className="text-white small">{booking.user?.email}</div>
                            </td>
                            <td>
                              <div className="text-white">Room #{booking.room?.roomNumber}</div>
                            </td>
                            <td>
                              <div className="text-white">
                                {booking.paymentMethod === 'Cash' ? '💰 Cash' : '💳 Card'}
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold" style={{ color: goldColor }}>
                                Rs {(booking.amountPaid || booking.totalAmount || 0).toFixed(0)}
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="text-white small">{new Date(booking.checkIn).toLocaleDateString()}</div>
                                <div className="text-white opacity-75 small">to {new Date(booking.checkOut).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td>
                              <Badge 
                                bg={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'CHECKED_IN' ? 'primary' :
                                  booking.status === 'CHECKED_OUT' ? 'secondary' : 'info'
                                }
                                className="px-3 py-1"
                              >
                                {booking.status === 'CONFIRMED' ? '✅ Confirmed' :
                                 booking.status === 'CHECKED_IN' ? '🏨 Checked In' :
                                 booking.status === 'CHECKED_OUT' ? '✅ Completed' : booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>

            {/* PENDING BOOKINGS SECTION */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="text-white fw-bold mb-0">📅 Pending Bookings ({pendingOnly.length})</h4>
              </div>

              <Card className="card-glass border-0 shadow-lg rounded-4">
                <Card.Body className="p-0">
                  <Table className="table-glass rounded-3 overflow-hidden mb-0">
                    <thead>
                      <tr>
                        <th>Guest Name</th>
                        <th>Email</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Stay Period</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOnly.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-white py-4">
                            No pending bookings
                          </td>
                        </tr>
                      ) : (
                        pendingOnly.map(booking => (
                          <tr key={booking._id}>
                            <td>
                              <div className="fw-bold text-white">{booking.user?.name}</div>
                            </td>
                            <td>
                              <div className="text-white small">{booking.user?.email}</div>
                            </td>
                            <td>
                              <div className="text-white">
                                {booking.paymentMethod === 'Cash' ? '💰 Cash' : '💳 Card'}
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold" style={{ color: goldColor }}>
                                Rs {(booking.amountPaid || booking.totalAmount || 0).toFixed(0)}
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="text-white small">{new Date(booking.checkIn).toLocaleDateString()}</div>
                                <div className="text-white opacity-75 small">to {new Date(booking.checkOut).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td>
                              <Button 
                                className="px-4 py-2 rounded-pill border-0 shadow"
                                style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}
                                onClick={() => handleApproveBooking(booking._id)}
                              >
                                <CheckCircle size={16} className="me-2" />
                                Approve
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">💰 Revenue Management</h4>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="btn-glass d-flex align-items-center gap-2"
                  onClick={() => generateInvoicePDF('monthly')}
                >
                  <Download size={16} />
                  Monthly Report
                </Button>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="btn-glass d-flex align-items-center gap-2"
                  onClick={() => generateInvoicePDF('yearly')}
                >
                  <Download size={16} />
                  Yearly Report
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <Card className="card-glass border-0 shadow-lg rounded-4 mb-4">
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="position-relative">
                      <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-white opacity-50" />
                      <Form.Control 
                        className="form-control-glass ps-5 py-3 rounded-pill"
                        placeholder="Search guest name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="position-relative">
                      <Filter size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-white opacity-50" />
                      <Form.Control 
                        type="date"
                        className="form-control-glass ps-5 py-3 rounded-pill"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Guest Details</th>
                      <th>Room & Stay</th>
                      <th>Payment Info</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRevenue.map((item) => {
                      const checkIn = new Date(item.checkIn);
                      const checkOut = new Date(item.checkOut);
                      const nights = Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={item._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">{item.user?.name}</div>
                              <div className="small opacity-75">{item.user?.email}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="text-white">Room #{item.room?.roomNumber}</div>
                              <div className="small opacity-75">
                                {checkIn.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - 
                                {checkOut.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                                ({nights} nights)
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold" style={{ color: goldColor }}>
                                Rs {(item.amountPaid || 0).toFixed(0)}
                              </div>
                              <div className="small opacity-75">
                                <Badge bg="secondary" className="me-1">{item.paymentMethod}</Badge>
                                Total: Rs {(item.totalAmount || 0).toFixed(0)}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Button
                              variant="outline-light"
                              size="sm"
                              className="btn-glass d-flex align-items-center gap-2"
                              onClick={() => handleEmailInvoice(item)}
                              disabled={loading}
                            >
                              <Mail size={14} />
                              {loading ? '...' : 'Email'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      case 'discounts':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🏷️ Discount Management</h4>
              <Button 
                className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 shadow-lg"
                style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                onClick={() => setShowDiscountModal(true)}
              >
                <Plus size={18} />
                Add Discount
              </Button>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Discount Details</th>
                      <th>Type & Value</th>
                      <th>Conditions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((discount) => (
                      <tr key={discount._id}>
                        <td>
                          <div>
                            <div className="fw-bold text-white">{discount.name}</div>
                            {discount.description && (
                              <div className="small opacity-75">{discount.description}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <Badge 
                              bg={
                                discount.type === 'WEEKEND' ? 'primary' :
                                discount.type === 'SEASONAL' ? 'success' :
                                discount.type === 'MULTI_ROOM' ? 'warning' : 'info'
                              }
                              className="mb-1"
                            >
                              {discount.type.replace('_', ' ')}
                            </Badge>
                            <div className="fw-bold" style={{ color: goldColor }}>
                              {discount.percentage}% OFF
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-white small">
                            {discount.type === 'SEASONAL' && discount.season && (
                              <div>Season: {discount.season}</div>
                            )}
                            {discount.type === 'MULTI_ROOM' && discount.minRooms && (
                              <div>Min Rooms: {discount.minRooms}</div>
                            )}
                            {discount.type === 'CUSTOM' && discount.startDate && discount.endDate && (
                              <div>
                                {new Date(discount.startDate).toLocaleDateString()} - 
                                {new Date(discount.endDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={discount.isActive ? 'success' : 'secondary'}
                            className="px-3 py-2 rounded-pill"
                          >
                            {discount.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <ButtonGroup size="sm">
                            <Button 
                              variant="outline-light" 
                              className="btn-glass"
                              onClick={() => editDiscount(discount)}
                            >
                              <Edit3 size={14} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              className="btn-glass"
                              onClick={() => handleDeleteDiscount(discount._id)}
                            >
                              <AlertCircle size={14} />
                            </Button>
                          </ButtonGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      
      case 'reviews':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">⭐ Customer Reviews</h4>
              <div className="d-flex gap-2">
                <ButtonGroup>
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                    <Button
                      key={status}
                      variant={reviewFilter === status ? 'light' : 'outline-light'}
                      size="sm"
                      onClick={() => {
                        setReviewFilter(status);
                        fetchReviews(status === 'ALL' ? '' : status);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
            </div>

            {/* Review Stats */}
            {reviewStats && (
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Card className="card-glass border-0 shadow-lg rounded-4 text-center p-3">
                    <div className="display-6 fw-bold text-white">{reviewStats.total}</div>
                    <div className="small text-white opacity-75">Total Reviews</div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="card-glass border-0 shadow-lg rounded-4 text-center p-3">
                    <div className="display-6 fw-bold" style={{ color: goldColor }}>
                      {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <div className="small text-white opacity-75">Average Rating</div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="card-glass border-0 shadow-lg rounded-4 text-center p-3">
                    <div className="display-6 fw-bold text-warning">
                      {reviewStats.byStatus?.find(s => s._id === 'PENDING')?.count || 0}
                    </div>
                    <div className="small text-white opacity-75">Pending</div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="card-glass border-0 shadow-lg rounded-4 text-center p-3">
                    <div className="display-6 fw-bold text-success">
                      {reviewStats.byStatus?.find(s => s._id === 'APPROVED')?.count || 0}
                    </div>
                    <div className="small text-white opacity-75">Approved</div>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Reviews List */}
            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Rating & Review</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-white py-4">
                          <Star size={40} className="opacity-50 mb-2" />
                          <div>No reviews found</div>
                        </td>
                      </tr>
                    ) : (
                      reviews.map(review => (
                        <tr key={review._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">{review.user?.name || 'Guest'}</div>
                              <div className="small text-white opacity-75">{review.user?.email}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="d-flex gap-1 mb-1">
                                {renderStars(review.rating)}
                              </div>
                              <div className="fw-bold text-white small">{review.title}</div>
                              <div className="small text-white opacity-75" style={{ maxWidth: '300px' }}>
                                {review.comment.substring(0, 100)}
                                {review.comment.length > 100 && '...'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-white small">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <Badge
                              bg={
                                review.status === 'APPROVED' ? 'success' :
                                review.status === 'REJECTED' ? 'danger' : 'warning'
                              }
                              className="px-3 py-2"
                            >
                              {review.status === 'APPROVED' ? '✅ Approved' :
                               review.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {review.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApproveReview(review._id)}
                                    disabled={loading}
                                  >
                                    <CheckCircle size={14} className="me-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleRejectReview(review._id)}
                                    disabled={loading}
                                  >
                                    <AlertCircle size={14} className="me-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteReview(review._id)}
                                disabled={loading}
                              >
                                <AlertTriangle size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );

      case 'staff':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">👥 Staff Task Management</h4>
              <div className="d-flex align-items-center gap-3">
                <Button 
                  variant="outline-light" 
                  size="sm"
                  className="btn-glass d-flex align-items-center gap-2"
                  onClick={handleUpdateRoomStatuses}
                >
                  <CheckCircle size={16} />
                  Update Room Status
                </Button>
                <div className="text-white opacity-75">
                  Monitor and manage all staff assignments
                </div>
              </div>
            </div>

            {/* Staff Task Overview Cards */}
            <Row className="g-4 mb-4">
              <Col md={3}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Body className="text-center py-4">
                    <div className="mb-3">
                      <Brush size={32} className="text-warning" />
                    </div>
                    <h3 className="fw-bold mb-1 text-white">
                      {allRooms.filter(r => r.status === 'NEEDS_CLEANING').length}
                    </h3>
                    <p className="mb-0 text-white opacity-75">Cleaning Tasks</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Body className="text-center py-4">
                    <div className="mb-3">
                      <Wrench size={32} className="text-info" />
                    </div>
                    <h3 className="fw-bold mb-1 text-white">
                      {allRooms.filter(r => r.status === 'MAINTENANCE').length}
                    </h3>
                    <p className="mb-0 text-white opacity-75">Maintenance Queue</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Body className="text-center py-4">
                    <div className="mb-3">
                      <PlayCircle size={32} className="text-primary" />
                    </div>
                    <h3 className="fw-bold mb-1 text-white">
                      {allRooms.filter(r => r.status === 'WORKING_IN_PROGRESS').length}
                    </h3>
                    <p className="mb-0 text-white opacity-75">In Progress</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Body className="text-center py-4">
                    <div className="mb-3">
                      <Bed size={32} className="text-danger" />
                    </div>
                    <h3 className="fw-bold mb-1 text-white">
                      {allRooms.filter(r => r.status === 'OCCUPIED').length}
                    </h3>
                    <p className="mb-0 text-white opacity-75">Occupied Rooms</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Cleaning Tasks Section */}
            <Card className="card-glass border-0 shadow-lg rounded-4 mb-4">
              <Card.Header className="border-0 text-white" style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <Brush size={18} />
                  Rooms Needing Cleaning ({allRooms.filter(r => r.status === 'NEEDS_CLEANING').length})
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Type & Status</th>
                      <th>Assigned Time</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.filter(r => r.status === 'NEEDS_CLEANING').length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <CheckCircle size={40} className="opacity-50" />
                            <div>No cleaning tasks assigned</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      allRooms.filter(r => r.status === 'NEEDS_CLEANING').map((room) => (
                        <tr key={room._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room {room.roomNumber}</div>
                              <div className="small opacity-75">Capacity: {room.capacity} guests</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="text-capitalize text-white">{room.type}</div>
                              <Badge bg="warning" className="px-2 py-1">
                                <Brush size={12} className="me-1" />
                                Needs Cleaning
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <div className="text-white opacity-75">
                              {room.updatedAt ? new Date(room.updatedAt).toLocaleString() : 'Recently assigned'}
                            </div>
                          </td>
                          <td>
                            <Button 
                              variant="outline-light" 
                              size="sm" 
                              className="btn-glass me-2"
                              onClick={() => handleMakeAvailable(room._id)}
                            >
                              <CheckCircle size={14} className="me-1" />
                              Mark Available
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Maintenance Tasks Section */}
            <Card className="card-glass border-0 shadow-lg rounded-4 mb-4">
              <Card.Header className="border-0 text-white" style={{ background: 'rgba(13, 202, 240, 0.3)' }}>
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <Wrench size={18} />
                  Maintenance Tasks ({allRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'WORKING_IN_PROGRESS').length})
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Current Status</th>
                      <th>Progress</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'WORKING_IN_PROGRESS').length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <CheckCircle size={40} className="opacity-50" />
                            <div>No maintenance tasks assigned</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      allRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'WORKING_IN_PROGRESS').map((room) => (
                        <tr key={room._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room {room.roomNumber}</div>
                              <div className="small opacity-75 text-capitalize">{room.type}</div>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={room.status === 'MAINTENANCE' ? 'info' : 'primary'} 
                              className="px-3 py-2 rounded-pill"
                            >
                              {room.status === 'MAINTENANCE' ? (
                                <>
                                  <AlertTriangle size={12} className="me-1" />
                                  Waiting for Staff
                                </>
                              ) : (
                                <>
                                  <PlayCircle size={12} className="me-1" />
                                  Work in Progress
                                </>
                              )}
                            </Badge>
                          </td>
                          <td>
                            <div className="text-white">
                              {room.status === 'MAINTENANCE' ? 'Not Started' : 'Staff Working'}
                            </div>
                          </td>
                          <td>
                            <ButtonGroup size="sm">
                              {room.status === 'MAINTENANCE' && (
                                <Button 
                                  variant="outline-light" 
                                  className="btn-glass"
                                  onClick={() => handleStartWork(room._id)}
                                >
                                  <PlayCircle size={14} className="me-1" />
                                  Start Work
                                </Button>
                              )}
                              {room.status === 'WORKING_IN_PROGRESS' && (
                                <Button 
                                  variant="outline-light" 
                                  className="btn-glass"
                                  onClick={() => handleCompleteWork(room._id)}
                                >
                                  <CheckSquare size={14} className="me-1" />
                                  Complete
                                </Button>
                              )}
                              <Button 
                                variant="outline-light" 
                                className="btn-glass"
                                onClick={() => handleMakeAvailable(room._id)}
                              >
                                <CheckCircle size={14} className="me-1" />
                                Make Available
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Room Assignment Actions */}
            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <Settings size={18} />
                  Quick Room Assignment
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Available Rooms</th>
                      <th>Current Status</th>
                      <th>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.filter(r => r.status === 'AVAILABLE' || r.status === 'OCCUPIED').slice(0, 5).map((room) => (
                      <tr key={room._id}>
                        <td>
                          <div>
                            <div className="fw-bold text-white">Room {room.roomNumber}</div>
                            <div className="small opacity-75 text-capitalize">{room.type} - {room.capacity} guests</div>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={room.status === 'AVAILABLE' ? 'success' : 'danger'} 
                            className="px-3 py-2 rounded-pill"
                          >
                            {room.status === 'AVAILABLE' ? 'Available' : 'Occupied'}
                          </Badge>
                        </td>
                        <td>
                          <ButtonGroup size="sm">
                            <Button 
                              variant="outline-light" 
                              className="btn-glass"
                              onClick={() => handleSendToCleaning(room._id)}
                            >
                              <Brush size={14} className="me-1" />
                              Send Cleaning
                            </Button>
                            <Button 
                              variant="outline-light" 
                              className="btn-glass"
                              onClick={() => handleSendToMaintenance(room._id)}
                            >
                              <Wrench size={14} className="me-1" />
                              Send Maintenance
                            </Button>
                            {room.status === 'OCCUPIED' && (
                              <Button 
                                variant="outline-light" 
                                className="btn-glass"
                                onClick={() => handleCheckOut(room._id)}
                              >
                                <LogOut size={14} className="me-1" />
                                Check Out
                              </Button>
                            )}
                          </ButtonGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      case 'coming-soon':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🚀 Coming Soon Rooms ({comingSoonRooms.length})</h4>
              <Button 
                className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 shadow-lg"
                style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                onClick={() => setShowComingSoonModal(true)}
              >
                <Plus size={18} />
                Add Coming Soon
              </Button>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Info</th>
                      <th>Details</th>
                      <th>Expected Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comingSoonRooms.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          No coming soon rooms found. Click "Add Coming Soon" to create one!
                        </td>
                      </tr>
                    ) : (
                      comingSoonRooms.map(room => (
                        <tr key={room._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room #{room.roomNumber}</div>
                              <div className="small opacity-75 text-capitalize">{room.type} - {room.capacity} guests</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="text-white">{room.description || 'No description'}</div>
                              <div className="small opacity-75">
                                {room.images && room.images.length > 0 ? (
                                  <Badge bg="success">{room.images.length} images</Badge>
                                ) : (
                                  <Badge bg="secondary">No images</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-white">
                              {room.expectedAvailability 
                                ? new Date(room.expectedAvailability).toLocaleDateString()
                                : 'Not set'
                              }
                            </div>
                          </td>
                          <td>
                            <ButtonGroup size="sm">
                              <Button 
                                className="btn-glass"
                                variant="outline-light"
                                onClick={() => {
                                  setSelectedComingSoonRoom(room);
                                  setShowMakeAvailableModal(true);
                                }}
                              >
                                Make Available
                              </Button>
                              <Button 
                                className="btn-glass"
                                variant="outline-light"
                                onClick={() => {
                                  setSelectedComingSoonRoom(room);
                                  setComingSoonImages([]);
                                  setShowComingSoonModal(true);
                                }}
                              >
                                <Edit3 size={14} />
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        );
      default:
        return (
          <div>
            <h4 className="text-white fw-bold mb-4">📊 Dashboard Overview</h4>
            <p className="text-white">Dashboard content coming soon...</p>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* MODERN GLASSMORPHISM NAVBAR */}
      <Navbar className="py-3 shadow-lg border-0" style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Container fluid>
          <Navbar.Brand className="d-flex align-items-center fw-bold text-white">
            <div className="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-lg" 
                 style={{ backgroundColor: goldColor, width: '45px', height: '45px' }}>
              <Home size={20} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>TOOBA ADMIN</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '2px' }}>HOTEL MANAGEMENT</div>
            </div>
          </Navbar.Brand>
          
          <Nav className="ms-auto align-items-center">
            <div className="d-flex align-items-center gap-3 me-4">
              <div className="text-white text-end d-none d-md-block">
                <div className="fw-bold">{user?.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Administrator</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center shadow" 
                   style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '40px', height: '40px' }}>
                <Users size={18} className="text-white" />
              </div>
            </div>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={onLogout}
              className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill border-2"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <LogOut size={16} />
              <span className="d-none d-md-inline">Logout</span>
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        {/* ALERT WITH GLASSMORPHISM */}
        {alert.show && (
          <Alert 
            variant={alert.variant} 
            className="border-0 shadow-lg mb-4 rounded-4"
            style={{
              background: alert.variant === 'success' ? 'rgba(40, 167, 69, 0.9)' : 
                         alert.variant === 'danger' ? 'rgba(220, 53, 69, 0.9)' : 
                         'rgba(13, 202, 240, 0.9)',
              backdropFilter: 'blur(15px)',
              color: 'white'
            }}
            dismissible 
            onClose={() => setAlert({ ...alert, show: false })}
          >
            {alert.message}
          </Alert>
        )}
        {/* MODERN STATS CARDS */}
        <Row className="g-4 mb-5">
          {[
            { title: 'Total Rooms', value: stats.total, icon: Home, color: 'rgba(13, 110, 253, 0.9)', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { title: 'Available', value: stats.available, icon: CheckCircle, color: 'rgba(25, 135, 84, 0.9)', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { title: 'Occupied', value: stats.occupied, icon: Bed, color: 'rgba(220, 53, 69, 0.9)', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' },
            { title: 'Pending', value: stats.pending, icon: Clock, color: 'rgba(255, 193, 7, 0.9)', gradient: `linear-gradient(135deg, ${goldColor} 0%, #f39c12 100%)` },
            { title: 'Active Discounts', value: discounts.filter(d => d.isActive).length, icon: Tag, color: 'rgba(220, 38, 127, 0.9)', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { title: 'Revenue', value: `Rs ${(totalRevenue || 0).toFixed(0)}`, icon: PakistaniRupeeIcon, color: 'rgba(111, 66, 193, 0.9)', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
          ].map((stat, index) => (
            <Col key={index} lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-lg h-100 text-white rounded-4 overflow-hidden position-relative">
                <div 
                  className="position-absolute w-100 h-100"
                  style={{ background: stat.gradient, opacity: 0.9 }}
                />
                <Card.Body className="position-relative text-center py-4">
                  <div className="mb-3">
                    <stat.icon size={40} className="text-white opacity-90" />
                  </div>
                  <h3 className="fw-bold mb-1" style={{ fontSize: '1.8rem' }}>{stat.value}</h3>
                  <p className="mb-0 opacity-90" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                    {stat.title}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* MAIN CONTENT CARD WITH GLASSMORPHISM */}
        <Card className="border-0 shadow-2xl rounded-4 overflow-hidden" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Card.Body className="p-0">
            {/* MODERN TAB NAVIGATION */}
            <div className="p-4 border-bottom" style={{ 
              borderColor: 'rgba(255, 255, 255, 0.1) !important', 
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <style>{`
                .p-4.border-bottom::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="d-flex gap-2" style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
                {[
                  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { key: 'rooms', label: 'Rooms', icon: Home },
                  { key: 'bookings', label: 'Bookings', icon: Calendar },
                  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
                  { key: 'discounts', label: 'Discounts', icon: Tag },
                  { key: 'reviews', label: 'Reviews', icon: Star },
                  { key: 'staff', label: 'Staff Tasks', icon: Users },
                  { key: 'coming-soon', label: 'Coming Soon', icon: Star }
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'light' : 'outline-light'}
                    className={`d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 ${
                      activeTab === tab.key ? 'shadow-lg' : ''
                    }`}
                    style={{
                      background: activeTab === tab.key ? goldColor : 'rgba(255, 255, 255, 0.1)',
                      color: activeTab === tab.key ? '#000' : '#fff',
                      backdropFilter: 'blur(10px)',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="p-4">
              {renderTabContent()}
            </div>
          </Card.Body>
        </Card>
      </Container>
      {/* MODALS */}
      {/* Add/Edit Room Modal */}
      <Modal 
        show={showModal} 
        onHide={() => {
          setShowModal(false);
          setSelectedRoom(null);
          setRoomForm({ roomNumber: '', type: 'single', price: '', capacity: 1, images: [], features: [] });
        }} 
        size="lg"
        className="modal-glass"
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title className="d-flex align-items-center gap-2">
              <Home size={20} />
              {selectedRoom ? 'Edit Room' : 'Add New Room'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            <Form onSubmit={selectedRoom ? handleUpdateRoom : handleCreateRoom}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Room Number</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      type="text" 
                      required 
                      value={roomForm.roomNumber}
                      onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} 
                      placeholder="e.g., 101, A-205"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Room Type</Form.Label>
                    <Form.Select 
                      className="form-control-glass"
                      value={roomForm.type}
                      onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="suite">Suite</option>
                      <option value="deluxe">Deluxe</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Price per Night (Rs)</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      type="number" 
                      required 
                      value={roomForm.price}
                      onChange={e => setRoomForm({ ...roomForm, price: e.target.value })} 
                      placeholder="e.g., 2500"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Capacity</Form.Label>
                    <Form.Select 
                      className="form-control-glass"
                      value={roomForm.capacity}
                      onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })}
                    >
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num} Person{num > 1 ? 's' : ''}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Room Images</Form.Label>
                <Form.Control 
                  className="form-control-glass"
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <Form.Text className="text-white opacity-75">
                  Upload multiple images for this room
                </Form.Text>
                
                {roomForm.images.length > 0 && (
                  <div className="mt-3">
                    <Row className="g-2">
                      {roomForm.images.map((image, index) => (
                        <Col xs={4} key={index}>
                          <div className="position-relative">
                            <img 
                              src={image} 
                              alt={`Room ${index + 1}`} 
                              className="img-fluid rounded border shadow"
                              style={{ height: '80px', width: '100%', objectFit: 'cover' }}
                            />
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="position-absolute top-0 end-0 m-1 rounded-circle"
                              onClick={() => removeImage(index)}
                              style={{ width: '25px', height: '25px', padding: '0' }}
                            >
                              ×
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="text-white">Room Features</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    className="btn-glass"
                    onClick={addFeature}
                  >
                    <Plus size={14} className="me-1" />
                    Add Feature
                  </Button>
                </div>
                {roomForm.features.length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {roomForm.features.map((feature, index) => (
                      <Badge 
                        key={index} 
                        className="d-flex align-items-center gap-2 px-3 py-2"
                        style={{ background: goldColor, color: '#000' }}
                      >
                        {feature}
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-dark"
                          onClick={() => removeFeature(index)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Form.Group>

              <Button 
                type="submit" 
                className="w-100 py-3 rounded-pill border-0 shadow-lg fw-bold"
                style={{ background: goldColor, color: '#000' }}
                disabled={loading}
              >
                {loading ? (selectedRoom ? 'Updating...' : 'Creating...') : (selectedRoom ? 'Update Room' : 'Create Room')}
              </Button>
            </Form>
          </Modal.Body>
        </div>
      </Modal>
      {/* Room Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)} 
        size="lg"
        className="modal-glass"
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title className="d-flex align-items-center gap-2">
              <Eye size={20} />
              Room {selectedRoom?.roomNumber} Details
              <Badge 
                className="ms-2 px-3 py-1"
                bg={
                  selectedRoom?.status === 'AVAILABLE' ? 'success' : 
                  selectedRoom?.status === 'OCCUPIED' ? 'danger' : 
                  selectedRoom?.status === 'NEEDS_CLEANING' ? 'warning' : 
                  selectedRoom?.status === 'COMING_SOON' ? 'secondary' :
                  selectedRoom?.status === 'MAINTENANCE' ? 'info' : 'dark'
                }
              >
                {selectedRoom?.status === 'NEEDS_CLEANING' ? 'Needs Cleaning' : 
                 selectedRoom?.status === 'COMING_SOON' ? 'Coming Soon' :
                 selectedRoom?.status === 'WORKING_IN_PROGRESS' ? 'Under Repair' : selectedRoom?.status}
              </Badge>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            {selectedRoom && (
              <div>
                {/* Room Images */}
                {selectedRoom.images && selectedRoom.images.length > 0 && (
                  <Card className="card-glass border-0 shadow-lg rounded-4 mb-4">
                    <Card.Header className="border-0 text-white" style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
                      <h6 className="mb-0">📸 Room Images ({selectedRoom.images.length})</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        {selectedRoom.images.map((image, index) => (
                          <Col md={4} key={index}>
                            <div className="position-relative">
                              <img 
                                src={image} 
                                alt={`Room ${selectedRoom.roomNumber} - Image ${index + 1}`}
                                className="img-fluid rounded shadow-lg"
                                style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                              />
                              <Badge 
                                className="position-absolute top-0 start-0 m-2"
                                style={{ background: goldColor, color: '#000' }}
                              >
                                {index + 1}
                              </Badge>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Room Information */}
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="card-glass border-0 shadow-lg rounded-4 h-100">
                      <Card.Header className="border-0 text-white" style={{ background: 'rgba(13, 110, 253, 0.3)' }}>
                        <h6 className="mb-0">📋 Basic Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Room Number:</span>
                          <span className="fw-bold">{selectedRoom.roomNumber || 'Not Set'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Type:</span>
                          <span className="fw-bold text-capitalize">{selectedRoom.type || 'Not Set'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Price per Night:</span>
                          <span className="fw-bold" style={{ color: goldColor }}>Rs {selectedRoom.price || '0'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                          <span className="opacity-75">Capacity:</span>
                          <span className="fw-bold">{selectedRoom.capacity || 1} person{(selectedRoom.capacity || 1) > 1 ? 's' : ''}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="card-glass border-0 shadow-lg rounded-4 h-100">
                      <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                        <h6 className="mb-0">🏷️ Features & Amenities</h6>
                      </Card.Header>
                      <Card.Body>
                        {selectedRoom.features && selectedRoom.features.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {selectedRoom.features.map((feature, index) => (
                              <Badge 
                                key={index} 
                                className="px-3 py-2 rounded-pill"
                                style={{ background: goldColor, color: '#000' }}
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white opacity-50 mb-0">No features added</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              className="px-4 py-2 rounded-pill border-0 shadow"
              style={{ background: goldColor, color: '#000', fontWeight: '600' }}
              onClick={() => {
                setShowDetailsModal(false);
                editRoom(selectedRoom);
              }}
            >
              <Edit3 size={16} className="me-2" />
              Edit Room
            </Button>
            <Button 
              variant="outline-light" 
              className="btn-glass px-4 py-2 rounded-pill"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* MODAL: ADD/EDIT COMING SOON ROOM */}
      <Modal show={showComingSoonModal} onHide={() => {
        setShowComingSoonModal(false);
        setSelectedComingSoonRoom(null);
        setComingSoonImages([]);
      }} size="lg">
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title>
              {selectedComingSoonRoom ? 'Edit Coming Soon Room' : 'Add Coming Soon Room'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            <Form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                roomNumber: formData.get('roomNumber'),
                type: formData.get('type'),
                capacity: parseInt(formData.get('capacity')),
                description: formData.get('description'),
                expectedAvailability: formData.get('expectedAvailability') || null,
                features: formData.get('features') ? formData.get('features').split(',').map(f => f.trim()) : [],
                images: comingSoonImages.length > 0 ? comingSoonImages : (selectedComingSoonRoom?.images || [])
              };

              try {
                setLoading(true);
                if (selectedComingSoonRoom) {
                  await updateComingSoonRoom(selectedComingSoonRoom._id, data);
                  showAlert('Coming soon room updated successfully!', 'success');
                } else {
                  await createComingSoonRoom(data);
                  showAlert('Coming soon room created successfully!', 'success');
                }
                setShowComingSoonModal(false);
                setSelectedComingSoonRoom(null);
                setComingSoonImages([]);
                fetchComingSoonRooms();
              } catch (error) {
                showAlert(error.response?.data?.message || 'Error saving coming soon room', 'danger');
              } finally {
                setLoading(false);
              }
            }}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Room Number</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      name="roomNumber" 
                      defaultValue={selectedComingSoonRoom?.roomNumber || ''} 
                      required 
                      disabled={!!selectedComingSoonRoom}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Room Type</Form.Label>
                    <Form.Select className="form-control-glass" name="type" defaultValue={selectedComingSoonRoom?.type || 'single'} required>
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="suite">Suite</option>
                      <option value="deluxe">Deluxe</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Capacity</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      name="capacity" 
                      type="number" 
                      min="1" 
                      defaultValue={selectedComingSoonRoom?.capacity || 1} 
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Expected Availability</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      name="expectedAvailability" 
                      type="date" 
                      defaultValue={selectedComingSoonRoom?.expectedAvailability ? 
                        new Date(selectedComingSoonRoom.expectedAvailability).toISOString().split('T')[0] : ''
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">Description</Form.Label>
                <Form.Control 
                  className="form-control-glass"
                  as="textarea" 
                  rows={2} 
                  name="description" 
                  defaultValue={selectedComingSoonRoom?.description || ''} 
                  placeholder="Describe what makes this room special..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">Features (comma-separated)</Form.Label>
                <Form.Control 
                  className="form-control-glass"
                  name="features" 
                  defaultValue={selectedComingSoonRoom?.features?.join(', ') || ''} 
                  placeholder="WiFi, AC, TV, Balcony..."
                />
              </Form.Group>

              {/* Image Upload Section */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Room Images</Form.Label>
                <Form.Control 
                  className="form-control-glass"
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleComingSoonImageUpload}
                />
                <Form.Text className="text-white opacity-75">
                  Upload images to showcase the coming soon room
                </Form.Text>
              </Form.Group>

              {/* Display Current Images */}
              {(comingSoonImages.length > 0 || (selectedComingSoonRoom?.images && selectedComingSoonRoom.images.length > 0)) && (
                <div className="mb-3">
                  <Form.Label className="text-white">Current Images:</Form.Label>
                  <Row>
                    {/* Show newly uploaded images */}
                    {comingSoonImages.map((img, index) => (
                      <Col md={3} key={`new-${index}`} className="mb-2">
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={img} 
                            alt={`New ${index + 1}`}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <Button 
                            variant="danger" 
                            size="sm" 
                            style={{ position: 'absolute', top: '5px', right: '5px' }}
                            onClick={() => removeComingSoonImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      </Col>
                    ))}
                    
                    {/* Show existing images if editing and no new images */}
                    {comingSoonImages.length === 0 && selectedComingSoonRoom?.images?.map((img, index) => (
                      <Col md={3} key={`existing-${index}`} className="mb-2">
                        <img 
                          src={img} 
                          alt={`Room ${index + 1}`}
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  className="px-4 py-2 rounded-pill border-0 shadow"
                  style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (selectedComingSoonRoom ? 'Update Room' : 'Create Room')}
                </Button>
                <Button 
                  variant="outline-light" 
                  className="btn-glass px-4 py-2 rounded-pill"
                  onClick={() => {
                    setShowComingSoonModal(false);
                    setSelectedComingSoonRoom(null);
                    setComingSoonImages([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* MODAL: MAKE COMING SOON ROOM AVAILABLE */}
      <Modal show={showMakeAvailableModal} onHide={() => {
        setShowMakeAvailableModal(false);
        setSelectedComingSoonRoom(null);
        setComingSoonImages([]);
      }} size="lg">
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title>Make Room Available</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            {selectedComingSoonRoom && (
              <>
                <Alert variant="info" className="border-0" style={{ background: 'rgba(13, 202, 240, 0.2)', color: 'white' }}>
                  <strong>Room #{selectedComingSoonRoom.roomNumber}</strong> - {selectedComingSoonRoom.type}
                  <br />
                  This will convert the coming soon room to an available room for booking.
                </Alert>
                
                <Form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = {
                    price: parseFloat(formData.get('price')),
                    features: formData.get('features') ? formData.get('features').split(',').map(f => f.trim()) : selectedComingSoonRoom.features || [],
                    images: comingSoonImages.length > 0 ? comingSoonImages : selectedComingSoonRoom.images || []
                  };

                  try {
                    setLoading(true);
                    await makeComingSoonAvailable(selectedComingSoonRoom._id, data);
                    showAlert(`Room ${selectedComingSoonRoom.roomNumber} is now available for booking!`, 'success');
                    setShowMakeAvailableModal(false);
                    setSelectedComingSoonRoom(null);
                    setComingSoonImages([]);
                    fetchComingSoonRooms();
                    fetchAllData(); // Refresh all data
                  } catch (error) {
                    showAlert(error.response?.data?.message || 'Error making room available', 'danger');
                  } finally {
                    setLoading(false);
                  }
                }}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Price per Night (Rs)</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      name="price" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      required 
                      placeholder="Enter room price..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Features (comma-separated)</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      name="features" 
                      defaultValue={selectedComingSoonRoom.features?.join(', ') || ''} 
                      placeholder="WiFi, AC, TV, Balcony..."
                    />
                  </Form.Group>

                  {/* Image Upload Section */}
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Update Room Images (Optional)</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleComingSoonImageUpload}
                    />
                    <Form.Text className="text-white opacity-75">
                      Upload new images or keep existing ones
                    </Form.Text>
                  </Form.Group>

                  {/* Display Current Images */}
                  {(comingSoonImages.length > 0 || (selectedComingSoonRoom?.images && selectedComingSoonRoom.images.length > 0)) && (
                    <div className="mb-3">
                      <Form.Label className="text-white">Room Images:</Form.Label>
                      <Row>
                        {/* Show newly uploaded images */}
                        {comingSoonImages.length > 0 ? (
                          comingSoonImages.map((img, index) => (
                            <Col md={3} key={`new-${index}`} className="mb-2">
                              <div style={{ position: 'relative' }}>
                                <img 
                                  src={img} 
                                  alt={`New ${index + 1}`}
                                  style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <Button 
                                  variant="danger" 
                                  size="sm" 
                                  style={{ position: 'absolute', top: '5px', right: '5px' }}
                                  onClick={() => removeComingSoonImage(index)}
                                >
                                  ×
                                </Button>
                              </div>
                            </Col>
                          ))
                        ) : (
                          /* Show existing images */
                          selectedComingSoonRoom?.images?.map((img, index) => (
                            <Col md={3} key={`existing-${index}`} className="mb-2">
                              <img 
                                src={img} 
                                alt={`Room ${index + 1}`}
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            </Col>
                          ))
                        )}
                      </Row>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button 
                      type="submit" 
                      className="px-4 py-2 rounded-pill border-0 shadow"
                      style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                      disabled={loading}
                    >
                      {loading ? 'Making Available...' : 'Make Available'}
                    </Button>
                    <Button 
                      variant="outline-light" 
                      className="btn-glass px-4 py-2 rounded-pill"
                      onClick={() => {
                        setShowMakeAvailableModal(false);
                        setSelectedComingSoonRoom(null);
                        setComingSoonImages([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Modal.Body>
        </div>
      </Modal>

      {/* DISCOUNT MODAL */}
      <Modal 
        show={showDiscountModal} 
        onHide={() => {
          setShowDiscountModal(false);
          setSelectedDiscount(null);
          setDiscountForm({
            name: '',
            type: 'WEEKEND',
            percentage: '',
            description: '',
            season: '',
            minRooms: 1,
            startDate: '',
            endDate: '',
            isActive: true
          });
        }} 
        size="lg"
        className="modal-glass"
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title className="d-flex align-items-center gap-2">
              <Tag size={20} />
              {selectedDiscount ? 'Edit Discount' : 'Add New Discount'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            <Form onSubmit={selectedDiscount ? handleUpdateDiscount : handleCreateDiscount}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Discount Name</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      type="text" 
                      required 
                      value={discountForm.name}
                      onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })} 
                      placeholder="e.g., Weekend Special"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Discount Type</Form.Label>
                    <Form.Select 
                      className="form-control-glass"
                      value={discountForm.type}
                      onChange={e => setDiscountForm({ ...discountForm, type: e.target.value })}
                    >
                      <option value="WEEKEND">Weekend Discount</option>
                      <option value="SEASONAL">Seasonal Discount</option>
                      <option value="MULTI_ROOM">Multi-Room Discount</option>
                      <option value="CUSTOM">Custom Date Range</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Discount Percentage</Form.Label>
                    <Form.Control 
                      className="form-control-glass"
                      type="number" 
                      required 
                      min="0"
                      max="100"
                      value={discountForm.percentage}
                      onChange={e => setDiscountForm({ ...discountForm, percentage: e.target.value })} 
                      placeholder="e.g., 20"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-white">Status</Form.Label>
                    <Form.Select 
                      className="form-control-glass"
                      value={discountForm.isActive.toString()}
                      onChange={e => setDiscountForm({ ...discountForm, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="text-white">Description</Form.Label>
                <Form.Control 
                  className="form-control-glass"
                  as="textarea"
                  rows={2}
                  value={discountForm.description}
                  onChange={e => setDiscountForm({ ...discountForm, description: e.target.value })} 
                  placeholder="Brief description of the discount"
                />
              </Form.Group>

              {/* Conditional fields based on discount type */}
              {discountForm.type === 'SEASONAL' && (
                <Form.Group className="mb-3">
                  <Form.Label className="text-white">Season</Form.Label>
                  <Form.Select 
                    className="form-control-glass"
                    value={discountForm.season}
                    onChange={e => setDiscountForm({ ...discountForm, season: e.target.value })}
                  >
                    <option value="">Select Season</option>
                    <option value="SUMMER">Summer</option>
                    <option value="WINTER">Winter</option>
                    <option value="SPRING">Spring</option>
                    <option value="FALL">Fall</option>
                  </Form.Select>
                </Form.Group>
              )}

              {discountForm.type === 'MULTI_ROOM' && (
                <Form.Group className="mb-3">
                  <Form.Label className="text-white">Minimum Rooms Required</Form.Label>
                  <Form.Control 
                    className="form-control-glass"
                    type="number" 
                    min="2"
                    value={discountForm.minRooms}
                    onChange={e => setDiscountForm({ ...discountForm, minRooms: parseInt(e.target.value) })} 
                  />
                </Form.Group>
              )}

              {discountForm.type === 'CUSTOM' && (
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">Start Date</Form.Label>
                      <Form.Control 
                        className="form-control-glass"
                        type="date" 
                        value={discountForm.startDate}
                        onChange={e => setDiscountForm({ ...discountForm, startDate: e.target.value })} 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white">End Date</Form.Label>
                      <Form.Control 
                        className="form-control-glass"
                        type="date" 
                        value={discountForm.endDate}
                        onChange={e => setDiscountForm({ ...discountForm, endDate: e.target.value })} 
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              <div className="d-flex gap-2">
                <Button 
                  type="submit" 
                  className="px-4 py-2 rounded-pill border-0 shadow"
                  style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (selectedDiscount ? 'Update Discount' : 'Create Discount')}
                </Button>
                <Button 
                  variant="outline-light" 
                  className="btn-glass px-4 py-2 rounded-pill"
                  onClick={() => {
                    setShowDiscountModal(false);
                    setSelectedDiscount(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* CUSTOM STYLES */}
      <style>{`
        .min-h-screen {
          min-height: 100vh;
        }
        
        .shadow-2xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }
        
        .rounded-4 {
          border-radius: 1rem !important;
        }
        
        .table-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .table-glass th {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .table-glass td {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .table-glass tbody tr:hover td {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .form-control-glass {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .form-control-glass:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: ${goldColor};
          box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
          color: white;
        }
        
        .form-control-glass::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .btn-glass {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .card-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

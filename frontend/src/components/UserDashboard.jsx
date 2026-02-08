import { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Card, Row, Col, Form, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, Calendar, Settings, LogOut, Plus, Edit3, Eye, 
  TrendingUp, Bed, Clock, CheckCircle, AlertCircle,
  BarChart3, PieChart, Download, Mail, Search, Filter,
  Star, Wifi, Car, Coffee, Dumbbell, MapPin, Phone, CreditCard,
  User, BookOpen, History, Heart, Tag
} from 'lucide-react';
import PakistaniRupeeIcon from './PakistaniRupeeIcon';
import api, { getRooms, getAllRoomsWithBookingInfo, createBooking, getMyBookings, calculateApplicableDiscounts, submitReview, getMyReviews } from '../services/api';

// --- STRIPE INTEGRATION ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51Srg5MGHNJ9aF4KDD1ptIZJQRiXusRVfvq4jk6ExvOAbvjGxTprDFDdskifE0y7UmhmvSf4O0rIMWugh3jlaqo8h00ZwMvzjek');

const CheckoutForm = ({ billing, onPaymentSuccess, loading }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    onPaymentSuccess(stripe, elements, CardElement);
  };

  return (
    <div className="card-glass border-0 shadow-lg rounded-4 p-4 mb-3">
      <div className="mb-3">
        <h6 className="text-white mb-2 d-flex align-items-center gap-2">
          <CreditCard size={18} />
          Payment Details
        </h6>
        <div className="p-3 rounded-3" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          border: '1px solid rgba(255, 255, 255, 0.2)' 
        }}>
          <CardElement options={{ 
            style: { 
              base: { 
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': { color: 'rgba(255, 255, 255, 0.6)' }
              } 
            } 
          }} />
        </div>
      </div>
      <Button 
        className="w-100 py-3 rounded-pill border-0 shadow-lg fw-bold"
        style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}
        onClick={handleSubmit} 
        disabled={loading}
      >
        {loading ? 'Processing Payment...' : `💳 Pay Rs ${billing.amountToPayNow.toFixed(0)} & Book Now`}
      </Button>
    </div>
  );
};
export default function UserDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('book');
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    bookingId: ''
  });
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    roomQuantity: 1,
    paymentMethod: 'Online' 
  });

  const [applicableDiscounts, setApplicableDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const goldColor = "#d4af37";

  useEffect(() => {
    fetchRooms();
    fetchBookings();
    fetchMyReviews();
  }, []);

  // Fetch applicable discounts when booking form changes
  useEffect(() => {
    if (bookingForm.checkIn && bookingForm.checkOut && bookingForm.roomQuantity) {
      fetchApplicableDiscounts();
    } else {
      setApplicableDiscounts([]);
      setSelectedDiscounts([]);
    }
  }, [bookingForm.checkIn, bookingForm.checkOut, bookingForm.roomQuantity]);

  const fetchApplicableDiscounts = async () => {
    try {
      const response = await calculateApplicableDiscounts({
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        roomQuantity: bookingForm.roomQuantity
      });
      setApplicableDiscounts(response.data.discounts || []);
      // Auto-select all applicable discounts
      setSelectedDiscounts(response.data.discounts?.map(d => d._id) || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setApplicableDiscounts([]);
      setSelectedDiscounts([]);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await getAllRoomsWithBookingInfo();
      setRooms(response.data);
    } catch (error) { 
      console.error(error);
      setStatusMsg({ show: true, message: 'Failed to load rooms', variant: 'danger' });
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await getMyBookings();
      setBookings(response.data);
    } catch (error) { 
      console.error(error);
      setStatusMsg({ show: true, message: 'Failed to load bookings', variant: 'danger' });
    }
  };

  const fetchMyReviews = async () => {
    try {
      const response = await getMyReviews();
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.title || !reviewForm.comment) {
      setStatusMsg({ show: true, message: 'Please fill in all fields', variant: 'warning' });
      return;
    }
    
    setLoading(true);
    try {
      // Only include bookingId if it's not empty
      const reviewData = {
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      };
      
      if (reviewForm.bookingId && reviewForm.bookingId.trim()) {
        reviewData.bookingId = reviewForm.bookingId;
      }
      
      await submitReview(reviewData);
      setStatusMsg({ show: true, message: 'Review submitted! It will be visible after admin approval.', variant: 'success' });
      setShowReviewModal(false);
      setReviewForm({ rating: 5, title: '', comment: '', bookingId: '' });
      fetchMyReviews();
    } catch (error) {
      console.error('Submit review error:', error);
      setStatusMsg({ show: true, message: error.response?.data?.message || 'Failed to submit review', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={interactive ? 32 : 20}
        fill={index < rating ? goldColor : 'none'}
        color={index < rating ? goldColor : 'rgba(255, 255, 255, 0.3)'}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => interactive && onRatingChange && onRatingChange(index + 1)}
      />
    ));
  };

  // Validate booking dates for occupied rooms
  const validateBookingDates = (roomId, checkIn, checkOut) => {
    const room = displayRooms.find(r => r._id === roomId);
    if (!room || room.isBookable) return { isValid: true, message: '' };

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (room.currentBookings && room.currentBookings.length > 0) {
      for (const booking of room.currentBookings) {
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        
        // Check if dates overlap with existing booking
        if (checkInDate < bookingEnd && checkOutDate > bookingStart) {
          return {
            isValid: false,
            message: `Selected dates conflict with existing booking (${bookingStart.toLocaleDateString()} - ${bookingEnd.toLocaleDateString()}). Please choose dates after ${bookingEnd.toLocaleDateString()}.`
          };
        }
      }
    }
    
    return { isValid: true, message: '' };
  };

  const calculateBilling = () => {
    if (!bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut) return null;
    const room = rooms.find((r) => r._id === bookingForm.roomId);
    if (!room) return null;

    const start = new Date(bookingForm.checkIn);
    const end = new Date(bookingForm.checkOut);
    if (end <= start) return null;

    const nights = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
    const subtotal = nights * room.price * bookingForm.roomQuantity;
    const total = subtotal * 1.12; // 12% tax
    
    // Calculate discount
    let discountTotal = 0;
    const discountDetails = [];
    
    if (selectedDiscounts.length > 0) {
      selectedDiscounts.forEach(discountId => {
        const discount = applicableDiscounts.find(d => d._id === discountId);
        if (discount) {
          const discountAmount = (total * discount.percentage) / 100;
          discountTotal += discountAmount;
          discountDetails.push({
            id: discount._id,
            name: discount.name,
            percentage: discount.percentage,
            amount: discountAmount
          });
        }
      });
    }
    
    const finalTotal = total - discountTotal;
    const amountToPayNow = bookingForm.paymentMethod === 'Cash' ? (finalTotal * 0.05) : finalTotal;

    return { 
      room, 
      nights, 
      subtotal, 
      total, 
      discountTotal,
      discountDetails,
      finalTotal,
      amountToPayNow 
    };
  };

  const handleBookingSubmit = async (stripe, elements, cardType) => {
    setLoading(true);
    const billingData = calculateBilling();

    // Validate booking dates for occupied rooms
    const validation = validateBookingDates(bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut);
    if (!validation.isValid) {
      setStatusMsg({ show: true, message: validation.message, variant: 'warning' });
      setLoading(false);
      return;
    }

    try {
      // 1. Create Payment Intent on Backend
      const intentRes = await api.post('/user/create-payment-intent', { amount: billingData.amountToPayNow });
      const clientSecret = intentRes.data.clientSecret;

      // 2. Confirm Payment with Stripe
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(cardType) }
      });

      if (paymentResult.error) {
        setStatusMsg({ show: true, message: paymentResult.error.message, variant: 'danger' });
      } else if (paymentResult.paymentIntent.status === 'succeeded') {
        // 3. Finalize Booking
        const bookingData = {
          ...bookingForm,
          totalAmount: billingData.finalTotal,
          appliedDiscounts: selectedDiscounts
        };
        const response = await createBooking(bookingData);
        setStatusMsg({ show: true, message: '🎉 Payment Successful! Your room is reserved.', variant: 'success' });
        setCurrentInvoice({ ...response.data.booking, billing: billingData });
        setShowInvoice(true);
        setBookingForm({ roomId: '', checkIn: '', checkOut: '', roomQuantity: 1, paymentMethod: 'Online' });
        setSelectedDiscounts([]);
        setApplicableDiscounts([]);
        fetchRooms();
        fetchBookings();
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Transaction Error. Please try again.';
      setStatusMsg({ show: true, message: errorMessage, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const showRoomDetailsModal = (room) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const billing = calculateBilling();
  // Show all rooms except coming soon and maintenance
  const displayRooms = rooms.filter(r => r.status !== 'COMING_SOON' && r.status !== 'MAINTENANCE' && r.status !== 'WORKING_IN_PROGRESS');
  const availableRooms = displayRooms; // Show all bookable rooms
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  const stats = {
    totalBookings: bookings.length,
    confirmed: confirmedBookings.length,
    pending: pendingBookings.length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0)
  };
  // Helper function to render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'book':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🏨 Book Your Stay</h4>
              <div className="text-white opacity-75">
                {availableRooms.length} rooms available
              </div>
            </div>

            <Row className="g-4">
              <Col lg={5}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Header className="border-0 text-white" style={{ background: 'rgba(13, 110, 253, 0.3)' }}>
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      <Calendar size={18} />
                      New Reservation
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-white fw-bold">Select Room</Form.Label>
                        <Form.Select 
                          className="form-control-glass"
                          value={bookingForm.roomId} 
                          onChange={(e) => setBookingForm({...bookingForm, roomId: e.target.value})}
                        >
                          <option value="">Choose your perfect room...</option>
                          {displayRooms.map(r => (
                            <option key={r._id} value={r._id}>
                              Room {r.roomNumber} - {r.type} - {r.capacity} guest{r.capacity > 1 ? 's' : ''} - Rs {r.price}/night
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      {/* Show selected room details */}
                      {bookingForm.roomId && (
                        <Card className="card-glass border-0 shadow-lg rounded-4 mb-3">
                          <Card.Body className="p-3">
                            {(() => {
                              const selectedRoom = displayRooms.find(r => r._id === bookingForm.roomId);
                              return selectedRoom ? (
                                <div>
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h6 className="fw-bold text-white mb-0">Room {selectedRoom.roomNumber}</h6>
                                    <div className="d-flex gap-2">
                                      <Badge 
                                        bg={selectedRoom.isBookable ? "success" : "warning"} 
                                        className="px-2 py-1"
                                      >
                                        Available
                                      </Badge>
                                      <Button 
                                        variant="outline-light" 
                                        size="sm" 
                                        className="btn-glass"
                                        onClick={() => showRoomDetailsModal(selectedRoom)}
                                      >
                                        <Eye size={14} className="me-1" />
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <Row>
                                    <Col md={8}>
                                      <div className="text-white opacity-90 mb-2">
                                        <div><strong>Type:</strong> {selectedRoom.type}</div>
                                        <div><strong>Capacity:</strong> {selectedRoom.capacity} guest{selectedRoom.capacity > 1 ? 's' : ''}</div>
                                        <div><strong>Price:</strong> <span style={{ color: goldColor }}>Rs {selectedRoom.price}</span> per night</div>
                                      </div>
                                      {selectedRoom.features && selectedRoom.features.length > 0 && (
                                        <div>
                                          <div className="text-white opacity-75 small mb-1">Features:</div>
                                          <div className="d-flex flex-wrap gap-1">
                                            {selectedRoom.features.slice(0, 3).map((feature, index) => (
                                              <Badge key={index} className="px-2 py-1" style={{ background: goldColor, color: '#000' }}>
                                                {feature}
                                              </Badge>
                                            ))}
                                            {selectedRoom.features.length > 3 && (
                                              <Badge bg="secondary">+{selectedRoom.features.length - 3} more</Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Col>
                                    <Col md={4}>
                                      {selectedRoom.images && selectedRoom.images.length > 0 && (
                                        <img 
                                          src={selectedRoom.images[0]} 
                                          alt={`Room ${selectedRoom.roomNumber}`}
                                          className="img-fluid rounded border shadow"
                                          style={{ height: '80px', width: '100%', objectFit: 'cover' }}
                                        />
                                      )}
                                    </Col>
                                  </Row>
                                </div>
                              ) : null;
                            })()}
                          </Card.Body>
                        </Card>
                      )}

                      <Form.Group className="mb-3">
                        <Form.Label className="text-white fw-bold">Number of Rooms</Form.Label>
                        <Form.Select 
                          className="form-control-glass"
                          value={bookingForm.roomQuantity} 
                          onChange={(e) => setBookingForm({...bookingForm, roomQuantity: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5].map(num => (
                            <option key={num} value={num}>{num} Room{num > 1 ? 's' : ''}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Row className="mb-3">
                        <Col>
                          <Form.Label className="text-white fw-bold">Check-In Date</Form.Label>
                          <Form.Control 
                            className="form-control-glass"
                            type="date" 
                            value={bookingForm.checkIn} 
                            onChange={e => setBookingForm({...bookingForm, checkIn: e.target.value})} 
                          />
                        </Col>
                        <Col>
                          <Form.Label className="text-white fw-bold">Check-Out Date</Form.Label>
                          <Form.Control 
                            className="form-control-glass"
                            type="date" 
                            value={bookingForm.checkOut} 
                            onChange={e => setBookingForm({...bookingForm, checkOut: e.target.value})} 
                          />
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label className="text-white fw-bold">Payment Option</Form.Label>
                        <Form.Select 
                          className="form-control-glass"
                          value={bookingForm.paymentMethod} 
                          onChange={e => setBookingForm({...bookingForm, paymentMethod: e.target.value})}
                        >
                          <option value="Online">💳 Full Online Payment</option>
                          <option value="Cash">💰 Cash on Visit (5% Deposit)</option>
                        </Form.Select>
                      </Form.Group>

                      {/* Applicable Discounts Section */}
                      {applicableDiscounts.length > 0 && (
                        <Card className="card-glass border-0 shadow-lg rounded-4 mb-3">
                          <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                              <Tag size={18} />
                              Available Discounts 🎉
                            </h6>
                          </Card.Header>
                          <Card.Body className="p-3">
                            {applicableDiscounts.map((discount) => (
                              <div key={discount._id} className="mb-2">
                                <Form.Check
                                  type="checkbox"
                                  id={`discount-${discount._id}`}
                                  checked={selectedDiscounts.includes(discount._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedDiscounts([...selectedDiscounts, discount._id]);
                                    } else {
                                      setSelectedDiscounts(selectedDiscounts.filter(id => id !== discount._id));
                                    }
                                  }}
                                  label={
                                    <div className="d-flex justify-content-between align-items-center w-100">
                                      <div>
                                        <span className="text-white fw-bold">{discount.name}</span>
                                        <Badge bg="success" className="ms-2">{discount.percentage}% OFF</Badge>
                                        {discount.description && (
                                          <div className="small text-white opacity-75">{discount.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  }
                                  className="text-white"
                                />
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      )}

                      {billing && (
                        <Card className="card-glass border-0 shadow-lg rounded-4 mb-3">
                          <Card.Header className="border-0 text-white" style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                              <PakistaniRupeeIcon size={22} />
                              Billing Summary
                            </h6>
                          </Card.Header>
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between text-white opacity-90 mb-2">
                              <span>Room {billing.room.roomNumber} × {bookingForm.roomQuantity}</span>
                              <span>Rs {(billing.room.price * bookingForm.roomQuantity).toFixed(0)}/night</span>
                            </div>
                            <div className="d-flex justify-content-between text-white opacity-90 mb-2">
                              <span>Duration</span>
                              <span>{billing.nights} night{billing.nights > 1 ? 's' : ''}</span>
                            </div>
                            <div className="d-flex justify-content-between text-white opacity-90 mb-2">
                              <span>Subtotal</span>
                              <span>Rs {billing.subtotal.toFixed(0)}</span>
                            </div>
                            <div className="d-flex justify-content-between text-white opacity-90 mb-2">
                              <span>Tax (12%)</span>
                              <span>Rs {(billing.total - billing.subtotal).toFixed(0)}</span>
                            </div>
                            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                            <div className="d-flex justify-content-between fw-bold text-white mb-2">
                              <span>Total Before Discount</span>
                              <span>Rs {billing.total.toFixed(0)}</span>
                            </div>
                            
                            {/* Show discount breakdown */}
                            {billing.discountDetails && billing.discountDetails.length > 0 && (
                              <>
                                {billing.discountDetails.map((discount, index) => (
                                  <div key={index} className="d-flex justify-content-between text-success mb-2">
                                    <span className="small">
                                      <Tag size={14} className="me-1" />
                                      {discount.name} ({discount.percentage}%)
                                    </span>
                                    <span className="small">- Rs {discount.amount.toFixed(0)}</span>
                                  </div>
                                ))}
                                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                              </>
                            )}
                            
                            <div className="d-flex justify-content-between fw-bold text-white mb-3">
                              <span>Final Amount</span>
                              <span style={{ color: goldColor }}>Rs {billing.finalTotal.toFixed(0)}</span>
                            </div>
                            
                            {billing.discountTotal > 0 && (
                              <Alert variant="success" className="py-2 px-3 mb-3 small">
                                🎉 You're saving Rs {billing.discountTotal.toFixed(0)} with applied discounts!
                              </Alert>
                            )}
                            
                            <div className="text-center text-white opacity-75 mb-3">
                              <small>
                                {bookingForm.paymentMethod === 'Cash' 
                                  ? `Pay Rs ${billing.amountToPayNow.toFixed(0)} now (5% deposit)` 
                                  : `Pay full amount Rs ${billing.amountToPayNow.toFixed(0)} now`
                                }
                              </small>
                            </div>
                            
                            <Elements stripe={stripePromise}>
                              <CheckoutForm billing={billing} onPaymentSuccess={handleBookingSubmit} loading={loading} />
                            </Elements>
                          </Card.Body>
                        </Card>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={7}>
                <Card className="card-glass border-0 shadow-lg rounded-4">
                  <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      <Home size={18} />
                      Available Rooms ({availableRooms.length})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="p-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <Row className="g-3">
                        {displayRooms.map(room => (
                          <Col md={6} key={room._id}>
                            <Card className={`card-glass border-0 shadow h-100 rounded-3 ${!room.isBookable ? 'opacity-75' : ''}`}>
                              <div className="position-relative">
                                {room.images && room.images.length > 0 ? (
                                  <img 
                                    src={room.images[0]} 
                                    alt={`Room ${room.roomNumber}`}
                                    className="card-img-top rounded-top-3"
                                    style={{ height: '150px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="card-img-top rounded-top-3 d-flex align-items-center justify-content-center"
                                    style={{ height: '150px', background: 'rgba(255, 255, 255, 0.1)' }}
                                  >
                                    <Home size={40} className="text-white opacity-50" />
                                  </div>
                                )}
                                <Badge 
                                  className="position-absolute top-0 end-0 m-2 px-3 py-2"
                                  style={{ background: goldColor, color: '#000' }}
                                >
                                  Rs {room.price}/night
                                </Badge>
                              </div>
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="text-white fw-bold mb-0">Room {room.roomNumber}</h6>
                                  <Badge 
                                    bg="success" 
                                    className="px-2 py-1"
                                  >
                                    Available
                                  </Badge>
                                </div>
                                <div className="text-white opacity-90 mb-2">
                                  <div className="small">
                                    <span className="text-capitalize">{room.type}</span> • {room.capacity} guest{room.capacity > 1 ? 's' : ''}
                                  </div>
                                </div>
                                
                                {room.features && room.features.length > 0 && (
                                  <div className="mb-3">
                                    <div className="d-flex flex-wrap gap-1">
                                      {room.features.slice(0, 2).map((feature, index) => (
                                        <Badge key={index} bg="secondary" className="small px-2 py-1">
                                          {feature}
                                        </Badge>
                                      ))}
                                      {room.features.length > 2 && (
                                        <Badge bg="secondary" className="small px-2 py-1">
                                          +{room.features.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="d-flex gap-2">
                                  <Button 
                                    variant="outline-light" 
                                    size="sm" 
                                    className="btn-glass flex-fill"
                                    onClick={() => showRoomDetailsModal(room)}
                                  >
                                    <Eye size={14} className="me-1" />
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="flex-fill border-0"
                                    style={{ 
                                      background: goldColor, 
                                      color: '#000', 
                                      fontWeight: '600' 
                                    }}
                                    onClick={() => setBookingForm({...bookingForm, roomId: room._id})}
                                  >
                                    <Plus size={14} className="me-1" />
                                    Book Now
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* ALERT BELOW ROOM CARDS */}
            {statusMsg.show && (
              <Alert 
                variant={statusMsg.variant} 
                className="border-0 shadow-lg mt-4 rounded-4"
                style={{
                  background: statusMsg.variant === 'success' ? 'rgba(40, 167, 69, 0.9)' : 
                             statusMsg.variant === 'danger' ? 'rgba(220, 53, 69, 0.9)' : 
                             statusMsg.variant === 'warning' ? 'rgba(255, 193, 7, 0.9)' :
                             'rgba(13, 202, 240, 0.9)',
                  backdropFilter: 'blur(15px)',
                  color: 'white'
                }}
                dismissible 
                onClose={() => setStatusMsg({ ...statusMsg, show: false })}
              >
                {statusMsg.message}
              </Alert>
            )}
          </div>
        );
      case 'bookings':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">📋 My Bookings</h4>
              <div className="text-white opacity-75">
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Stay Period</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <BookOpen size={40} className="opacity-50" />
                            <div>No bookings yet. Book your first room!</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bookings.map(booking => (
                        <tr key={booking._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room {booking.room?.roomNumber}</div>
                              <div className="small opacity-75 text-capitalize">{booking.room?.type}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="text-white">{new Date(booking.checkIn).toLocaleDateString()}</div>
                              <div className="small opacity-75">to {new Date(booking.checkOut).toLocaleDateString()}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold" style={{ color: goldColor }}>
                                Rs {(booking.amountPaid || 0).toFixed(0)}
                              </div>
                              <div className="small opacity-75">
                                {booking.paymentMethod === 'Cash' ? '💰 Cash' : '💳 Online'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              className="px-3 py-2 rounded-pill"
                              bg={
                                booking.status === 'CONFIRMED' ? 'success' : 
                                booking.status === 'CHECKED_IN' ? 'primary' :
                                booking.status === 'CHECKED_OUT' ? 'secondary' :
                                booking.status === 'CANCELLED' ? 'danger' : 'warning'
                              }
                            >
                              {booking.status === 'CONFIRMED' ? '✅ Confirmed' : 
                               booking.status === 'CHECKED_IN' ? '🏨 Checked In' :
                               booking.status === 'CHECKED_OUT' ? '✅ Completed' :
                               booking.status === 'CANCELLED' ? '❌ Cancelled' : '⏳ Pending'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant="outline-light" 
                              size="sm" 
                              className="btn-glass"
                              onClick={() => {
                                setCurrentInvoice(booking);
                                setShowInvoice(true);
                              }}
                            >
                              <Eye size={14} className="me-1" />
                              View
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
        );
      
      case 'reviews':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">⭐ My Reviews</h4>
              <Button 
                className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 shadow-lg"
                style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                onClick={() => setShowReviewModal(true)}
              >
                <Plus size={18} />
                Write Review
              </Button>
            </div>

            <Row className="g-4">
              {reviews.length === 0 ? (
                <Col xs={12}>
                  <Card className="card-glass border-0 shadow-lg rounded-4">
                    <Card.Body className="text-center py-5">
                      <Star size={60} className="text-white opacity-50 mb-3" />
                      <h5 className="text-white mb-2">No Reviews Yet</h5>
                      <p className="text-white opacity-75 mb-4">Share your experience with us!</p>
                      <Button 
                        className="px-4 py-2 rounded-pill border-0"
                        style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                        onClick={() => setShowReviewModal(true)}
                      >
                        Write Your First Review
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ) : (
                reviews.map(review => (
                  <Col md={6} lg={4} key={review._id}>
                    <Card className="border-0 shadow-lg rounded-4 h-100" style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <Badge 
                            bg={
                              review.status === 'APPROVED' ? 'success' :
                              review.status === 'REJECTED' ? 'danger' : 'warning'
                            }
                            className="px-2 py-1"
                          >
                            {review.status === 'APPROVED' ? '✅ Approved' :
                             review.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}
                          </Badge>
                        </div>
                        
                        <h6 className="fw-bold text-white mb-2">{review.title}</h6>
                        <p className="text-white opacity-90 small mb-3">{review.comment}</p>
                        
                        <div className="text-white opacity-75 small">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                        
                        {review.status === 'REJECTED' && review.rejectionReason && (
                          <Alert variant="danger" className="mt-3 py-2 px-3 small mb-0">
                            <strong>Reason:</strong> {review.rejectionReason}
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </div>
        );

      default:
        return (
          <div>
            <h4 className="text-white fw-bold mb-4">🏨 Book Your Stay</h4>
            <p className="text-white">Welcome to your dashboard!</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80)',
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
              <div style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>TOOBA GUEST</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '2px' }}>HOTEL PORTAL</div>
            </div>
          </Navbar.Brand>
          
          <Nav className="ms-auto align-items-center">
            <div className="d-flex align-items-center gap-3 me-4">
              <div className="text-white text-end d-none d-md-block">
                <div className="fw-bold">{user?.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Guest</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center shadow" 
                   style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '40px', height: '40px' }}>
                <User size={18} className="text-white" />
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
        {/* MODERN STATS CARDS */}
        <Row className="g-4 mb-5">
          {[
            { title: 'Total Bookings', value: stats.totalBookings, icon: BookOpen, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { title: 'Confirmed', value: stats.confirmed, icon: CheckCircle, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { title: 'Pending', value: stats.pending, icon: Clock, gradient: `linear-gradient(135deg, ${goldColor} 0%, #f39c12 100%)` },
            { title: 'Total Spent', value: `Rs ${stats.totalSpent.toFixed(0)}`, icon: PakistaniRupeeIcon, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
          ].map((stat, index) => (
            <Col key={index} lg={3} md={6} sm={6}>
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
            <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1) !important' }}>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { key: 'book', label: 'Book Room', icon: Plus },
                  { key: 'bookings', label: 'My Bookings', icon: History },
                  { key: 'reviews', label: 'My Reviews', icon: Star }
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
                      letterSpacing: '0.5px'
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
      {/* ROOM DETAILS MODAL */}
      <Modal 
        show={showRoomDetails} 
        onHide={() => setShowRoomDetails(false)} 
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
              Room {selectedRoom?.roomNumber} Details
              <Badge 
                className="ms-2 px-3 py-1"
                style={{ background: goldColor, color: '#000' }}
              >
                Rs {selectedRoom?.price}/night
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
                      <h6 className="mb-0">📸 Room Gallery ({selectedRoom.images.length})</h6>
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
                        <h6 className="mb-0">📋 Room Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Room Number:</span>
                          <span className="fw-bold">{selectedRoom.roomNumber}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Type:</span>
                          <span className="fw-bold text-capitalize">{selectedRoom.type}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <span className="opacity-75">Price per Night:</span>
                          <span className="fw-bold" style={{ color: goldColor }}>Rs {selectedRoom.price}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                          <span className="opacity-75">Capacity:</span>
                          <span className="fw-bold">{selectedRoom.capacity} guest{selectedRoom.capacity > 1 ? 's' : ''}</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="card-glass border-0 shadow-lg rounded-4 h-100">
                      <Card.Header className="border-0 text-white" style={{ background: 'rgba(25, 135, 84, 0.3)' }}>
                        <h6 className="mb-0">🏷️ Amenities & Features</h6>
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
                          <p className="text-white opacity-50 mb-0">No features listed</p>
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
                setShowRoomDetails(false);
                setBookingForm({...bookingForm, roomId: selectedRoom._id});
                setActiveTab('book');
              }}
            >
              <Plus size={16} className="me-2" />
              Book This Room
            </Button>
            <Button 
              variant="outline-light" 
              className="btn-glass px-4 py-2 rounded-pill"
              onClick={() => setShowRoomDetails(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* INVOICE MODAL */}
      <Modal 
        show={showInvoice} 
        onHide={() => setShowInvoice(false)} 
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
              <Download size={20} />
              Booking Confirmation
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white">
            {currentInvoice && (
              <div>
                <Card className="card-glass border-0 shadow-lg rounded-4 mb-4">
                  <Card.Header className="border-0 text-white text-center" style={{ background: 'rgba(40, 167, 69, 0.3)' }}>
                    <h5 className="mb-0">🎉 Booking Confirmed!</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Guest Name</div>
                          <div className="fw-bold text-white">{user?.name}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Room</div>
                          <div className="fw-bold text-white">Room {currentInvoice.room?.roomNumber}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Check-in Date</div>
                          <div className="fw-bold text-white">{new Date(currentInvoice.checkIn).toLocaleDateString()}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Booking ID</div>
                          <div className="fw-bold text-white small">{currentInvoice._id}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Room Type</div>
                          <div className="fw-bold text-white text-capitalize">{currentInvoice.room?.type}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-white opacity-75 small">Check-out Date</div>
                          <div className="fw-bold text-white">{new Date(currentInvoice.checkOut).toLocaleDateString()}</div>
                        </div>
                      </Col>
                    </Row>
                    
                    <hr style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-white opacity-75 small">Amount Paid</div>
                        <div className="fw-bold h5 mb-0" style={{ color: goldColor }}>
                          Rs {(currentInvoice.amountPaid || 0).toFixed(0)}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-white opacity-75 small">Payment Method</div>
                        <div className="fw-bold text-white">
                          {currentInvoice.paymentMethod === 'Cash' ? '💰 Cash' : '💳 Online'}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
                
                <div className="text-center text-white opacity-75">
                  <p className="mb-0">Thank you for choosing TOOBA Hotel!</p>
                  <p className="small">Please arrive at your check-in date and time.</p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button 
              variant="outline-light" 
              className="btn-glass px-4 py-2 rounded-pill"
              onClick={() => setShowInvoice(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* REVIEW MODAL */}
      <Modal 
        show={showReviewModal} 
        onHide={() => setShowReviewModal(false)} 
        centered
        size="lg"
        backdropClassName="modal-backdrop-blur"
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem'
        }}>
          <Modal.Header closeButton className="border-0 text-white">
            <Modal.Title className="d-flex align-items-center gap-2">
              <Star size={20} style={{ color: goldColor }} />
              Write a Review
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-white p-4">
            <Form onSubmit={handleSubmitReview}>
              {/* Rating */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Rating</Form.Label>
                <div className="d-flex gap-2 align-items-center">
                  {renderStars(reviewForm.rating, true, (rating) => setReviewForm({...reviewForm, rating}))}
                  <span className="ms-2 fw-bold" style={{ color: goldColor }}>
                    {reviewForm.rating} / 5
                  </span>
                </div>
              </Form.Group>

              {/* Title */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Sum up your experience"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                  maxLength={100}
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                />
                <Form.Text className="text-white opacity-75 small">
                  {reviewForm.title.length}/100 characters
                </Form.Text>
              </Form.Group>

              {/* Comment */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Your Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Share your experience with us..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  maxLength={500}
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                />
                <Form.Text className="text-white opacity-75 small">
                  {reviewForm.comment.length}/500 characters
                </Form.Text>
              </Form.Group>

              <Alert variant="info" className="py-2 px-3 small">
                <AlertCircle size={16} className="me-2" />
                Your review will be visible on our website after admin approval.
              </Alert>

              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="outline-light"
                  className="px-4 py-2 rounded-pill"
                  onClick={() => setShowReviewModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2 rounded-pill border-0"
                  style={{ background: goldColor, color: '#000', fontWeight: '600' }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
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
        
        .modal-backdrop-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          background-color: rgba(0, 0, 0, 0.5) !important;
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
        
        .form-control-glass option {
          background: rgba(0, 0, 0, 0.8);
          color: white;
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
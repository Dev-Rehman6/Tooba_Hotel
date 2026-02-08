import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Menu, X, Clock, Utensils, Dumbbell, Wifi, PlayCircle, 
  MapPin, Phone, Mail, Facebook, Twitter, Instagram, 
  CheckSquare, Users, Send, MessageCircle, Sparkles
} from 'lucide-react';
import { Container, Navbar, Nav, Button, Card, Row, Col, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getPublicRooms, submitContactForm } from '../services/api'; 
import LoadingSpinner from './LoadingSpinner'; 
import toast, { Toaster } from 'react-hot-toast';
import DiscountBanner from './DiscountBanner';
import ReviewsSection from './ReviewsSection';

export default function Index({ user }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const aboutRef = useRef(null);
  const roomsRef = useRef(null);
  const facilitiesRef = useRef(null);
  const contactRef = useRef(null);

  const aboutInView = useInView(aboutRef, { once: true, margin: '-100px' });
  const roomsInView = useInView(roomsRef, { once: true, margin: '-100px' });
  const facilitiesInView = useInView(facilitiesRef, { once: true, margin: '-100px' });
  const contactInView = useInView(contactRef, { once: true, margin: '-100px' });

  const goldColor = "#d4af37";

  useEffect(() => {
    fetchRooms();
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await getPublicRooms();
      console.log('Rooms fetched from API:', response.data);
      console.log('First room images:', response.data[0]?.images);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to protect actions and redirect to login if not authenticated
  const handleProtectedAction = (e, targetPath = '/login') => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error('Please login to continue booking');
      navigate('/login');
      return false;
    }
    return true;
  };

  // Handle booking action - redirect to login if not authenticated
  const handleBookRoom = (room) => {
    if (!user) {
      toast.error('Please login to book this room');
      navigate('/login');
      return;
    }
    // If user is logged in, navigate to booking page or show booking modal
    navigate(`/user-dashboard?book=${room._id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting contact form:', formData);
      
      const response = await submitContactForm(formData);
      console.log('Contact form response:', response.data);
      
      toast.success('Message sent successfully! We will get back to you soon via email.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to send message. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen position-relative" style={{
      minHeight: '100vh',
      backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Dark overlay for better readability */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 0
      }} />
      
      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Toaster position="top-center" />

      {/* ============= 1. NAVBAR ============= */}
      <Navbar expand="lg" fixed="top" className="py-3 transition-all duration-500" style={{
        background: isScrolled ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
      }}>
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center fw-bold">
            <div className="w-10 h-10 rounded-full d-flex align-items-center justify-content-center text-white me-2" style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%',
              background: goldColor 
            }}>T</div>
            <div className="d-flex flex-col text-start">
              <span style={{ color: '#fff', letterSpacing: '1px', fontSize: '1.2rem', lineHeight: '1' }}>TOOBA</span>
              <span className="text-uppercase" style={{ color: goldColor, fontSize: '10px', letterSpacing: '3px' }}>Hotels</span>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ 
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }} />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {['Home', 'About', 'Rooms', 'Facilities', 'Contact'].map((item) => (
                <Nav.Link key={item} href={`#${item.toLowerCase()}`} className="fw-semibold px-3 text-white">{item}</Nav.Link>
              ))}
              {user ? (
                <div className="d-flex align-items-center gap-3">
                  <span className="text-white small">Welcome, {user.name}!</span>
                  <Button 
                    className="ms-lg-2 rounded-pill border-0 px-4 fw-bold shadow-lg" 
                    style={{ backgroundColor: goldColor, color: '#000' }}
                    onClick={() => navigate(`/${user.role}-dashboard`)}
                  >
                    DASHBOARD
                  </Button>
                </div>
              ) : (
                <Button 
                  className="ms-lg-3 rounded-pill border-0 px-4 fw-bold shadow-lg" 
                  style={{ backgroundColor: goldColor, color: '#000' }}
                  onClick={() => navigate('/login')}
                >
                  LOGIN
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* ============= 2. HERO SECTION ============= */}
      <header className="vh-100 d-flex align-items-center text-white position-relative" style={{ paddingTop: '80px' }}>
        <Container>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="p-5 rounded-4"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              maxWidth: '700px'
            }}
          >
            <span className="text-uppercase mb-3 d-block tracking-[4px]" style={{ color: goldColor, letterSpacing: '4px' }}>Welcome to Luxury</span>
            <h1 className="display-2 fw-bold mb-4 leading-tight">Discover the Art <br/> of Hospitality</h1>
            <p className="lead mb-5 opacity-90">Experience high-level comfort with affordable rates designed for your peace of mind.</p>
            <Button 
              size="lg" 
              className="rounded-pill px-5 py-3 border-0 shadow-lg fw-bold" 
              style={{ backgroundColor: goldColor, color: '#000' }} 
              onClick={() => document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Suites
            </Button>
          </motion.div>
        </Container>
      </header>

      {/* ============= 3. ENJOY YOUR STAY (ABOUT) ============= */}
      <section id="about" ref={aboutRef} className="py-5 text-white">
        <Container className="py-5">
          <div className="p-5 rounded-4 shadow-lg" style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Row className="mb-5">
              <Col lg={6}>
                <motion.div initial={{ opacity: 0, x: -30 }} animate={aboutInView ? { opacity: 1, x: 0 } : {}}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <Sparkles size={32} style={{ color: goldColor }} />
                    <h2 className="fw-bold mb-0 text-white text-nowrap" style={{ 
                      fontSize: '2.5rem',
                      letterSpacing: '1px',
                      fontFamily: 'Georgia, serif',
                      borderBottom: `3px solid ${goldColor}`,
                      paddingBottom: '10px'
                    }}>
                      ENJOY YOUR STAY
                    </h2>
                    <Sparkles size={32} style={{ color: goldColor }} />
                  </div>
                  <p className="text-white opacity-90">We combine the quality standard of a hotel with the advantages of an apartment.</p>
                </motion.div>
              </Col>
            </Row>
            <Row className="align-items-center">
              <Col lg={7}>
                <Row className="g-4">
                  {[
                    { icon: <Clock color={goldColor} />, title: '24 hours Room Service', desc: 'You have access to 24-hours a day room service at our hotel.' },
                    { icon: <Utensils color={goldColor} />, title: 'Restaurant and Bars', desc: 'Access to world state of art restaurants and bars.' },
                    { icon: <Dumbbell color={goldColor} />, title: 'Fitness and Spa', desc: 'Wellness packages included with your booking.' },
                    { icon: <Wifi color={goldColor} />, title: 'Free Wi-Fi Access', desc: 'High-speed internet throughout the hotel.' }
                  ].map((item, i) => (
                    <Col md={6} key={i} className="mb-4 text-start">
                      <div className="d-flex align-items-start">
                        <div className="me-3">{item.icon}</div>
                        <div>
                          <h6 className="fw-bold mb-1 text-white">{item.title}</h6>
                          <p className="small text-white opacity-75 mb-0">{item.desc}</p>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
              <Col lg={5} className="text-center position-relative">
                <div className="rounded-4 overflow-hidden shadow-lg" style={{
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" alt="Pool" className="img-fluid" />
                  <PlayCircle className="position-absolute top-50 start-50 translate-middle shadow-lg rounded-full" size={80} color="#fff" fill={goldColor} style={{ cursor: 'pointer', opacity: 0.9 }} />
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* ============= 4. DYNAMIC DATABASE ROOMS ============= */}
      <section id="rooms" ref={roomsRef} className="py-5 text-white">
        <Container className="py-5">
          <div className="text-center mb-5">
            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
              <Sparkles size={32} style={{ color: goldColor }} />
              <h2 className="fw-bold mb-0 text-white" style={{ 
                fontSize: '2.5rem',
                letterSpacing: '1px',
                fontFamily: 'Georgia, serif',
                borderBottom: `3px solid ${goldColor}`,
                paddingBottom: '10px'
              }}>
                OUR LUXURY SUITES
              </h2>
              <Sparkles size={32} style={{ color: goldColor }} />
            </div>
            <p className="text-white opacity-90">Experience luxury and comfort in our premium rooms</p>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner darkMode={false} />
              <p className="mt-3 text-muted">Loading our luxury suites...</p>
            </div>
          ) : (
            <Row className="g-4">
              {rooms.length > 0 ? rooms.map((room) => (
                <Col md={4} key={room._id}>
                  <Card className="h-100 border-0 shadow-lg overflow-hidden" style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div className="position-relative overflow-hidden" style={{ height: '280px' }}>
                      {/* Display all room images */}
                      {room.images && room.images.length > 0 ? (
                        room.images.length === 1 ? (
                          // Single image
                          <Card.Img 
                            variant="top" 
                            src={room.images[0]} 
                            style={{ 
                              height: '280px', 
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        ) : (
                          // Multiple images - Simple grid layout
                          <div className="d-flex h-100">
                            {room.images.slice(0, 3).map((image, index) => (
                              <div 
                                key={index}
                                className="flex-fill position-relative overflow-hidden"
                                style={{ 
                                  borderRight: index < Math.min(room.images.length, 3) - 1 ? '2px solid white' : 'none'
                                }}
                              >
                                <img 
                                  src={image} 
                                  alt={`Room ${room.roomNumber} - Image ${index + 1}`}
                                  style={{ 
                                    width: '100%',
                                    height: '280px', 
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80';
                                  }}
                                />
                                {/* Image count overlay for last image if more than 3 */}
                                {index === 2 && room.images.length > 3 && (
                                  <div 
                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                    style={{ 
                                      background: 'rgba(0,0,0,0.6)',
                                      color: 'white',
                                      fontSize: '1.2rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    +{room.images.length - 3} more
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        // Fallback image
                        <Card.Img 
                          variant="top" 
                          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"
                          style={{ 
                            height: '280px', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      )}
                      
                      {/* Status Badge */}
                      <Badge 
                        className="position-absolute top-3 left-3 px-3 py-2 shadow" 
                        bg={
                          room.isComingSoon ? 'info' : 
                          room.isWorking ? 'warning' :
                          room.isBookable ? 'success' : 'danger'
                        }
                      >
                        {room.isComingSoon ? '🚀 Coming Soon' : 
                         room.isWorking ? '🔧 In Working' :
                         room.isBookable ? '✨ Available' : '🔒 Occupied'}
                      </Badge>
                      
                      {/* Price Badge */}
                      {!room.isComingSoon && !room.isWorking && (
                        <Badge 
                          className="position-absolute top-3 right-3 px-3 py-2 shadow border-0" 
                          style={{ backgroundColor: goldColor, color: '#000' }}
                        >
                          Rs {room.price?.toLocaleString()} / Night
                        </Badge>
                      )}
                      
                      {room.isComingSoon && (
                        <Badge 
                          className="position-absolute top-3 right-3 px-3 py-2 shadow" 
                          bg="primary"
                        >
                          Coming Soon
                        </Badge>
                      )}
                      
                      {room.isWorking && (
                        <Badge 
                          className="position-absolute top-3 right-3 px-3 py-2 shadow" 
                          bg="warning"
                          style={{ color: '#000' }}
                        >
                          {room.status === 'MAINTENANCE' ? '🔧 Maintenance' : '⚙️ Work in Progress'}
                        </Badge>
                      )}
                    </div>
                    
                    <Card.Body className="p-4 d-flex flex-column text-white">
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-2 text-capitalize text-white">{room.type} Suite</h5>
                        <p className="text-white opacity-90 mb-3 small">
                          {room.description || `Luxurious ${room.type} suite with premium amenities and stunning views.`}
                        </p>
                        
                        {/* Room Features */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <span className="fw-bold small me-2 text-white">
                              👤 {room.capacity} Guest{room.capacity > 1 ? 's' : ''}
                            </span>
                            <span className="text-white opacity-75 small">
                              • Room #{room.roomNumber}
                            </span>
                          </div>
                          
                          {room.features && room.features.length > 0 && (
                            <div className="d-flex flex-wrap gap-1">
                              {room.features.slice(0, 3).map((feature, index) => (
                                <Badge key={index} bg="light" text="dark" className="small">
                                  {feature}
                                </Badge>
                              ))}
                              {room.features.length > 3 && (
                                <Badge bg="secondary" className="small">
                                  +{room.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Expected Availability for Coming Soon */}
                        {room.isComingSoon && room.expectedAvailability && (
                          <p className="small text-info mb-3">
                            <strong>Expected:</strong> {new Date(room.expectedAvailability).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="pt-3 border-top">
                        {room.isComingSoon ? (
                          <Button 
                            variant="outline-info" 
                            className="w-100 rounded-0 fw-bold" 
                            disabled
                          >
                            🚀 Coming Soon
                          </Button>
                        ) : room.isWorking ? (
                          <Button 
                            variant="outline-warning" 
                            className="w-100 rounded-0 fw-bold" 
                            disabled
                          >
                            🔧 Under Maintenance
                          </Button>
                        ) : (
                          <Button 
                            className="w-100 rounded-pill fw-bold border-0 shadow-lg" 
                            style={{ 
                              backgroundColor: goldColor, 
                              color: '#000' 
                            }}
                            onClick={() => handleBookRoom(room)}
                          >
                            Book Now
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )) : (
                <Col xs={12}>
                  <div className="text-center py-5">
                    <h4 className="text-muted">No rooms available at the moment</h4>
                    <p className="text-muted">Please check back later for our luxury suites</p>
                  </div>
                </Col>
              )}
            </Row>
          )}
          
          {/* View All Rooms Button */}
          {rooms.length > 0 && (
            <div className="text-center mt-5">
              <Button 
                size="lg" 
                className="rounded-pill px-5 py-3 border-0 fw-bold shadow-lg"
                style={{ backgroundColor: goldColor, color: '#000' }}
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to view all rooms');
                    navigate('/login');
                  } else {
                    navigate('/user-dashboard');
                  }
                }}
              >
                View All Suites
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* ============= 5. STAR HOTEL FACILITIES ============= */}
      <section id="facilities" ref={facilitiesRef} className="py-5 text-white text-center">
        <Container className="py-5">
          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
            <Sparkles size={32} style={{ color: goldColor }} />
            <h2 className="fw-bold mb-0 text-white" style={{ 
              fontSize: '2.5rem',
              letterSpacing: '1px',
              fontFamily: 'Georgia, serif',
              borderBottom: `3px solid ${goldColor}`,
              paddingBottom: '10px'
            }}>
              STAR HOTEL FACILITIES
            </h2>
            <Sparkles size={32} style={{ color: goldColor }} />
          </div>
          <p className="text-white opacity-90 mb-5">Enjoy the state of the art facilities in our hotel</p>
          
          <div className="rounded-4 overflow-hidden shadow-lg mb-5" style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Row className="text-start align-items-center p-0 m-0">
              <Col lg={6} className="p-0">
                <img src="https://img.freepik.com/premium-photo/swimming-pool-beach-luxury-hotel_146671-19420.jpg?semt=ais_hybrid&w=740&q=80" alt="Telephone" className="w-100 h-100 object-fit-cover" style={{ minHeight: '350px' }} />
              </Col>
              <Col lg={6} className="ps-lg-5 p-5">
                <h3 className="fw-bold mb-3 text-white">Access to 24hr Digital Telephone Services</h3>
                <p className="small text-white opacity-90 mb-4">Voice communication flexibility from your home or business.</p>
                <h6 className="fw-bold small mb-3 uppercase tracking-wider text-white">More Details</h6>
                <div className="space-y-2">
                  {['Unlimited Long Distance', 'Caller ID', 'Caller Waiting'].map((item, i) => (
                    <div key={i} className="small d-flex align-items-center mb-2 text-white"><CheckSquare size={16} color={goldColor} className="me-2" /> {item}</div>
                  ))}
                </div>
              </Col>
            </Row>
          </div>

          {/* ============= DISCOUNT BANNER ============= */}
          <div className="mb-5">
            <DiscountBanner />
          </div>

          <div className="d-flex justify-content-center align-items-center gap-3 mb-5 mt-5 pt-4">
            <Sparkles size={32} style={{ color: goldColor }} />
            <h2 className="fw-bold mb-0 text-white" style={{ 
              fontSize: '2.5rem',
              letterSpacing: '1px',
              fontFamily: 'Georgia, serif',
              borderBottom: `3px solid ${goldColor}`,
              paddingBottom: '10px'
            }}>
              OTHER FACILITIES
            </h2>
            <Sparkles size={32} style={{ color: goldColor }} />
          </div>
          <Row className="g-4 text-start">
            {[
              { title: 'GYMNASIUM', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80', desc: 'Equipped gymnasium with an instructor always available.' },
              { title: 'HELIPAD', img: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=800&q=80', desc: 'State of the art helipad with experienced pilots.' },
              { title: 'RESTAURANTS', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', desc: 'Best local and intercontinental dishes.' },
              { title: 'SWIMMING POOLS', img: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80', desc: 'Best equipped pool with an instructor.' }
            ].map((f, i) => (
              <Col md={6} key={i} className="mb-4">
                <div className="rounded-4 overflow-hidden shadow-lg h-100" style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div className="overflow-hidden">
                    <img src={f.img} alt={f.title} className="w-100 object-fit-cover transition-transform hover:scale-105 duration-500" style={{ height: '250px', objectFit: 'cover' }} />
                  </div>
                  <div className="p-4 flex-grow-1 d-flex flex-column">
                    <h6 className="fw-bold mb-2 tracking-widest text-white">{f.title}</h6>
                    <p className="small text-white opacity-90 leading-relaxed mb-0">{f.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============= CUSTOMER REVIEWS ============= */}
      <ReviewsSection />

      {/* ============= 6. CONTACT SECTION ============= */}
      <section id="contact" ref={contactRef} className="py-5 text-white text-center">
        <Container className="py-5">
          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
            <Sparkles size={32} style={{ color: goldColor }} />
            <h2 className="fw-bold mb-0 text-white" style={{ 
              fontSize: '2.5rem',
              letterSpacing: '1px',
              fontFamily: 'Georgia, serif',
              borderBottom: `3px solid ${goldColor}`,
              paddingBottom: '10px'
            }}>
              CONTACT US
            </h2>
            <Sparkles size={32} style={{ color: goldColor }} />
          </div>
          <p className="text-white opacity-90 mb-5">struck a partnership or provide feedback? Fill the form below</p>
          <Card className="border-0 shadow-lg mx-auto overflow-hidden rounded-4" style={{ 
            maxWidth: '950px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Row className="g-0">
              <Col md={7} className="p-5 text-start">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Control 
                        placeholder="Name" 
                        className="rounded-pill py-2" 
                        required 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white'
                        }}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Control 
                        placeholder="Email" 
                        type="email" 
                        className="rounded-pill py-2" 
                        required 
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white'
                        }}
                      />
                    </Col>
                  </Row>
                  <Form.Control 
                    placeholder="Phone Number" 
                    className="rounded-pill mb-4 py-2" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                  />
                  <Form.Control 
                    as="textarea" 
                    rows={5} 
                    placeholder="Message" 
                    className="mb-4 rounded-4 resize-none" 
                    required 
                    value={formData.message} 
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                  />
                  <Button 
                    type="submit" 
                    className="rounded-pill border-0 px-5 py-3 fw-bold shadow-lg" 
                    style={{ backgroundColor: goldColor, color: '#000' }}
                  >
                    SEND MESSAGE
                  </Button>
                </Form>
              </Col>
              <Col md={5} className="p-5 text-white d-flex flex-column justify-content-center text-start position-relative">
                <div className="absolute inset-0 z-0" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}></div>
                <div className="relative z-10">
                  <h4 className="fw-bold mb-4 border-bottom pb-2 d-inline-block" style={{ borderColor: goldColor + ' !important' }}>Location</h4>
                  <div className="space-y-6">
                    <div className="d-flex align-items-start gap-3 small"><MapPin size={22} style={{ color: goldColor }} className="shrink-0" /> Sky valley ,shangla</div>
                    <div className="d-flex align-items-center gap-3 small"><Phone size={22} style={{ color: goldColor }} className="shrink-0" /> +9212113132</div>
                    <div className="d-flex align-items-center gap-3 small"><Mail size={22} style={{ color: goldColor }} className="shrink-0" /> support@toobahotels.com</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Container>
      </section>

      {/* ============= FOOTER (Same as Homepage) ============= */}
      <footer style={{ backgroundColor: '#1a1105', color: '#ffffff', borderTop: `4px solid ${goldColor}` }} className="py-5">
        <Container>
          <Row className="g-4 text-start">
            <Col md={4}>
              <h5 className="fw-bold mb-3" style={{ color: goldColor }}>TOOBA HOTELS</h5>
              <p className="small opacity-75 text-white">Hospitality and Comfort are our watchwords. Experience luxury like never before.</p>
              <div className="d-flex gap-3 mt-4">
                <Facebook size={20} className="text-white cursor-pointer hover-gold" />
                <Twitter size={20} className="text-white cursor-pointer hover-gold" />
                <Instagram size={20} className="text-white cursor-pointer hover-gold" />
              </div>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold mb-3 small text-uppercase" style={{ color: goldColor, letterSpacing: '2px' }}>Contact Details</h6>
              <div className="small text-white opacity-75">
                <p className="mb-2 d-flex align-items-center">
                  <MapPin size={14} className="me-2" style={{ color: goldColor }} /> 
                  Sky valley , shangla
                </p>
                <p className="mb-2 d-flex align-items-center">
                  <Phone size={14} className="me-2" style={{ color: goldColor }} /> 
                 +922131131
                </p>
                <p className="mb-0 d-flex align-items-center">
                  <Mail size={14} className="me-2" style={{ color: goldColor }} /> 
                  support@toobahotels.com
                </p>
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              <h6 className="fw-bold mb-3 small text-uppercase" style={{ color: goldColor, letterSpacing: '2px' }}>Legal</h6>
              <div className="small text-white opacity-75">
                <p className="mb-1 cursor-pointer hover-gold">Privacy Policy</p>
                <p className="mb-0 cursor-pointer hover-gold">Terms of Service</p>
              </div>
            </Col>
          </Row>
          <div className="text-center mt-5 pt-4 border-top border-secondary opacity-50 small text-white">
            © 2026 Tooba Hotels. All rights reserved.
          </div>
        </Container>
      </footer>

      {/* ============= WHATSAPP FLOATING BUTTON ============= */}
      <a
        href="https://wa.me/923348596128?text=Hello%20Tooba%20Hotels!%20I%20would%20like%20to%20inquire%20about%20room%20booking."
        target="_blank"
        rel="noopener noreferrer"
        className="position-fixed d-flex align-items-center justify-content-center shadow-lg"
        style={{
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#25D366',
          color: 'white',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          textDecoration: 'none',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(37, 211, 102, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <MessageCircle size={30} />
      </a>

      {/* WhatsApp pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(37, 211, 102, 0);
          }
        }
      `}</style>

      </div>
    </div>
  );
}
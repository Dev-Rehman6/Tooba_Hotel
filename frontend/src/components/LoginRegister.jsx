import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { login, register } from '../services/api';

export default function LoginRegister({ onLogin }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  const goldColor = "#d4af37";

  // Handle scroll effect and theme
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [darkMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(loginData);
      
      // Handle the new backend response format
      if (response?.data) {
        // Create user object for onLogin callback to match expected format
        const userData = {
          token: response.data.token,
          role: response.data.role,
          name: response.data.name
        };
        
        // Call onLogin first to set the user state
        onLogin(userData);
        
        // Show success message
        const userRole = response.data.role;
        const dashboardName = userRole === 'admin' ? 'Admin Dashboard' : 
                             userRole === 'staff' ? 'Staff Dashboard' : 'User Dashboard';
        
        console.log(`Login successful for ${response.data.name} with role: ${userRole}`);
        console.log(`Redirecting to: ${dashboardName}`);
        
        toast.success(`Welcome back, ${response.data.name}! Redirecting to ${dashboardName}...`);
        
        // Navigate based on user role after a short delay
        setTimeout(() => {
          switch (userRole) {
            case 'admin':
              navigate('/admin-dashboard');
              break;
            case 'staff':
              navigate('/staff-dashboard');
              break;
            case 'user':
              navigate('/user-dashboard');
              break;
            default:
              navigate('/user-dashboard'); // fallback to user dashboard
          }
        }, 1000); // 1 second delay to show the toast
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    try {
      await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      });
      
      const successMsg = 'Registration successful! Please login.';
      setSuccess(successMsg);
      toast.success(successMsg);
      
      // Switch to login tab after a short delay
      setTimeout(() => {
        setActiveTab('login');
        setSuccess('');
      }, 2000);
      
      setRegisterData({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex flex-column">
      <Toaster position="top-center" />

      {/* ============= NAVBAR (Same as Homepage) ============= */}
      <Navbar expand="lg" fixed="top" className={`py-3 transition-all duration-500 ${isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center fw-bold">
            <div className="w-10 h-10 rounded-full d-flex align-items-center justify-content-center text-white me-2 shadow-sm" style={{ backgroundColor: goldColor, width: '40px', height: '40px' }}>
              T
            </div>
            <div className="d-flex flex-column text-start">
              <span style={{ color: isScrolled ? '#1e293b' : '#ffffff', letterSpacing: '1px', fontSize: '1.2rem', lineHeight: '1' }}>TOOBA</span>
              <span className="text-uppercase" style={{ color: goldColor, fontSize: '10px', letterSpacing: '3px' }}>Hotels</span>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" className={isScrolled ? "" : "bg-white"} />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {['Home', 'About', 'Rooms', 'Facilities', 'Contact'].map((item) => (
                <Nav.Link 
                  key={item} 
                  href={item === 'Home' ? '/' : `/#${item.toLowerCase()}`} 
                  className="fw-semibold px-3" 
                  style={{ color: isScrolled ? '#1e293b' : '#ffffff' }}
                >
                  {item}
                </Nav.Link>
              ))}
              <Nav.Link onClick={() => setDarkMode(!darkMode)} className="px-3">
                {darkMode ? '☀️' : '🌙'}
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* ============= AUTH SECTION with Different Background ============= */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: '100px',
        paddingBottom: '80px',
        minHeight: '100vh'
      }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={5}>
              <Card className="border-0 shadow-2xl overflow-hidden" style={{
                background: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(15px)',
                borderRadius: '24px'
              }}>
                <Card.Body className="p-4 p-md-5">
                  <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <div className="rounded-full d-flex align-items-center justify-content-center text-white me-3 shadow-sm" style={{ backgroundColor: goldColor, width: '50px', height: '50px' }}>
                        T
                      </div>
                      <div className="text-start">
                        <h2 className="fw-bold mb-0" style={{ color: darkMode ? '#ffffff' : '#1e293b', letterSpacing: '1px' }}>TOOBA</h2>
                        <span className="text-uppercase small" style={{ color: goldColor, letterSpacing: '2px' }}>Hotels</span>
                      </div>
                    </div>
                    <p className="text-muted small">Welcome back! Please sign in to continue</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-2 small rounded-3 text-center border-0" dismissible onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" className="py-2 small rounded-3 text-center border-0" dismissible onClose={() => setSuccess('')}>
                      {success}
                    </Alert>
                  )}

                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k || 'login')}
                    className="mb-4 custom-tabs d-flex justify-content-center border-0"
                  >
                    <Tab eventKey="login" title="SIGN IN">
                      <Form onSubmit={handleLogin} className="mt-2 text-start">
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            className="py-3 rounded-3 border-2"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="small fw-bold text-muted mb-0">Password</Form.Label>
                            <a 
                              href="/forgot-password" 
                              className="small text-decoration-none"
                              style={{ color: goldColor }}
                            >
                              Forgot Password?
                            </a>
                          </div>
                          <Form.Control
                            type="password"
                            placeholder="Enter your password"
                            className="py-3 rounded-3 border-2"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Button
                          type="submit"
                          className="w-100 py-3 rounded-3 fw-bold border-0 text-white shadow"
                          disabled={loading}
                          style={{ backgroundColor: goldColor }}
                        >
                          {loading ? 'SIGNING IN...' : 'SIGN IN NOW'}
                        </Button>
                      </Form>
                    </Tab>

                    <Tab eventKey="register" title="JOIN US">
                      <Form onSubmit={handleRegister} className="text-start">
                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">Full Name</Form.Label>
                          <Form.Control
                            placeholder="Enter your full name"
                            className="py-3 rounded-3 border-2"
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Enter your email"
                            className="py-3 rounded-3 border-2"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">Role</Form.Label>
                          <Form.Select 
                            className="py-3 rounded-3 border-2"
                            value={registerData.role} 
                            onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          >
                            <option value="">Select your role</option>
                            <option value="user">Guest/Customer</option>
                            <option value="staff">Hotel Staff</option>
                            <option value="admin">Administrator</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-bold text-muted">Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Create a password"
                            className="py-3 rounded-3 border-2"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="small fw-bold text-muted">Confirm Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Confirm your password"
                            className="py-3 rounded-3 border-2"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            required
                            style={{ borderColor: '#e2e8f0' }}
                          />
                        </Form.Group>

                        <Button
                          type="submit"
                          className="w-100 py-3 rounded-3 fw-bold border-0 text-white shadow"
                          disabled={loading}
                          style={{ backgroundColor: goldColor }}
                        >
                          {loading ? 'CREATING ACCOUNT...' : 'REGISTER NOW'}
                        </Button>
                      </Form>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

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
                  23, Fola Osibo, Lekki Phase 1
                </p>
                <p className="mb-2 d-flex align-items-center">
                  <Phone size={14} className="me-2" style={{ color: goldColor }} /> 
                  +234 818 595 6620
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

      {/* Custom CSS for styling */}
      <style>{`
        .custom-tabs .nav-link {
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 1px;
          font-size: 0.85rem;
          border: none !important;
          padding: 10px 25px;
        }
        .custom-tabs .nav-link.active {
          color: ${goldColor} !important;
          background: transparent !important;
          border-bottom: 3px solid ${goldColor} !important;
        }
        .form-control:focus {
          border-color: ${goldColor};
          box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
        }
        .hover-gold:hover {
          color: ${goldColor} !important;
          transition: 0.3s ease;
        }
        .transition-all { 
          transition: all 0.4s ease; 
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
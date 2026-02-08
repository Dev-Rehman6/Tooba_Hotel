import { Container, Row, Col } from 'react-bootstrap';

export default function Footer({ darkMode }) {
  return (
    <footer 
      className={`py-5 mt-5 ${darkMode ? 'text-light' : 'text-dark'}`}
      style={{ 
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}
    >
      <Container>
        <Row className="g-4">
          <Col lg={4}>
            <div className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center">
                <span className="me-2" style={{ fontSize: '1.5rem' }}>🏨</span>
                Grand Hotel
              </h5>
              <p className={`mb-3 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                Experience luxury and comfort at Grand Hotel. We provide world-class amenities 
                and exceptional service to make your stay unforgettable.
              </p>
              <div className="d-flex gap-3">
                <a 
                  href="#" 
                  className={`${darkMode ? 'text-light' : 'text-primary'}`}
                  style={{ fontSize: '1.2rem', transition: 'transform 0.2s ease', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  📘
                </a>
                <a 
                  href="#" 
                  className={`${darkMode ? 'text-light' : 'text-info'}`}
                  style={{ fontSize: '1.2rem', transition: 'transform 0.2s ease', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  🐦
                </a>
                <a 
                  href="#" 
                  className={`${darkMode ? 'text-light' : 'text-danger'}`}
                  style={{ fontSize: '1.2rem', transition: 'transform 0.2s ease', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  📷
                </a>
                <a 
                  href="#" 
                  className={`${darkMode ? 'text-light' : 'text-primary'}`}
                  style={{ fontSize: '1.2rem', transition: 'transform 0.2s ease', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  💼
                </a>
              </div>
            </div>
          </Col>
          
          <Col lg={2} md={6}>
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a 
                  href="#" 
                  className={`text-decoration-none ${darkMode ? 'text-light' : 'text-muted'}`}
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = darkMode ? '#fff' : '#007bff'}
                  onMouseLeave={(e) => e.target.style.color = darkMode ? 'rgba(255,255,255,0.8)' : '#6c757d'}
                >
                  About Us
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#" 
                  className={`text-decoration-none ${darkMode ? 'text-light' : 'text-muted'}`}
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = darkMode ? '#fff' : '#007bff'}
                  onMouseLeave={(e) => e.target.style.color = darkMode ? 'rgba(255,255,255,0.8)' : '#6c757d'}
                >
                  Our Rooms
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#" 
                  className={`text-decoration-none ${darkMode ? 'text-light' : 'text-muted'}`}
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = darkMode ? '#fff' : '#007bff'}
                  onMouseLeave={(e) => e.target.style.color = darkMode ? 'rgba(255,255,255,0.8)' : '#6c757d'}
                >
                  Services
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#" 
                  className={`text-decoration-none ${darkMode ? 'text-light' : 'text-muted'}`}
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = darkMode ? '#fff' : '#007bff'}
                  onMouseLeave={(e) => e.target.style.color = darkMode ? 'rgba(255,255,255,0.8)' : '#6c757d'}
                >
                  Gallery
                </a>
              </li>
            </ul>
          </Col>
          
          <Col lg={3} md={6}>
            <h6 className="fw-bold mb-3">Services</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <span className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  🏊‍♂️ Swimming Pool
                </span>
              </li>
              <li className="mb-2">
                <span className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  🏋️‍♂️ Fitness Center
                </span>
              </li>
              <li className="mb-2">
                <span className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  🍽️ Restaurant & Bar
                </span>
              </li>
              <li className="mb-2">
                <span className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  🚗 Valet Parking
                </span>
              </li>
              <li className="mb-2">
                <span className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  📶 Free WiFi
                </span>
              </li>
            </ul>
          </Col>
          
          <Col lg={3}>
            <h6 className="fw-bold mb-3">Contact Info</h6>
            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                📍 <span className={`ms-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  123 Hotel Street, City, Country
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                📞 <span className={`ms-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  +1 (555) 123-4567
                </span>
              </div>
              <div className="d-flex align-items-center">
                📧 <span className={`ms-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                  info@grandhotel.com
                </span>
              </div>
            </div>
          </Col>
        </Row>
        
        <hr className={`my-4 ${darkMode ? 'border-light' : 'border-dark'}`} style={{ opacity: 0.2 }} />
        
        <Row className="align-items-center">
          <Col md={6}>
            <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ opacity: 0.7 }}>
              © 2024 Grand Hotel. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="d-flex justify-content-md-end gap-3">
              <a 
                href="#" 
                className={`text-decoration-none small ${darkMode ? 'text-light' : 'text-muted'}`}
                style={{ opacity: 0.7 }}
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className={`text-decoration-none small ${darkMode ? 'text-light' : 'text-muted'}`}
                style={{ opacity: 0.7 }}
              >
                Terms of Service
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Star, Quote, Sparkles } from 'lucide-react';
import { getApprovedReviews } from '../services/api';
import { motion } from 'framer-motion';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const goldColor = "#d4af37";

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await getApprovedReviews();
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 18) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={size}
        fill={index < rating ? goldColor : 'none'}
        color={index < rating ? goldColor : 'rgba(255, 255, 255, 0.3)'}
      />
    ));
  };

  if (loading || reviews.length === 0) return null;

  return (
    <section className="py-5 text-white">
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
              WHAT OUR GUESTS SAY
            </h2>
            <Sparkles size={32} style={{ color: goldColor }} />
          </div>
          <p className="text-white opacity-90">Real experiences from our valued customers</p>
        </div>

        <Row className="g-4">
          {reviews.slice(0, 6).map((review, index) => (
            <Col md={6} lg={4} key={review._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="h-100 border-0 shadow-lg position-relative"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '15px',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Quote icon */}
                  <div 
                    className="position-absolute"
                    style={{
                      top: '15px',
                      right: '15px',
                      opacity: 0.2
                    }}
                  >
                    <Quote size={40} color={goldColor} />
                  </div>

                  <Card.Body className="p-4">
                    {/* Rating */}
                    <div className="d-flex gap-1 mb-3">
                      {renderStars(review.rating)}
                    </div>

                    {/* Title */}
                    <h5 className="fw-bold text-white mb-2">{review.title}</h5>

                    {/* Comment */}
                    <p className="text-white opacity-90 mb-3" style={{ fontSize: '0.95rem' }}>
                      "{review.comment}"
                    </p>

                    {/* User info */}
                    <div className="d-flex align-items-center gap-3 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.2) !important' }}>
                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '45px',
                          height: '45px',
                          background: `linear-gradient(135deg, ${goldColor} 0%, #f39c12 100%)`,
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}
                      >
                        {review.user?.name?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div>
                        <div className="fw-bold text-white">{review.user?.name || 'Guest'}</div>
                        <div className="small text-white opacity-75">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Average rating display */}
        {reviews.length > 0 && (
          <div className="text-center mt-5">
            <div 
              className="d-inline-block p-4 rounded-4"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div>
                  <div className="display-4 fw-bold text-white">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </div>
                  <div className="d-flex gap-1 justify-content-center mb-2">
                    {renderStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length), 32)}
                  </div>
                </div>
                <div className="text-start">
                  <div className="text-white fw-bold">Excellent</div>
                  <div className="text-white opacity-75 small">Based on {reviews.length} reviews</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Card } from 'react-bootstrap';
import { Tag, TrendingDown, Calendar, Users, Sparkles, PlayCircle, CheckSquare } from 'lucide-react';
import { getActiveDiscounts } from '../services/api';

export default function DiscountBanner() {
  const [discounts, setDiscounts] = useState([]);
  const goldColor = "#d4af37";
  const brownColor = "#8B4513";
  const creamColor = "#FFF8DC";

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await getActiveDiscounts();
      setDiscounts(response.data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  if (discounts.length === 0) return null;

  const getDiscountIcon = (type) => {
    switch (type) {
      case 'WEEKEND':
        return <Calendar size={24} />;
      case 'SEASONAL':
        return <TrendingDown size={24} />;
      case 'MULTI_ROOM':
        return <Users size={24} />;
      default:
        return <Tag size={24} />;
    }
  };

  return (
    <section className="py-5" style={{ 
      position: 'relative'
    }}>
      <Container>
        <div className="text-center mb-5">
          <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
            <Sparkles size={32} style={{ color: goldColor }} />
            <h2 className="fw-bold mb-0 text-white" style={{ 
              fontSize: '2.5rem',
              letterSpacing: '1px',
              fontFamily: 'Georgia, serif',
              borderBottom: `3px solid ${goldColor}`,
              paddingBottom: '10px'
            }}>
              SPECIAL OFFERS
            </h2>
            <Sparkles size={32} style={{ color: goldColor }} />
          </div>
          <div style={{
            width: '100px',
            height: '3px',
            background: goldColor,
            margin: '0 auto 15px'
          }} />
          <p className="text-white" style={{ 
            fontSize: '1.1rem',
            fontStyle: 'italic'
          }}>
            Exclusive Discounts Just For You
          </p>
        </div>
        
        <Row className="g-4 justify-content-center">
          {discounts.map((discount) => (
            <Col md={6} lg={4} xl={3} key={discount._id}>
              <Card 
                className="h-100 border-0 shadow-lg position-relative overflow-hidden"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  borderRadius: '15px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(212, 175, 55, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Decorative corner */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 60px 60px 0',
                  borderColor: `transparent ${goldColor} transparent transparent`,
                  opacity: 0.3
                }} />
                
                <Card.Body className="text-center p-4 position-relative">
                  {/* Icon */}
                  <div 
                    className="mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ 
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `rgba(212, 175, 55, 0.3)`,
                      border: `2px solid ${goldColor}`,
                      color: goldColor
                    }}
                  >
                    {getDiscountIcon(discount.type)}
                  </div>
                  
                  {/* Discount Percentage - Large and Bold */}
                  <div 
                    className="mb-3 py-3 px-4"
                    style={{
                      background: `rgba(212, 175, 55, 0.2)`,
                      backdropFilter: 'blur(10px)',
                      border: `2px solid ${goldColor}`,
                      borderRadius: '10px',
                      position: 'relative'
                    }}
                  >
                    <h2 className="fw-bold mb-0 text-white" style={{ 
                      fontSize: '2.5rem',
                      letterSpacing: '2px',
                      fontFamily: 'Georgia, serif'
                    }}>
                      {discount.percentage}%
                    </h2>
                    <p className="mb-0 text-white" style={{ 
                      fontSize: '0.9rem',
                      letterSpacing: '3px',
                      fontWeight: '600'
                    }}>
                      OFF
                    </p>
                  </div>
                  
                  {/* Discount Name */}
                  <h5 className="fw-bold mb-2 text-white" style={{ 
                    fontFamily: 'Georgia, serif'
                  }}>
                    {discount.name}
                  </h5>
                  
                  {/* Type Badge */}
                  <Badge 
                    className="mb-3 px-3 py-2"
                    style={{
                      background: goldColor,
                      color: '#000',
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      fontWeight: '600'
                    }}
                  >
                    {discount.type.replace('_', ' ')}
                  </Badge>
                  
                  {/* Description */}
                  {discount.description && (
                    <p className="small mb-2 text-white opacity-90" style={{ fontStyle: 'italic' }}>
                      {discount.description}
                    </p>
                  )}
                  
                  {/* Additional Info */}
                  {discount.type === 'MULTI_ROOM' && discount.minRooms && (
                    <p className="small mb-0 text-white" style={{ fontWeight: '600' }}>
                      📦 Book {discount.minRooms}+ rooms
                    </p>
                  )}
                  
                  {discount.type === 'SEASONAL' && discount.season && (
                    <p className="small mb-0 text-white" style={{ fontWeight: '600' }}>
                      🌟 {discount.season} Season
                    </p>
                  )}
                  
                  {discount.type === 'WEEKEND' && (
                    <p className="small mb-0 text-white" style={{ fontWeight: '600' }}>
                      📅 Weekend Special
                    </p>
                  )}
                </Card.Body>
                
                {/* Bottom decorative line */}
                <div style={{
                  height: '4px',
                  background: `linear-gradient(90deg, transparent 0%, ${goldColor} 50%, transparent 100%)`
                }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

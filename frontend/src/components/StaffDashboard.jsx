import { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Card, Row, Col, Table, Badge, Alert, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Users, Calendar, Settings, LogOut, Plus, Edit3, Eye, 
  TrendingUp, Bed, Clock, CheckCircle, AlertCircle,
  BarChart3, PieChart, Download, Mail, Search, Filter,
  Star, Wifi, Car, Coffee, Dumbbell, MapPin, Phone, CreditCard,
  User, BookOpen, History, Heart, Wrench, Sparkles, Brush,
  PlayCircle, StopCircle, CheckSquare, AlertTriangle
} from 'lucide-react';
import PakistaniRupeeIcon from './PakistaniRupeeIcon';
import api from '../services/api';

export default function StaffDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cleaning');
  const [tasks, setTasks] = useState([]);
  const [cleaningTasks, setCleaningTasks] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(false);

  const goldColor = "#d4af37";

  useEffect(() => {
    fetchTasks();
    fetchCleaningTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/staff/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setAlert({ show: true, message: 'Failed to load maintenance tasks', variant: 'danger' });
    }
  };

  const fetchCleaningTasks = async () => {
    try {
      const response = await api.get('/rooms/cleaning');
      setCleaningTasks(response.data);
    } catch (error) {
      console.error('Error fetching cleaning tasks:', error);
      setAlert({ show: true, message: 'Failed to load cleaning tasks', variant: 'danger' });
    }
  };

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  // Action for Maintenance: Start Repair
  const handleStartWork = async (roomId) => {
    setLoading(true);
    try {
      await api.put(`/rooms/${roomId}/start-work`);
      showAlert('🔧 Work started! Admin has been notified.', 'info');
      fetchTasks();
    } catch (error) {
      showAlert('Failed to start work', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Action for Maintenance & Housekeeping: Complete/Clean Room
  const handleCompleteWork = async (roomId) => {
    setLoading(true);
    try {
      await api.put(`/rooms/${roomId}/complete-work`);
      showAlert('✅ Work completed! Room is now available for booking.', 'success');
      fetchTasks();
    } catch (error) {
      showAlert('Failed to complete work', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Action for cleaning rooms after checkout
  const handleMarkCleaned = async (roomId) => {
    setLoading(true);
    try {
      await api.put(`/rooms/${roomId}/clean`);
      showAlert('✨ Room cleaned and ready for guests!', 'success');
      fetchCleaningTasks();
    } catch (error) {
      showAlert('Failed to mark room as cleaned', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERS ---
  const maintenanceTasks = tasks.filter((t) => t.status === 'MAINTENANCE' || t.status === 'WORKING_IN_PROGRESS');
  const housekeepingTasks = tasks.filter((t) => t.status === 'Occupied' || t.status === 'Dirty');

  const stats = {
    totalTasks: cleaningTasks.length + maintenanceTasks.length + housekeepingTasks.length,
    cleaning: cleaningTasks.length,
    maintenance: maintenanceTasks.length,
    housekeeping: housekeepingTasks.length,
    inProgress: tasks.filter(t => t.status === 'WORKING_IN_PROGRESS').length
  };
  // Helper function to render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cleaning':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🧽 Rooms Need Cleaning</h4>
              <div className="text-white opacity-75">
                {cleaningTasks.length} room{cleaningTasks.length !== 1 ? 's' : ''} waiting
              </div>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Type & Status</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleaningTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <Sparkles size={40} className="opacity-50" />
                            <div>All rooms are clean! Great job! ✨</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      cleaningTasks.map((room) => (
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
                              <Badge 
                                className="px-3 py-2 rounded-pill"
                                bg="warning"
                              >
                                <Brush size={14} className="me-1" />
                                Needs Cleaning
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              className="px-3 py-2 rounded-pill"
                              style={{ background: 'rgba(255, 193, 7, 0.8)', color: '#000' }}
                            >
                              High Priority
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              className="px-4 py-2 rounded-pill border-0 shadow"
                              style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}
                              onClick={() => handleMarkCleaned(room._id)} 
                              disabled={loading}
                            >
                              <CheckCircle size={16} className="me-2" />
                              {loading ? 'Marking...' : 'Mark Cleaned'}
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

      case 'maintenance':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🔧 Maintenance & Repair</h4>
              <div className="text-white opacity-75">
                {maintenanceTasks.length} task{maintenanceTasks.length !== 1 ? 's' : ''} assigned
              </div>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Type & Category</th>
                      <th>Current Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <Wrench size={40} className="opacity-50" />
                            <div>No maintenance tasks assigned! 🔧</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      maintenanceTasks.map((task) => (
                        <tr key={task._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room {task.roomNumber}</div>
                              <div className="small opacity-75">Maintenance Required</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="text-capitalize text-white">{task.type}</div>
                              <div className="small opacity-75">Repair Work</div>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              className="px-3 py-2 rounded-pill"
                              bg={task.status === 'MAINTENANCE' ? 'warning' : 'info'}
                            >
                              {task.status === 'WORKING_IN_PROGRESS' ? (
                                <>
                                  <PlayCircle size={14} className="me-1" />
                                  In Progress
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={14} className="me-1" />
                                  Maintenance
                                </>
                              )}
                            </Badge>
                          </td>
                          <td>
                            {task.status === 'MAINTENANCE' ? (
                              <Button 
                                className="px-4 py-2 rounded-pill border-0 shadow"
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
                                onClick={() => handleStartWork(task._id)} 
                                disabled={loading}
                              >
                                <PlayCircle size={16} className="me-2" />
                                Start Repair
                              </Button>
                            ) : (
                              <Button 
                                className="px-4 py-2 rounded-pill border-0 shadow"
                                style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}
                                onClick={() => handleCompleteWork(task._id)} 
                                disabled={loading}
                              >
                                <CheckSquare size={16} className="me-2" />
                                Complete Work
                              </Button>
                            )}
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

      case 'housekeeping':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-white fw-bold mb-0">🧼 Housekeeping Tasks</h4>
              <div className="text-white opacity-75">
                {housekeepingTasks.length} room{housekeepingTasks.length !== 1 ? 's' : ''} need service
              </div>
            </div>

            <Card className="card-glass border-0 shadow-lg rounded-4">
              <Card.Body className="p-0">
                <Table className="table-glass rounded-3 overflow-hidden mb-0">
                  <thead>
                    <tr>
                      <th>Room Details</th>
                      <th>Service Type</th>
                      <th>Condition</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {housekeepingTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-white py-4">
                          <div className="d-flex flex-column align-items-center gap-2">
                            <Heart size={40} className="opacity-50" />
                            <div>All housekeeping tasks completed! 🧼</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      housekeepingTasks.map((task) => (
                        <tr key={task._id}>
                          <td>
                            <div>
                              <div className="fw-bold text-white">Room {task.roomNumber}</div>
                              <div className="small opacity-75 text-capitalize">{task.type}</div>
                            </div>
                          </td>
                          <td>
                            <div className="text-white">
                              {task.status === 'Dirty' ? 'Deep Cleaning' : 'Daily Service'}
                            </div>
                          </td>
                          <td>
                            <Badge 
                              className="px-3 py-2 rounded-pill"
                              bg={task.status === 'Dirty' ? 'dark' : 'danger'}
                            >
                              {task.status === 'Dirty' ? (
                                <>
                                  <Brush size={14} className="me-1" />
                                  Post Checkout
                                </>
                              ) : (
                                <>
                                  <Bed size={14} className="me-1" />
                                  Guest Occupied
                                </>
                              )}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              className="px-4 py-2 rounded-pill border-0 shadow"
                              style={{ 
                                background: task.status === 'Dirty' 
                                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' 
                                  : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
                                color: 'white' 
                              }}
                              onClick={() => handleCompleteWork(task._id)} 
                              disabled={loading}
                            >
                              <Sparkles size={16} className="me-2" />
                              {task.status === 'Dirty' ? 'Mark Cleaned' : 'Complete Service'}
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

      default:
        return (
          <div>
            <h4 className="text-white fw-bold mb-4">🧽 Rooms Need Cleaning</h4>
            <p className="text-white">Welcome to your staff dashboard!</p>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80)',
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
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>TOOBA STAFF</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '2px' }}>OPERATIONS PORTAL</div>
            </div>
          </Navbar.Brand>
          
          <Nav className="ms-auto align-items-center">
            <div className="d-flex align-items-center gap-3 me-4">
              <div className="text-white text-end d-none d-md-block">
                <div className="fw-bold">{user?.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Staff Member</div>
              </div>
              <div className="rounded-circle d-flex align-items-center justify-content-center shadow" 
                   style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '40px', height: '40px' }}>
                <User size={18} className="text-white" />
              </div>
            </div>
            <ButtonGroup>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={() => navigate('/')}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-start-pill border-2"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <Home size={16} />
                <span className="d-none d-md-inline">Home</span>
              </Button>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={onLogout}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-end-pill border-2"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <LogOut size={16} />
                <span className="d-none d-md-inline">Logout</span>
              </Button>
            </ButtonGroup>
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
                         alert.variant === 'info' ? 'rgba(13, 202, 240, 0.9)' :
                         'rgba(255, 193, 7, 0.9)',
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
            { title: 'Total Tasks', value: stats.totalTasks, icon: BookOpen, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { title: 'Cleaning', value: stats.cleaning, icon: Brush, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { title: 'Maintenance', value: stats.maintenance, icon: Wrench, gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' },
            { title: 'In Progress', value: stats.inProgress, icon: PlayCircle, gradient: `linear-gradient(135deg, ${goldColor} 0%, #f39c12 100%)` },
            { title: 'Housekeeping', value: stats.housekeeping, icon: Sparkles, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
          ].map((stat, index) => (
            <Col key={index} lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-lg h-100 text-white rounded-4 overflow-hidden position-relative">
                <div 
                  className="position-absolute w-100 h-100"
                  style={{ background: stat.gradient, opacity: 0.9 }}
                />
                <Card.Body className="position-relative text-center py-4">
                  <div className="mb-3">
                    <stat.icon size={32} className="text-white opacity-90" />
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
                  { key: 'cleaning', label: 'Room Cleaning', icon: Brush },
                  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
                  { key: 'housekeeping', label: 'Housekeeping', icon: Sparkles }
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
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import './styles/modern-theme.css';

import LoginRegister from './components/LoginRegister';
import ForgotPassword from './components/ForgotPassword';
import Homepage from './components/Homepage';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import UserDashboard from './components/UserDashboard';

function App() {
 
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    if (token && role && name) {
      setUser({ token, role, name });
    }
  }, []);

  const handleLogin = (userData) => {
    // Handle both old and new data structures
    const token = userData.token;
    const role = userData.user?.role || userData.role;
    const name = userData.user?.name || userData.name;
    
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    setUser({ token, role, name });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" />;
    if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Homepage - shows all rooms */}
        <Route path="/" element={<Homepage user={user} onLogin={handleLogin} />} />
        
        {/* Login/Register - Always accessible */}
        <Route 
          path="/login" 
          element={<LoginRegister onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={<LoginRegister onLogin={handleLogin} />} 
        />
        <Route 
          path="/forgot-password" 
          element={<ForgotPassword />} 
        />
        
        {/* Protected Dashboards */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/admin" element={<Navigate to="/admin-dashboard" />} />
        <Route path="/staff" element={<Navigate to="/staff-dashboard" />} />
        <Route path="/user" element={<Navigate to="/user-dashboard" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
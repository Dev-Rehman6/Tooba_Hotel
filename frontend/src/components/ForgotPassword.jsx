import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, ArrowLeft } from 'lucide-react';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goldColor = "#d4af37";

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email);
      toast.success(response.data.message);
      
      // Show dev code if available
      if (response.data.devCode) {
        toast.success(`Development Code: ${response.data.devCode}`, { duration: 10000 });
      }
      
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyResetCode(email, code);
      toast.success(response.data.message);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(email, code, newPassword);
      toast.success(response.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex align-items-center justify-content-center position-relative" style={{
      minHeight: '100vh',
      backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 0
      }} />

      <Toaster position="top-center" />

      <Container style={{ position: 'relative', zIndex: 1 }}>
        <div className="d-flex justify-content-center">
          <Card className="border-0 shadow-lg" style={{
            maxWidth: '500px',
            width: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px'
          }}>
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: goldColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#000'
                  }}>
                    T
                  </div>
                </div>
                <h3 className="fw-bold text-white mb-2">Reset Password</h3>
                <p className="text-white opacity-75 small">Step {step} of 3</p>
              </div>

              {/* Step 1: Email */}
              {step === 1 && (
                <Form onSubmit={handleRequestCode}>
                  <div className="mb-4">
                    <p className="text-white text-center mb-4">
                      Enter your email address and we'll send you a verification code to reset your password.
                    </p>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white fw-bold">
                      <Mail size={16} className="me-2" />
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '12px'
                      }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-3 rounded-pill border-0 fw-bold mb-3"
                    style={{ background: goldColor, color: '#000' }}
                    disabled={loading}
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </Button>

                  <Button
                    variant="outline-light"
                    className="w-100 py-2 rounded-pill"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    <ArrowLeft size={16} className="me-2" />
                    Back to Login
                  </Button>
                </Form>
              )}

              {/* Step 2: Verify Code */}
              {step === 2 && (
                <Form onSubmit={handleVerifyCode}>
                  <div className="mb-4">
                    <p className="text-white text-center mb-4">
                      We've sent a 6-digit verification code to <strong>{email}</strong>
                    </p>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white fw-bold">
                      <Key size={16} className="me-2" />
                      Verification Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={loading}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '12px',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        letterSpacing: '0.5rem'
                      }}
                    />
                    <Form.Text className="text-white opacity-75 small">
                      Code expires in 10 minutes
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-3 rounded-pill border-0 fw-bold mb-3"
                    style={{ background: goldColor, color: '#000' }}
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-light"
                      className="flex-fill py-2 rounded-pill"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      <ArrowLeft size={16} className="me-2" />
                      Back
                    </Button>
                    <Button
                      variant="outline-light"
                      className="flex-fill py-2 rounded-pill"
                      onClick={handleRequestCode}
                      disabled={loading}
                    >
                      Resend Code
                    </Button>
                  </div>
                </Form>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <Form onSubmit={handleResetPassword}>
                  <div className="mb-4">
                    <p className="text-white text-center mb-4">
                      Create a new password for your account
                    </p>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="text-white fw-bold">
                      <Lock size={16} className="me-2" />
                      New Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '12px'
                      }}
                    />
                    <Form.Text className="text-white opacity-75 small">
                      Minimum 6 characters
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-white fw-bold">
                      <Lock size={16} className="me-2" />
                      Confirm Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '12px'
                      }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-3 rounded-pill border-0 fw-bold mb-3"
                    style={{ background: goldColor, color: '#000' }}
                    disabled={loading}
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>

                  <Button
                    variant="outline-light"
                    className="w-100 py-2 rounded-pill"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    <ArrowLeft size={16} className="me-2" />
                    Back
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}

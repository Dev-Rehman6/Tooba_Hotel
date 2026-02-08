import User from '../models/User.js';
import pkg from 'nodemailer';
const { createTransport } = pkg;

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map();

// Create email transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

// Generate 6-digit verification code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - send verification code
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store code with expiration
    verificationCodes.set(email, {
      code,
      expiresAt,
      attempts: 0
    });

    console.log(`Password reset code for ${email}: ${code}`);

    // Send email with code
    try {
      const emailTransporter = getTransporter();
      if (emailTransporter) {
        const mailOptions = {
          from: `"Tooba Hotels" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Password Reset Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #d4af37;">Password Reset Request</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>You requested to reset your password. Use the verification code below:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; border-left: 4px solid #d4af37; margin: 20px 0;">
                <h1 style="color: #d4af37; font-size: 36px; margin: 0; letter-spacing: 5px;">${code}</h1>
              </div>
              <p><strong>This code will expire in 15 minutes.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                Tooba Hotels - Luxury Accommodation<br>
                📧 Contact: support@toobahotels.com<br>
                📞 Phone: +92 318 595 6620
              </p>
            </div>
          `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
      } else {
        console.log('Email not configured - code:', code);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue even if email fails - code is logged
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      // In development, include code in response (remove in production)
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// Verify code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code'
      });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${5 - storedData.attempts} attempts remaining.`
      });
    }

    // Code is valid - mark as verified
    storedData.verified = true;

    res.json({
      success: true,
      message: 'Verification code confirmed. You can now reset your password.'
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, code, and new password'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your code first'
      });
    }

    // Check expiration
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please start over.'
      });
    }

    // Verify code one more time
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Clear verification code
    verificationCodes.delete(email);

    console.log(`Password reset successful for: ${email}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

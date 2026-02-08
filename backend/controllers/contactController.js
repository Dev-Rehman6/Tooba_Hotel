import Contact from '../models/Contact.js';
import pkg from 'nodemailer';
const { createTransport } = pkg;

// Create email transporter (lazy initialization)
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

// Submit contact form (public)
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Create contact in database
    const contact = await Contact.create({
      name,
      email,
      phone,
      message
    });

    console.log('Contact created:', contact._id);

    // Try to send confirmation email (optional - don't fail if email not configured)
    try {
      const emailTransporter = getTransporter();
      if (emailTransporter) {
        const mailOptions = {
          from: `"Tooba Hotels" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Thank you for contacting Tooba Hotels',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #d4af37;">Thank you for reaching out!</h2>
              <p>Dear <strong>${name}</strong>,</p>
              <p>We have received your message and will get back to you shortly.</p>
              <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #d4af37; margin: 20px 0;">
                <strong>Your message:</strong><br>
                ${message}
              </div>
              <p>Best regards,</p>
              <p><strong>Tooba Hotels Team</strong></p>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                📧 Contact us: support@toobahotels.com<br>
                📞 Phone: +92 318 595 6620
              </p>
            </div>
          `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', email);
      } else {
        console.log('Email not configured - skipping confirmation email');
      }
    } catch (emailError) {
      console.error('Email sending failed (non-critical):', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will contact you soon.',
      contact: {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message. Please try again.'
    });
  }
};

// Get all contact messages (admin only)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// Reply to contact message (admin only)
export const replyToContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Update contact with reply
    contact.adminReply = reply;
    contact.status = 'REPLIED';
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    await contact.save();

    // Send reply email to user
    const emailTransporter = getTransporter();
    if (emailTransporter) {
      const mailOptions = {
        from: `"Tooba Hotels" <${process.env.EMAIL_USER}>`,
        to: contact.email,
        subject: 'Reply from Tooba Hotels',
        html: `
          <h2>Reply to your message</h2>
          <p>Dear ${contact.name},</p>
          <p>Thank you for contacting us. Here is our response:</p>
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #d4af37; margin: 20px 0;">
            ${reply}
          </div>
          <p><strong>Your original message:</strong></p>
          <p style="color: #666;">${contact.message}</p>
          <br>
          <p>Best regards,</p>
          <p>Tooba Hotels Team</p>
        `
      };

      await emailTransporter.sendMail(mailOptions);
    }

    res.json({
      success: true,
      message: 'Reply sent successfully!',
      contact
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};

// Update contact status (admin only)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// Delete contact message (admin only)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

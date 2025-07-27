const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRandomToken } = require('../utils/generateToken'); // MODIFIED LINE
const sendEmail = require('../utils/sendEmail'); // NEW LINE

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, tshirtSize } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate email verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = Date.now() + 3600000; // 1 hour from now

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      tshirtSize,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Generate login token (optional, you might only want to send verification email)
    //const loginToken = generateToken(user._id);

    // --- EMAIL SENDING LOGIC ---
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`; // This assumes your frontend will handle the verification route.

    try {
        await sendEmail({
            email: user.email,
            subject: 'Verify Your Email for Shape of You',
            message: `
                <h1>Welcome to Shape of You!</h1>
                <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        });
        // ONLY send success response AFTER email is successfully sent
        res.status(201).json({
          success: true,
          message: 'User registered successfully. Please check your email for a verification link.',
          data: {
            user: {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              role: user.role,
              isEmailVerified: user.isEmailVerified
            },
            //token: loginToken
          }
        });
    } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // If email sending fails, send an appropriate error response
        // Do NOT proceed to send the 201 success response
        return res.status(500).json({
            success: false,
            message: 'User registered but failed to send verification email. Please try again later.'
        });
    }
    // --- END EMAIL SENDING LOGIC ---

  } catch (error) { // This catch handles errors before email sending, like validation or user existence check
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address to log in.'
      });
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Send a generic success response even if user not found to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // 2. Generate a unique reset token
    const resetToken = generateRandomToken(); // Use the existing random token generator
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

    await user.save({ validateBeforeSave: false }); // Bypass schema validation for this save

    // 3. Create reset URL (Frontend URL)
    // This link will point to your frontend's reset password page
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 4. Send email with reset link
    const message = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Please make a PUT request to: <a href="${resetURL}">${resetURL}</a></p>
      <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token for Shape of You',
        message: message
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (emailError) {
      console.error('Forgot password email sending error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false }); // Clear token if email fails
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request.'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body; // New password from the request body

    // 1. Find user by reset token and check expiry
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    // 2. Validate new password (reusing express-validator logic, or manually)
    const errors = validationResult(req); // Assuming you'll add validation rules in routes/auth.js
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    // Manual basic check if no route validation is used for password:
    if (!password || password.length < 6 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and contain one uppercase, one lowercase, and one number.'
      });
    }


    // 3. Set new password and clear token fields
    user.password = password; // Mongoose pre-save hook will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.lastLogin = new Date(); // Update last login if desired

    await user.save(); // This will trigger the pre-save password hashing

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset.'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        preferences
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

// @desc    Verify user email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // --- START CRITICAL MISSING LINE ---
    // Generate a new login token for the user
    const loginToken = generateToken(user._id); // <--- THIS LINE IS ABSOLUTELY ESSENTIAL
    // --- END CRITICAL MISSING LINE ---

   // Return success message, user data, and the new login token
   res.status(200).json({
    success: true,
    message: 'Email successfully verified! You are now logged in.',
    data: {
      user: { // Include essential user data
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin // Add lastLogin if desired
      },
      token: loginToken // The new login token
    }
  });
  // --- END NEW/MODIFIED CODE HERE ---

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getAllUsers
};
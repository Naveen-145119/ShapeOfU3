import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast'; // Assuming react-hot-toast
import { authAPI } from '../lib/api'; // Import authAPI
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Validation schema for new password and confirm password
const schema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // Requires at least one lowercase, one uppercase, one digit
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true); // State to check if token is valid
  const [message, setMessage] = useState(''); // To display message if token is invalid

  const navigate = useNavigate();
  const { token } = useParams(); // Get the token from the URL parameters (e.g., /reset-password/YOUR_TOKEN)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // You might want to do an initial check of the token with backend here
  // For simplicity, we'll rely on the resetPassword API call to validate the token.
  // If the page loads, we assume the token from the URL will be sent.
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setMessage('No reset token found in the URL. Please use the link from your email.');
      toast.error('Invalid or missing reset token.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Call the backend API to reset the password
      // Ensure your authAPI.resetPassword expects { token, password }
      const response = await authAPI.resetPassword(token, { password: data.password }); // Pass token as param, password in body

      if (response.data.success) {
        toast.success(response.data.message || 'Password has been reset successfully!');
        navigate('/login'); // Redirect to login page after successful reset
      } else {
        setIsValidToken(false); // If backend says failure, token might be invalid/expired
        setMessage(response.data.message || 'Failed to reset password. The link might be invalid or expired.');
        toast.error(response.data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setIsValidToken(false); // Assuming any error means the token is not valid for use
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred during password reset.';
      setMessage(errorMessage);
      toast.error(errorMessage);
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 glass-card p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-destructive">Invalid or Missing Token</h2>
          <p className="text-muted-foreground">{message}</p>
          <Button asChild className="mt-4">
            <Link to="/forgot-password">Request a new password reset link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl font-display font-bold text-gradient"
          >
            Reset Your Password
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-2 text-muted-foreground"
          >
            Enter your new password below.
          </motion.p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-card p-8 rounded-xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="pl-10 pr-10 h-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 h-12"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient h-12 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
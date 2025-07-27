import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast'; // Assuming react-hot-toast
import { authAPI } from '../lib/api'; // Import authAPI
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Validation schema for the email input
const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email address is required'),
});

const ForgotPasswordRequestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false); // New state to show success message

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setEmailSent(false); // Reset in case of re-submission
    try {
      // Call the backend API to request password reset
      const response = await authAPI.forgotPassword(data); // Assuming authAPI.forgotPassword is available

      if (response.data.success) {
        toast.success(response.data.message);
        setEmailSent(true); // Set flag to show success message
      } else {
        toast.error(response.data.message || 'Failed to send password reset link. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password request error:', error);
      toast.error(error.response?.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Forgot Password?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-2 text-muted-foreground"
          >
            Enter your email to receive a password reset link.
          </motion.p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-card p-8 rounded-xl"
        >
          {emailSent ? (
            <div className="text-center text-success">
              <p className="text-lg font-medium">Password reset link sent!</p>
              <p className="mt-2 text-muted-foreground">
                Please check your inbox (and spam folder) for an email with instructions to reset your password.
              </p>
              <Button asChild className="mt-4">
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-12"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
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
                    Sending link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordRequestPage;
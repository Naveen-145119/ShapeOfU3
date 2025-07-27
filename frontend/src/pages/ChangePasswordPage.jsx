import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { authAPI } from '../lib/api'; // Ensure authAPI is imported
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'; // Import Card components

// Validation schema for password change form
const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'New password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const ChangePasswordPage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset, // Use reset to clear the form after submission
    formState: { errors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.data.success) {
        toast.success(result.data.message || 'Password changed successfully!');
        reset(); // Clear form fields on success
        // Optionally, navigate back to profile or home page
        // navigate('/profile');
      } else {
        toast.error(result.data.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.response?.data?.message || 'An unexpected error occurred during password change.');
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
        <Card className="glass-card p-8 rounded-xl shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gradient">Change Password</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Update your account password securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Password Field */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    className="pl-10 pr-10 h-12"
                    {...register('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Create a new password"
                    className="pl-10 pr-10 h-12"
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    className="pl-10 pr-10 h-12"
                    {...register('confirmNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmNewPassword && (
                  <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
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
                    Changing password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>

            {/* Back to Profile Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    <Link
                        to="/profile"
                        className="text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                        Back to Profile
                    </Link>
                </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;
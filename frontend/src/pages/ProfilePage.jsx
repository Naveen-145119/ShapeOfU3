import React, { useState } from 'react'; // Ensure useState is imported
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CalendarDays, Eye, EyeOff, Lock, Loader2 } from 'lucide-react'; // Add Eye, EyeOff, Lock, Loader2
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button'; // Ensure Button is imported
import { Input } from '../components/ui/input'; // Import Input
import { Label } from '../components/ui/label'; // Import Label
import { format } from 'date-fns';

// --- START NEW IMPORTS & SCHEMA FOR PASSWORD CHANGE ---
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast'; // Ensure toast is imported
import { authAPI } from '../lib/api'; // Ensure authAPI is imported for changePassword API call

const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'New password must be at least 6 characters')
    .matches(
      /^(?=.[a-z])(?=.[A-Z])(?=.*\d)/,
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});
// --- END NEW IMPORTS & SCHEMA ---

const ProfilePage = () => {
  const { user, loading, isAuthenticated, logout } = useAuth(); // Ensure logout is destructured from useAuth if needed for logout button
  const [isLoadingPasswordChange, setIsLoadingPasswordChange] = useState(false); // State for password change form loading
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // --- NEW: useForm hook for password change form ---
  const {
    register: registerPasswordChange, // Rename to avoid conflict with ProfileForm's register if you add one later
    handleSubmit: handlePasswordChangeSubmit,
    reset: resetPasswordChangeForm,
    formState: { errors: passwordChangeErrors },
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });
  // --- END NEW ---

  // --- NEW: onSubmit function for password change ---
  const onSubmitPasswordChange = async (data) => {
    setIsLoadingPasswordChange(true);
    try {
      const result = await authAPI.changePassword({ // Call your backend API
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.data.success) {
        toast.success(result.data.message || 'Password changed successfully!');
        resetPasswordChangeForm(); // Clear form fields on success
      } else {
        toast.error(result.data.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.response?.data?.message || 'An unexpected error occurred during password change.');
    } finally {
      setIsLoadingPasswordChange(false);
    }
  };
  // --- END NEW: onSubmit for password change ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You must be logged in to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please log in to your account.</p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl w-full space-y-8"
      >
        {/* Existing Profile Information Card */}
        <Card className="glass-card p-6 rounded-xl shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-gradient flex items-center justify-center space-x-2">
              <User className="h-8 w-8" />
              {/* Display Full Name */}
              <span>{user.firstName} {user.lastName}'s Profile</span>
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Your personal account information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">Email:</p>
              <p className="text-foreground">{user.email}</p>
              {user.isEmailVerified && (
                  <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-600">Verified</Badge>
              )}
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3 text-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">Phone:</p>
                <p className="text-foreground">{user.phone}</p>
              </div>
            )}


            {user.lastLogin && (
                <div className="flex items-center space-x-3 text-lg">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">Last Login:</p>
                    <p className="text-foreground">{format(new Date(user.lastLogin), 'PPP p')}</p>
                </div>
            )}

            {user.createdAt && (
                <div className="flex items-center space-x-3 text-lg">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">Joined On:</p>
                    <p className="text-foreground">{format(new Date(user.createdAt), 'PPP')}</p>
                </div>
            )}

            <div className="pt-4 border-t border-border mt-6">
                <Link to="/change-password-page">
                <Button className="w-full btn-gradient">Change Password</Button>
                </Link>
            </div>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
};

export default ProfilePage;
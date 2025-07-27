import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const hasFetched = useRef(false); // NEW: Ref to track if fetch has already happened

  useEffect(() => {
    const token = searchParams.get('token');

    // Prevent multiple fetches, especially in Strict Mode
    // Only fetch if a token is present, we are still in 'verifying' state, and we haven't fetched yet.
    if (token && verificationStatus === 'verifying' && !hasFetched.current) { // MODIFIED CONDITION
      hasFetched.current = true; // Set flag to true to prevent future fetches

      const verifyEmail = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);

          if (response.data.success) {
            setVerificationStatus('success');
            setMessage(response.data.message || 'Your email has been successfully verified!');
            toast.success(response.data.message || 'Email verified successfully!');

            const { user, token: loginToken } = response.data.data;
            setAuthData(user, loginToken);

           // --- START NEW/MODIFIED CODE HERE ---
            // Add a small delay before navigation to ensure state propagates
            setTimeout(() => {
            navigate('/');
            }, 100); // 100ms delay, adjust if needed
            // --- END NEW/MODIFIED CODE HERE ---
          } else {
            // If backend responds with success: false (e.g., token already used/invalid from backend logic)
            setVerificationStatus('error');
            setMessage(response.data.message || 'Email verification failed. Please try again or register again.');
            toast.error(response.data.message || 'Email verification failed.');
          }
        } catch (error) {
          // This catch block handles network errors or non-2xx responses (like 400 or 500)
          setVerificationStatus('error');
          const errorMessage = error.response?.data?.message || 'An unexpected error occurred during verification.';
          setMessage(errorMessage);
          toast.error(errorMessage);
          console.error('Email verification error:', error);
        }
      };

      verifyEmail();
    } else if (!token && verificationStatus === 'verifying') { // Handles case where no token is in URL on first load
      setVerificationStatus('error');
      setMessage('No verification token found in the URL. The link might be broken or incomplete.');
      toast.error('No verification token found.');
    }

  }, [searchParams, navigate, setAuthData, verificationStatus]); // Dependencies

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {verificationStatus === 'verifying' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </>
        )}
        {verificationStatus === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
            <p className="mb-6">{message}</p>
            {/* Button to navigate to the login page after successful verification */}
            <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
          </>
        )}
        {verificationStatus === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <p className="mb-6">{message}</p>
            {/* Button to suggest re-registering if verification fails */}
            <Button onClick={() => window.location.href = '/register'}>Try Registering Again</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
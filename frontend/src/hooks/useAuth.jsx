import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // --- START MODIFICATION HERE ---
  // Derive isAuthenticated directly from the user state
  // This ensures isAuthenticated is always true if a user object exists, and false otherwise.
  const isAuthenticated = user !== null; // REMOVE useState and derive it
  // --- END MODIFICATION HERE ---
  const authCheckPerformed = useRef(false); // NEW: Ref to track if initial auth check has been performed

  useEffect(() => {
    if (!authCheckPerformed.current) {
      authCheckPerformed.current = true; // Set flag to true to prevent future runs
      checkAuth();
    }
  }, []);

  // Inside useAuth.jsx, find the 'checkAuth' function:
const checkAuth = async () => {
  console.log('useAuth: checkAuth initiated.');
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('useAuth: No token found in localStorage for checkAuth.');
      //setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    console.log('useAuth: Token found, attempting to getProfile via checkAuth...');
    const response = await authAPI.getProfile(); // This hits /api/auth/me

    setUser(response.data.data.user);
    //setIsAuthenticated(true);
    console.log('useAuth: isAuthenticated set to TRUE. Value after setter:', true); // NEW LOG
    console.log('useAuth: checkAuth: getProfile successful, isAuthenticated set to TRUE. User:', response.data.data.user);

  } catch (error) {
    // --- START MODIFICATION HERE ---
    console.error('useAuth: checkAuth failed (getProfile error):', error);

    // Only clear token/user if the error is specifically due to authentication failure (e.g., 401)
    // This prevents temporary network glitches from logging out the user.
    if (error.response && error.response.status === 401) {
      console.log('useAuth: 401 error received, clearing session.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      //setIsAuthenticated(false);
      setUser(null);
      toast.error('Your session has expired or is invalid. Please log in again.');
    } else {
      // For other types of errors (network issues, 5xx from server, etc.),
      // we might just log it and not forcefully logout/clear session.
      // This ensures a stable user experience even if getProfile has a hiccup.
      console.log('useAuth: Non-401 error during checkAuth. Keeping current session state.');
      // If isAuthenticated was true before this error, we might want to keep it.
      // However, if the page just loaded, and token was there, but getProfile failed for non-401,
      // then the user might actually not be truly authenticated on the backend.
      // For now, let's just avoid clearing localStorage on non-401s.
    }
    // --- END MODIFICATION HERE ---
  } finally {
    setLoading(false);
    //console.log('useAuth: checkAuth completed. Final isAuthenticated:', isAuthenticated);
  }
};

  // --- MODIFIED LOGIN FUNCTION ---
  const login = async (credentials) => {
    // --- NEW DEBUG LOG ---
    console.log('useAuth: Login function initiated.');
    // --- END NEW DEBUG LOG ---
    try {
      const response = await authAPI.login(credentials);
      const { user: loggedInUser, token: loggedInToken } = response.data.data; // Rename to avoid conflict

      // --- NEW DEBUG LOG ---
      console.log('useAuth: Login API call successful. Token received:', loggedInToken ? 'YES' : 'NO');
      // --- END NEW DEBUG LOG ---

      // Use the setAuthData function to update state and localStorage
      setAuthData(loggedInUser, loggedInToken); 

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };
  // --- END MODIFIED LOGIN FUNCTION ---

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      //const { user, token } = response.data.data;
      
      //localStorage.setItem('token', token);
      //localStorage.setItem('user', JSON.stringify(user));
      
      //setUser(user);
      //setIsAuthenticated(true);
      
      //toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };
  // --- START NEW CODE HERE ---
// New function to directly set authentication data (user and token)
  const setAuthData = (user, token) => {
    // --- NEW DEBUG LOG ---
    console.log('useAuth: setAuthData called with token:', token ? 'YES' : 'NO');
    // --- END NEW DEBUG LOG ---
    localStorage.setItem('token', token);
    // --- NEW DEBUG LOG ---
    console.log('useAuth: localStorage.setItem(token) executed. Token in localStorage now:', localStorage.getItem('token') ? 'YES' : 'NO');
    // --- END NEW DEBUG LOG ---
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  //setIsAuthenticated(true);
};
// --- END NEW CODE HERE --

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    //setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.data.user;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuth,
    setAuthData, // ADD THIS NEW FUNCTION
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
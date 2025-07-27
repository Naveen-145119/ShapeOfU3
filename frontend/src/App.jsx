import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import './App.css';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordRequestPage from './pages/ForgotPasswordRequestPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BookingPage from './pages/BookingPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProfilePage from './pages/ProfilePage';
import MyBookingsPage from './pages/MyBookingsPage';
import PrivateRoute from './components/PrivateRoute'; 
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import PaymentStatusPage from './pages/PaymentStatusPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Login = () => <LoginForm />;
const Register = () => <RegisterForm />;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            {/* ⭐ CORRECTED: Navbar is now OUTSIDE <Routes> but inside the Router's context */}
            <Navbar /> 
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordRequestPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* ⭐ NEW: Payment Callback Routes */}
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
                <Route path="/payment-failure" element={<PaymentFailurePage />} />
                <Route path="/payment-status" element={<PaymentStatusPage />} />

                {/* Protected Routes */}
                <Route path="/booking" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
                <Route path="/change-password-page" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/my-bookings" element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
              </Routes>
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--primary)',
                    secondary: 'var(--primary-foreground)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--destructive)',
                    secondary: 'var(--primary-foreground)',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
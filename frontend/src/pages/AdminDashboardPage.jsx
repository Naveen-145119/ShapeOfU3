import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; 
import * as XLSX from 'xlsx';
import { adminAPI } from '../lib/api'; 
import { format } from 'date-fns'; 

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]); 
  const [filteredBookings, setFilteredBookings] = useState([]); // ⭐ ADDED: State for filtered bookings
  const [bookingSearchTerm, setBookingSearchTerm] = useState(''); // ⭐ ADDED: State for booking search term

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await adminAPI.getAllBookings(); 
        setBookings(response.data.data);
        setFilteredBookings(response.data.data); // Initialize filtered bookings with all bookings
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      }
    };

    fetchStats();
    fetchBookings(); 
  }, []);

  // ⭐ ADDED: useEffect for filtering bookings based on search term
  useEffect(() => {
    let result = bookings;
    if (bookingSearchTerm) {
      result = result.filter(booking => {
        const userFullName = booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : '';
        const userEmail = booking.user ? booking.user.email : '';
        const lowerCaseSearchTerm = bookingSearchTerm.toLowerCase();

        return (
          (booking.bookingReference && booking.bookingReference.toLowerCase().includes(lowerCaseSearchTerm)) ||
          userFullName.toLowerCase().includes(lowerCaseSearchTerm) ||
          userEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
          (booking.ticketType && booking.ticketType.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (booking.paymentStatus && booking.paymentStatus.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (booking.paymentId && booking.paymentId.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (booking.aadhar_number && booking.aadhar_number.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (booking.coupon_code && booking.coupon_code.toLowerCase().includes(lowerCaseSearchTerm))
        );
      });
    }
    setFilteredBookings(result);
  }, [bookingSearchTerm, bookings]); // Re-filter when search term or original bookings change


  const handleRefresh = () => {
    window.location.reload(); 
  };

  const handleExportExcel = () => {
    // Export filtered bookings data
    const worksheet = XLSX.utils.json_to_sheet(filteredBookings.map(booking => ({ 
      'Booking ID': booking.bookingReference || booking._id,
      'First Name': booking.user ? booking.user.firstName : 'N/A',
      'Last Name': booking.user ? booking.user.lastName : 'N/A',
      'Email': booking.user ? booking.user.email : 'N/A',
      'Phone': booking.user ? booking.user.phone : 'N/A',
      'T-shirt Size': booking.tshirtSize || 'N/A',
      'Category': booking.ticketType,
      'Aadhar Number': booking.aadhar_number || 'N/A',
      'Coupon Code': booking.coupon_code || 'N/A',
      'Total Amount': booking.totalAmount,
      'Payment Status': booking.paymentStatus,
      'Payment Method': booking.paymentMethod,
      'Payment ID': booking.paymentId,
      'Status': booking.status,
      'Booked Date': format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm'),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings'); 
    XLSX.writeFile(workbook, 'bookings.xlsx'); 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} />;
      case 'bookings':
        return <BookingsTab bookings={filteredBookings} setBookingSearchTerm={setBookingSearchTerm} />; // ⭐ Pass filteredBookings and setter
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
            <Button onClick={handleExportExcel}>Export Excel</Button>
          </div>
        </header>

        <div className="flex border-b border-border mb-8">
          <button onClick={() => setActiveTab('overview')} className={`py-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-primary' : ''}`}>Overview</button>
          <button onClick={() => setActiveTab('bookings')} className={`py-2 px-4 ${activeTab === 'bookings' ? 'border-b-2 border-primary' : ''}`}>Bookings</button>
          <button onClick={() => setActiveTab('analytics')} className={`py-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-primary' : ''}`}>Analytics</button>
        </div>

        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Total Registrations" value={stats ? stats.totalUsers : 'Loading...'} change="+12%" />
    <StatCard title="Total Revenue" value={stats ? `₹${stats.totalRevenue}` : 'Loading...'} change="+8%" />
    <StatCard title="Tickets Sold Today" value={stats ? stats.ticketsSoldToday : 'Loading...'} change="+5" />
    <StatCard title="Mobile Bookings" value={stats ? stats.mobileBookingsPercentage : 'Loading...'} change="+3%" />
    <div className="md:col-span-2 lg:col-span-4">
      <ChartCard title="Registration Trend">
        <RegistrationChart data={stats ? stats.registrationTrend : []} />
      </ChartCard>
    </div>
    <div className="md:col-span-2 lg:col-span-4">
      <ChartCard title="Category Distribution">
        <CategoryChart data={stats ? stats.categoryDistribution : []} />
      </ChartCard>
    </div>
  </div>
);

// ⭐ UPDATED BookingsTab to include search bar
const BookingsTab = ({ bookings, setBookingSearchTerm }) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold">All Bookings</h2>
      <Input
        placeholder="Search bookings by ID, name, email, etc."
        className="w-64"
        onChange={(e) => setBookingSearchTerm(e.target.value)} // ⭐ Set search term on change
      />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card">
        <thead>
          <tr>
            <th className="py-3 px-6 text-left">Booking ID</th>
            <th className="py-3 px-6 text-left">First Name</th> 
            <th className="py-3 px-6 text-left">Last Name</th> 
            <th className="py-3 px-6 text-left">Email</th>
            <th className="py-3 px-6 text-left">Phone</th> 
            <th className="py-3 px-6 text-left">T-shirt Size</th> 
            <th className="py-3 px-6 text-left">Category</th>
            <th className="py-3 px-6 text-left">Aadhar No.</th> 
            <th className="py-3 px-6 text-left">Coupon Code</th> 
            <th className="py-3 px-6 text-left">Amount</th> 
            <th className="py-3 px-6 text-left">Payment Status</th>
            <th className="py-3 px-6 text-left">Payment Method</th>
            <th className="py-3 px-6 text-left">Payment ID</th> 
            <th className="py-3 px-6 text-left">Status</th>
            <th className="py-3 px-6 text-left">Booked Date</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="15" className="py-3 px-6 text-center">No bookings found.</td> 
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking._id} className="border-b border-border">
                <td className="py-3 px-6 text-xs">{booking.bookingReference || booking._id}</td>
                <td className="py-3 px-6">{booking.user ? booking.user.firstName : 'N/A'}</td> 
                <td className="py-3 px-6">{booking.user ? booking.user.lastName : 'N/A'}</td> 
                <td className="py-3 px-6">{booking.user ? booking.user.email : 'N/A'}</td>
                <td className="py-3 px-6">{booking.user ? booking.user.phone : 'N/A'}</td> 
                <td className="py-3 px-6">{booking.tshirtSize || 'N/A'}</td> 
                <td className="py-3 px-6">{booking.ticketType}</td>
                <td className="py-3 px-6">{booking.aadhar_number || 'N/A'}</td> 
                <td className="py-3 px-6">{booking.coupon_code || 'N/A'}</td> 
                <td className="py-3 px-6">₹{booking.totalAmount}</td> 
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    booking.paymentStatus === 'completed' ? 'bg-green-500/20 text-green-500' :
                    booking.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  } capitalize`}>
                    {booking.paymentStatus}
                  </span>
                </td>
                <td className="py-3 px-6 capitalize">{booking.paymentMethod || 'N/A'}</td>
                <td className="py-3 px-6 text-xs">{booking.paymentId || 'N/A'}</td> 
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    'bg-blue-500/20 text-blue-500'
                  } capitalize`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-3 px-6">{format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const AnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState('all-time');
  const [revenueData, setRevenueData] = useState([]);
  const [couponData, setCouponData] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const revenueResponse = await adminAPI.getRevenueAnalytics({ timeRange });
        setRevenueData(revenueResponse.data.data);

        const couponResponse = await adminAPI.getCouponAnalytics({ timeRange });
        setCouponData(couponResponse.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <Select onValueChange={setTimeRange} defaultValue={timeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="last-30-days">Last 30 Days</SelectItem>
            <SelectItem value="last-7-days">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Over Time">
          <RevenueChart data={revenueData} />
        </ChartCard>
        <ChartCard title="Coupon Usage Analytics">
          <CouponChart data={couponData} />
        </ChartCard>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change }) => (
  <div className="bg-card p-6 rounded-lg shadow-lg">
    <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
    <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-card p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

const RegistrationChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
    </LineChart>
  </ResponsiveContainer>
);

const categoryData = [
  { name: 'General', value: 400 },
  { name: 'PC Partner', value: 300 },
  { name: 'Associate', value: 300 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CategoryChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];

const RevenueChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="revenue" fill="#8884d8" />
    </BarChart>
  </ResponsiveContainer>
);

const couponData = [
  { name: 'COLLEGENAME149', value: 45 },
  { name: 'PC100', value: 32 },
  { name: 'ASSOCIATE100', value: 18 },
  { name: 'No Coupon', value: 152 },
];

const CouponChart = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

export default AdminDashboardPage;
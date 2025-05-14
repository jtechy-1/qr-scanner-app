import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import ManageEmployees from './pages/ManageEmployees';
import ManageLocations from './pages/ManageLocations';
import DailyActivityReport from './pages/DailyActivityReport';
import ViewReports from './pages/ViewReports';
import ReportDetails from './pages/ReportDetails';
import EditEmployee from './pages/EditEmployee';
import AddEmployee from './pages/AddEmployee';
import ReviewReport from './pages/ReviewReport';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (!error) {
          setRole(data.role);
        } else {
          console.error('Failed to fetch role:', error.message);
        }
      }

      setIsLoading(false);
    };

    fetchUserAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (!session) setRole(null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) return <div className="text-center mt-5">🔄 Loading...</div>;

  return (
    <Router>
      <Header user={user} role={role} />
      <main className="container mt-4" style={{ maxWidth: '960px' }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          {user && role && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              {role === 'admin' && (
                <>
                  <Route path="/manage-employees" element={<ManageEmployees />} />
                  <Route path="/add-employee" element={<AddEmployee />} />
                  <Route path="/manage-locations" element={<ManageLocations />} />
                  <Route path="/edit-employee/:id" element={<EditEmployee />} />
                </>
              )}
              <Route path="/scanner" element={<QRScanner />} />
              <Route path="/daily-report" element={<DailyActivityReport />} />
              <Route path="/view-reports" element={<ViewReports />} />
              <Route path="/report/:id" element={<ReportDetails />} />
              <Route path="/report-details" element={<ReportDetails />} />
              <Route path="/review-report" element={<ReviewReport />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
          {!user && <Route path="*" element={<Navigate to="/login" />} />}
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </Router>
  );
};

export default App;

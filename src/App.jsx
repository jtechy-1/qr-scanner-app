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

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user || null;
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('id', user.id)
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
      setUser(session?.user || null);
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
                  <Route path="/manage_employees" element={<ManageEmployees />} />
                  <Route path="/manage-locations" element={<ManageLocations />} />
                </>
              )}
              <Route path="/scanner" element={<QRScanner />} />
              <Route path="/daily-report" element={<DailyActivityReport />} />
              <Route path="/view-reports" element={<ViewReports />} />
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

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';
import Header from './Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import AssignEmployees from './pages/AssignEmployees';
import ManageLocations from './pages/ManageLocations';

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

  if (isLoading || (user && role === null)) return <div className="text-center mt-5">🔄 Loading...</div>;

  return (
    <Router>
      <Header user={user} role={role} userName={user?.email || 'User'} />
      <main className="container mt-4">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/dashboard' : '/scanner'} /> : <Login />} />
          <Route path="/dashboard" element={user && role === 'admin' ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/assign-employees" element={user && role === 'admin' ? <AssignEmployees /> : <Navigate to="/login" />} />
          <Route path="/manage-locations" element={user && role === 'admin' ? <ManageLocations /> : <Navigate to="/login" />} />
          <Route path="/scanner" element={user ? <QRScanner /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? (role === 'admin' ? '/dashboard' : '/scanner') : '/login'} />} />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </Router>
  );
};

export default App;

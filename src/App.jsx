import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import AssignEmployees from './pages/AssignEmployees';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

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
    };

    fetchUserAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setRole(session ? null : null); // reset role if signed out
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Header user={user} role={role} />
      <main className="container mt-4">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/dashboard' : '/scanner'} /> : <Login />} />
          <Route path="/dashboard" element={user && role === 'admin' ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/assign-employees" element={user && role === 'admin' ? <AssignEmployees /> : <Navigate to="/login" />} />
          <Route path="/scanner" element={user && role === 'user' ? <QRScanner /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? (role === 'admin' ? '/dashboard' : '/scanner') : '/login'} />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;

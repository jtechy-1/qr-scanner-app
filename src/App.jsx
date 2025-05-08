import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import AssignEmployees from './pages/AssignEmployees'; // ✅ new import

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);

      if (user) {
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error) setRole(data.role);
      }
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

// File: src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import QRScanner from './components/QRScanner';
import Login from './pages/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Router>
      <Header user={user} onLogout={handleLogout} />
      <main className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/scanner" /> : <Login />} />
          <Route path="/scanner" element={user ? <QRScanner /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/scanner" : "/login"} />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Header = ({ user, role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  return (
    <nav className="navbar navbar-dark bg-primary px-3 d-flex justify-content-between">
      <div>
        {user && location.pathname !== '/dashboard' && (
          <Link to="/dashboard" className="btn btn-outline-light">
            ← Back to Dashboard
          </Link>
        )}
      </div>
      {user && (
        <button className="btn btn-outline-light" onClick={handleLogout}>
          Logout
        </button>
      )}
    </nav>
  );
};

export default Header;
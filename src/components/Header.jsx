import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Header = ({ user, role }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <Link className="navbar-brand" to={role === 'admin' ? "/dashboard" : "/scanner"}>QR Scanner</Link>

      <button
        className="navbar-toggler"
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-controls="navbarNav"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
        <ul className="navbar-nav ms-auto">

          {user && role === 'admin' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/assign-employees">Assign Employees</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/manage-locations">Manage Locations</Link>
              </li>
            </>
          )}


          {user && role === 'user' && (
            <li className="nav-item">
              <Link className="nav-link" to="/scanner" onClick={() => setMenuOpen(false)}>Scanner</Link>
            </li>
          )}

          {user && (
            <li className="nav-item">
              <button className="btn btn-outline-light ms-lg-3 mt-2 mt-lg-0" onClick={handleLogout}>Logout</button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;

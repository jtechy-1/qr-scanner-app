import { Link } from 'react-router-dom';

const Sidebar = ({ onLogout }) => (
  <div className="bg-light border-end p-3 d-flex flex-column" style={{ width: '200px', height: '100vh' }}>
    <h5>Menu</h5>
    <ul className="nav flex-column flex-grow-1">
      <li className="nav-item">
        <Link className="nav-link" to="/dashboard">Dashboard</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/scanner">Scanner</Link>
      </li>
    </ul>
    <button className="btn btn-outline-danger mt-auto" onClick={onLogout}>
      Logout
    </button>
  </div>
);

export default Sidebar;

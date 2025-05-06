import { Link } from 'react-router-dom';

const Sidebar = () => (
  <div className="bg-light border-end p-3" style={{ width: '200px', height: '100vh' }}>
    <h5>Menu</h5>
    <ul className="nav flex-column">
      <li className="nav-item">
        <Link className="nav-link" to="/dashboard">Dashboard</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/scanner">Scanner</Link>
      </li>
    </ul>
  </div>
);

export default Sidebar;

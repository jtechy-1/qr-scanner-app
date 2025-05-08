import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaUsersCog, FaMapMarkedAlt, FaQrcode } from 'react-icons/fa';

const Dashboard = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (user) {
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!error) {
          setRole(data.role);
        } else {
          console.error('Error fetching role:', error.message);
        }
      }
    };

    fetchRole();
  }, []);

  const cards = [
    {
      role: ['admin', 'user'],
      icon: <FaQrcode size={40} className="mb-2" />,
      label: 'Scanner',
      link: '/scanner',
    },
    {
      role: ['admin'],
      icon: <FaUsersCog size={40} className="mb-2" />,
      label: 'Assign Employees',
      link: '/assign-employees',
    },
    {
      role: ['admin'],
      icon: <FaMapMarkedAlt size={40} className="mb-2" />,
      label: 'Manage Locations',
      link: '/manage-locations',
    },
  ];

  if (!role) return <div className="text-center mt-5">🔄 Loading dashboard...</div>;

  return (
    <div>
      <div className="text-end mb-3">
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
        >
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </button>
      </div>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
        {cards
          .filter(card => role && card.role.includes(role))
          .map((card, index) => (
            <div className="col" key={index}>
              <Link to={card.link} className="text-decoration-none">
                <div className="card text-center h-100 shadow-sm p-4">
                  {card.icon}
                  <h5 className="mt-2 text-dark">{card.label}</h5>
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;

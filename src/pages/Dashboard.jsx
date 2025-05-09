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
          .eq('id', user.id)
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
      icon: <FaQrcode size={32} className="mb-2" />, // slightly smaller icon
      label: 'Scanner',
      link: '/scanner',
    },
    {
      role: ['admin'],
      icon: <FaUsersCog size={32} className="mb-2" />,
      label: 'Assign Employees',
      link: '/assign-employees',
    },
    {
      role: ['admin'],
      icon: <FaMapMarkedAlt size={32} className="mb-2" />,
      label: 'Manage Locations',
      link: '/manage-locations',
    },
  ];

  if (!role) return <div className="text-center mt-5">🔄 Loading dashboard...</div>;

  const visibleCards = cards.filter(card => role && card.role.includes(role));
  const totalSlots = 12; // 4x3 grid
  const allCards = [...visibleCards];
  while (allCards.length < totalSlots) allCards.push(null);

  return (
    <div>
      
      <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2">
        {allCards.map((card, index) => (
          <div className="col" key={index}>
            {card ? (
              <Link to={card.link} className="text-decoration-none">
                <div className="card text-center h-100 shadow-sm p-2">
                  {card.icon}
                  <h6 className="mt-2 text-dark small">{card.label}</h6>
                </div>
              </Link>
            ) : (
              <div className="card h-100 p-4 border-0 bg-light"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserShield, FaQrcode, FaUsersCog, FaClipboardList, FaRegFileAlt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('employees').select('role').eq('id', user.id).single();
      if (data) setRole(data.role);
    };
    fetchRole();
  }, []);

  const cards = [
    {
      role: ['admin', 'user'],
      icon: <FaUsers size={32} className="mb-2" />,
      label: 'Employees',
      link: '/employees',
    },
    {
      role: ['admin'],
      icon: <FaUserShield size={32} className="mb-2" />,
      label: 'Assign Roles',
      link: '/assign-roles',
    },
    {
      role: ['admin', 'user'],
      icon: <FaQrcode size={32} className="mb-2" />,
      label: 'QR Scanner',
      link: '/scanner',
    },
    {
      role: ['admin'],
      icon: <FaUsersCog size={32} className="mb-2" />,
      label: 'Manage Employees',
      link: '/manage-employees',
    },
    {
      role: ['admin', 'user'],
      icon: <FaRegFileAlt size={32} className="mb-2" />,
      label: 'Daily Report',
      link: '/daily-report',
    },
    {
      role: ['admin', 'user'],
      icon: <FaClipboardList size={32} className="mb-2" />,
      label: 'View Reports',
      link: '/view-reports',
    }
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center text-primary mb-4">Dashboard</h2>
      <div className="row">
        {cards.filter(card => card.role.includes(role)).map((card, index) => (
          <div key={index} className="col-md-3 mb-4">
            <div className="card text-center shadow-sm" role="button" onClick={async () => {
                if (card.label === 'Daily Report') {
                  const { data: { user } } = await supabase.auth.getUser();
                  const { data } = await supabase
                    .from('reports')
                    .select('id')
                    .eq('employee_id', user.id)
                    .eq('status', 'Draft')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                  if (data?.id) {
                    const proceed = window.confirm('You have a draft report. Do you want to continue it?');
                    if (proceed) return navigate(`/report/${data.id}`);
                  }
                }
                navigate(card.link);
              }}>
              <div className="card-body">
                {card.icon}
                <h5 className="card-title">{card.label}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

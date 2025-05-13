import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const EditEmployee = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
      if (!error) setEmployee(data);
    };
    fetchEmployee();
  }, [id]);

  const handleSave = async () => {
    const { error } = await supabase.from('employees').update(employee).eq('id', id);
    if (!error) navigate('/manage-employees');
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h3>Edit Employee</h3>
      <div className="mb-3">
        <label>Name</label>
        <input className="form-control" value={employee.name} onChange={e => setEmployee({ ...employee, name: e.target.value })} />
      </div>
      <div className="mb-3">
        <label>Username</label>
        <input className="form-control" value={employee.username || ''} disabled />
      </div>
      <div className="mb-3">
        <label>Role</label>
        <select className="form-select" value={employee.role || ''} onChange={e => setEmployee({ ...employee, role: e.target.value })}>
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="employee">Employee</option>
          <option value="user">User</option>
        </select>
      </div>
      <div className="mb-3">
        <label>Status</label>
        <select className="form-select" value={employee.status} onChange={e => setEmployee({ ...employee, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
        <button className="btn btn-secondary" onClick={() => navigate('/manage-employees')}>Cancel</button>
      </div>
    </div>
  );
};

export default EditEmployee;
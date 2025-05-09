import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error) setEmployees(data);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Manage Employees</h3>
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email"
            onChange={(e) => setEmployees(prev => prev.filter(emp => (emp.full_name + emp.email).toLowerCase().includes(e.target.value.toLowerCase()))) }
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" onChange={(e) => setEmployees(prev => prev.filter(emp => emp.role === e.target.value || e.target.value === ''))}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" onChange={(e) => setEmployees(prev => prev.filter(emp => emp.status === e.target.value || e.target.value === ''))}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.role}</td>
                <td>{emp.status}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2">Edit</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageEmployees;

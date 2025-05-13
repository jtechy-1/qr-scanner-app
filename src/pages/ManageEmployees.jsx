import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error) {
        setEmployees(data);
        setFilteredEmployees(data);
      }
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = [...employees];
    if (search) {
      filtered = filtered.filter(emp => (emp.name + emp.username).toLowerCase().includes(search.toLowerCase()));
    }
    if (roleFilter) {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, employees]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this employee?');
    if (!confirm) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const activeCount = employees.filter(emp => emp.status === 'active').length;
  const inactiveCount = employees.filter(emp => emp.status === 'inactive').length;

  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Manage Employees</h3>
      <p className="mb-3">Active: {activeCount} | Inactive: {inactiveCount}</p>

      <div className="mb-3 text-end">
        <button className="btn btn-success" onClick={() => navigate('/add-employee')}>
          Add New Employee
        </button>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.username}</td>
                  <td>{emp.status}</td>
                  <td>
                    <button className="btn btn-sm btn-primary me-2" onClick={() => navigate(`/edit-employee/${emp.id}`)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center">
            <span>Page {currentPage} of {totalPages}</span>
            <div>
              <button className="btn btn-outline-secondary btn-sm me-2" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</button>
              <button className="btn btn-outline-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageEmployees;

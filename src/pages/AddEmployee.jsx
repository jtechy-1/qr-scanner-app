import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AddEmployee = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', status: 'active' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Sign up to Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true
    });

    if (authError) {
      alert(`Auth Error: ${authError.message}`);
      return;
    }

    const userId = authData.user.id;

    // 2. Add to employees table
    const { error: dbError } = await supabase.from('employees').insert([
      {
        id: userId,
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status
      }
    ]);

    if (dbError) {
      alert(`Database Error: ${dbError.message}`);
      return;
    }

    alert('User created successfully!');
    navigate('/manage-employees');
  };

  return (
    <div className="container mt-4">
      <h3>Add New Employee</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Name</label>
          <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input className="form-control" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label>Role</label>
          <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="employee">Employee</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mb-3">
          <label>Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit">Create</button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/manage-employees')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;

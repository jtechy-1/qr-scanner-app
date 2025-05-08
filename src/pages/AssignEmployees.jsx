import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AssignEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, full_name')
        .order('full_name');

      const { data: loc } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      setEmployees(emp || []);
      setLocations(loc || []);
    };

    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedLocation) {
      setMessage('⚠️ Please select both employee and location.');
      return;
    }

    const { error } = await supabase.from('employee_locations').upsert({
      employee_id: selectedEmployee,
      location_id: selectedLocation,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage('✅ Employee assigned successfully.');
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Assign Employee to Location</h3>
      <form onSubmit={handleAssign} className="card p-4">
        <div className="mb-3">
          <label className="form-label">Select Employee</label>
          <select className="form-select" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">-- Choose an employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Select Location</label>
          <select className="form-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
            <option value="">-- Choose a location --</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary">Assign</button>
        {message && <p className="mt-3">{message}</p>}
      </form>
    </div>
  );
};

export default AssignEmployees;

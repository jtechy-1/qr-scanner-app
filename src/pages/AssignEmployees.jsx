import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AssignEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const empRes = await supabase.from('employees').select('id, name');
      const locRes = await supabase.from('locations').select('id, name');
      const asnRes = await supabase.from('assignments').select('*');

      if (!empRes.error) setEmployees(empRes.data);
      if (!locRes.error) setLocations(locRes.data);
      if (!asnRes.error) setAssignments(asnRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAssign = async (employeeId, locationId) => {
    const { error } = await supabase.from('assignments').insert({ employee_id: employeeId, location_id: locationId });
    if (!error) {
      setAssignments(prev => [...prev, { employee_id: employeeId, location_id: locationId }]);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Assign Employees to Locations</h3>
      <div className="mb-3">
        <a href="/dashboard" className="btn btn-outline-secondary">← Back to Dashboard</a>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="row">
          {employees.map(emp => (
            <div key={emp.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{emp.name}</h5>
                  <select
                    className="form-select"
                    onChange={(e) => handleAssign(emp.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select Location
                    </option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignEmployee;

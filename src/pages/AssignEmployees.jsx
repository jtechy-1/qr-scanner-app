import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-toastify';

const AssignEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignedLocations, setAssignedLocations] = useState([]);
  const [unassignedLocations, setUnassignedLocations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: empData } = await supabase.from('employees').select('id, name').order('name');
      const { data: locData } = await supabase.from('locations').select('id, name').order('name');
      setEmployees(empData || []);
      setLocations(locData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const fetchAssignments = async () => {
      const { data: assigned } = await supabase
        .from('employee_locations')
        .select('location_id')
        .eq('employee_id', selectedEmployeeId);

      const assignedIds = assigned.map(a => a.location_id);
      const assignedList = locations.filter(loc => assignedIds.includes(loc.id));
      const unassignedList = locations.filter(loc => !assignedIds.includes(loc.id));
      setAssignedLocations(assignedList);
      setUnassignedLocations(unassignedList);
    };
    fetchAssignments();
  }, [selectedEmployeeId, locations]);

  const moveToAssigned = (id) => {
    const loc = unassignedLocations.find(l => l.id === id);
    if (loc) {
      setUnassignedLocations(prev => prev.filter(l => l.id !== id));
      setAssignedLocations(prev => [...prev, loc]);
    }
  };

  const moveToUnassigned = (id) => {
    const loc = assignedLocations.find(l => l.id === id);
    if (loc) {
      setAssignedLocations(prev => prev.filter(l => l.id !== id));
      setUnassignedLocations(prev => [...prev, loc]);
    }
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) return;
    await supabase.from('employee_locations').delete().eq('employee_id', selectedEmployeeId);
    if (assignedLocations.length > 0) {
      const rows = assignedLocations.map(loc => ({
        employee_id: selectedEmployeeId,
        location_id: loc.id,
      }));
      await supabase.from('employee_locations').insert(rows);
    }
    toast.success('✅ Assignments saved');
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Assign Locations to Employee</h3>

      <div className="mb-3">
        <label>Select Employee</label>
        <select className="form-select" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
          <option value="">-- Select an Employee --</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {selectedEmployeeId && (
        <div className="row mt-4">
          <div className="col-md-5">
            <h5>Unassigned Locations</h5>
            <ul className="list-group">
              {unassignedLocations.map(loc => (
                <li key={loc.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {loc.name}
                  <button className="btn btn-sm btn-outline-primary" onClick={() => moveToAssigned(loc.id)}>→</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-2 d-flex align-items-center justify-content-center">
            <div>
              <button className="btn btn-success mt-2" onClick={handleSave}>Save</button>
            </div>
          </div>

          <div className="col-md-5">
            <h5>Assigned Locations</h5>
            <ul className="list-group">
              {assignedLocations.map(loc => (
                <li key={loc.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {loc.name}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => moveToUnassigned(loc.id)}>←</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignEmployees;

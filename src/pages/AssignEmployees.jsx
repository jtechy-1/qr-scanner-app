import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AssignEmployees = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: locs } = await supabase.from('locations').select('id, name');
      const { data: emps } = await supabase.from('employees').select('id, name');
      setLocations(locs || []);
      setAllEmployees(emps || []);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;
    const fetchAssignments = async () => {
      const { data: assigned } = await supabase
        .from('employee_locations')
        .select('employee_id')
        .eq('location_id', selectedLocationId);

      const assignedIds = assigned.map(a => a.employee_id);
      const assignedList = allEmployees.filter(emp => assignedIds.includes(emp.id));
      const unassignedList = allEmployees.filter(emp => !assignedIds.includes(emp.id));
      setAssignedEmployees(assignedList);
      setUnassignedEmployees(unassignedList);
    };
    fetchAssignments();
  }, [selectedLocationId, allEmployees]);

  const moveToAssigned = (id) => {
    const emp = unassignedEmployees.find(e => e.id === id);
    if (emp) {
      setUnassignedEmployees(prev => prev.filter(e => e.id !== id));
      setAssignedEmployees(prev => [...prev, emp]);
    }
  };

  const moveToUnassigned = (id) => {
    const emp = assignedEmployees.find(e => e.id === id);
    if (emp) {
      setAssignedEmployees(prev => prev.filter(e => e.id !== id));
      setUnassignedEmployees(prev => [...prev, emp]);
    }
  };

  const handleSave = async () => {
    if (!selectedLocationId) return;
    await supabase.from('employee_locations').delete().eq('location_id', selectedLocationId);
    if (assignedEmployees.length > 0) {
      const rows = assignedEmployees.map(emp => ({
        employee_id: emp.id,
        location_id: selectedLocationId,
      }));
      await supabase.from('employee_locations').insert(rows);
    }
    alert('Assignments saved.');
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Assign Employees to Location</h3>

      <div className="mb-3">
        <label>Select Location</label>
        <select className="form-select" value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)}>
          <option value="">-- Select a Location --</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {selectedLocationId && (
        <div className="row mt-4">
          <div className="col-md-5">
            <h5>Unassigned Employees</h5>
            <ul className="list-group">
              {unassignedEmployees.map(emp => (
                <li key={emp.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {emp.name}
                  <button className="btn btn-sm btn-outline-primary" onClick={() => moveToAssigned(emp.id)}>→</button>
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
            <h5>Assigned Employees</h5>
            <ul className="list-group">
              {assignedEmployees.map(emp => (
                <li key={emp.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {emp.name}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => moveToUnassigned(emp.id)}>←</button>
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

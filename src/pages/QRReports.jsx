import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

import { useRef } from 'react';

const QRReports = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('23:59');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      const { data: userList } = await supabase.from('scans').select('user_id').neq('user_id', null);
      const uniqueUsers = [...new Set(userList.map(u => u.user_id))];
      setUsers(uniqueUsers);

      const { data: locs } = await supabase.from('qr_codes').select('location_id, label');
      const uniqueLocs = [...new Map(locs.map(item => [item.location_id, item])).values()];
      setLocations(uniqueLocs);
    };
    loadFilters();
  }, []);

  const handleGenerate = () => {
    generateReports();
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">QR Reports</h3>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label>User</label>
          <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">All Users</option>
            {users.map((u, i) => <option key={i} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label>Location</label>
          <select className="form-select" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map((loc, i) => <option key={i} value={loc.location_id}>{loc.label}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <label>Date</label>
          <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="col-md-2">
          <label>Start Time</label>
          <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="col-md-2">
          <label>End Time</label>
          <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
        <div className="col-md-12 text-end">
          <button className="btn btn-primary mt-3" onClick={handleGenerate}>Generate Report</button>
        </div>
      </div>
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No QR scan activity found for any location.</p>
      ) : (
        <ul className="list-group">
          {reports.map((report, index) => (
            <li key={index} className="list-group-item">
              <strong>{report.location}</strong><br />
              Total Scans: {report.totalScans}<br />
              First Scan: {new Date(report.firstScan).toLocaleString()}<br />
              Last Scan: {new Date(report.lastScan).toLocaleString()}
              <details className="mt-2">
                <summary>View All Scans</summary>
                <ul className="mt-2 ps-3">
                  {report.allScans.map((scan, i) => (
                    <li key={i}>{new Date(scan.timestamp).toLocaleString()} - User: {scan.user_id}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QRReports;

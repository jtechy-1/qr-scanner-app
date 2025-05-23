import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

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
      const { data: employeesData, error: empErr } = await supabase
        .from('employees')
        .select('id, name');
      if (empErr) console.error('Employee load error:', empErr);
      else setUsers(employeesData);

      const { data: locs, error: locErr } = await supabase
        .from('qr_codes')
        .select('location_id, label, locations(name)');
      if (locErr) console.error('Location load error:', locErr);
      const uniqueLocs = locs.map(item => ({ location_id: item.location_id, name: item.locations?.name || 'Unnamed' }));
      setLocations(uniqueLocs);
    };
    loadFilters();
  }, []);

  const showToast = (message) => {
    const toastWrapper = document.createElement('div');
    toastWrapper.className = 'position-fixed top-0 end-0 p-3';
    toastWrapper.style.zIndex = 1055;

    const toast = document.createElement('div');
    toast.className = 'toast show align-items-center text-bg-dark border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    toastWrapper.appendChild(toast);
    document.body.appendChild(toastWrapper);
    setTimeout(() => toastWrapper.remove(), 1500);
  };

  const handleEmailReport = (report) => {
    const email = prompt('Enter recipient email:');
    if (!email) return;

    const htmlBody = `
      <h2>QR Scan Report - ${report.location}</h2>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Timestamp</th>
            <th>Label</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          ${report.allScans.map(scan => `
            <tr>
              <td>${new Date(scan.timestamp).toLocaleString()}</td>
              <td>${scan.qr_codes?.label || 'N/A'}</td>
              <td>${getUserName(scan.user_id)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    fetch('https://dkrpawmussqqbjlrvasz.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: `QR Report - ${report.location}`,
        html: htmlBody
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        console.error('❌ Email function responded with error:', data);
        showToast(`Failed to email report: ${data.error || 'Unknown error'}`);
        return;
      }
      showToast('Report emailed successfully');
    })
    .then(data => {
      showToast('Report emailed successfully');
    })
    .catch(err => {
      console.error('Failed to send email', err);
      showToast('Failed to email report');
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    showToast('Generating report...');

    const [sh, sm] = startTime.split(':');
    const [eh, em] = endTime.split(':');

    const selected = startDate || new Date().toISOString().split('T')[0];

    const start = new Date(`${selected}T${startTime}:00`);
    const end = new Date(`${selected}T${endTime}:59.999`);

    const { data: scanResults, error: scanError } = await supabase
      .from('scans')
      .select('timestamp, user_id, qr_codes(label, location_id, locations(name))')
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString());

    if (scanError) {
      console.error('Error fetching scans:', scanError);
      setLoading(false);
      return;
    }

    const filtered = scanResults.filter(scan => {
      return (!selectedUser || scan.user_id === selectedUser) &&
             (!selectedLocation || scan.qr_codes?.location_id === selectedLocation);
    });

    const scansByLocation = {};
    for (const scan of filtered) {
      const locId = scan.qr_codes?.location_id;
      const locName = scan.qr_codes?.locations?.name;
      if (!locId) continue;
      if (!scansByLocation[locId]) {
        scansByLocation[locId] = { name: locName || `Location ${locId}`, scans: [] };
      }
      scansByLocation[locId].scans.push(scan);
    }

    const locationReports = Object.entries(scansByLocation)
      .map(([locId, data]) => {
        const sorted = data.scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return {
          location: data.name,
          allScans: sorted
        };
      })
      .sort((a, b) => new Date(b.allScans[0]?.timestamp || 0) - new Date(a.allScans[0]?.timestamp || 0));

    setReports(locationReports);
    setLoading(false);
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : id;
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">QR Reports</h3>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <label>User</label>
          <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">All Users</option>
            {users.map((u, i) => <option key={i} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label>Location</label>
          <select className="form-select" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map((loc, i) => <option key={i} value={loc.location_id}>{loc.name}</option>)}
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
      <ul className="list-group">
        {reports.length === 0 ? (
          <li className="list-group-item">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Label</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="3" className="text-center">No QR scan activity found for any location.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        ) : (
          reports.map((report, index) => (
            <li key={index} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{report.location}</strong>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => handleEmailReport(report)}>
                  Email Report
                </button>
              </div>
              <div className="table-responsive mt-3">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Label</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.allScans.map((scan, i) => (
                      <tr key={i}>
                        <td>{new Date(scan.timestamp).toLocaleString()}</td>
                        <td>{scan.qr_codes?.label || 'N/A'}</td>
                        <td>{getUserName(scan.user_id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default QRReports;

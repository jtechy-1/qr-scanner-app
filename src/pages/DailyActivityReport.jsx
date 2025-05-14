import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const DailyActivityReport = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [report, setReport] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
    report_number: ''
  });

  useEffect(() => {
    const generateReportNumber = async () => {
      const { count } = await supabase.from('reports').select('id', { count: 'exact', head: true });
      const next = (count || 0) + 1;
      const reportNum = `RPT-${next.toString().padStart(5, '0')}`;
      setReport(prev => ({ ...prev, report_number: reportNum }));
    };
    generateReportNumber();

    const fetchUserLocations = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      const { data } = await supabase
        .from('employee_locations')
        .select('locations(id, name)')
        .eq('employee_id', userId);

      if (data) {
        const locs = data.map(l => l.locations);
        setLocations(locs);
      }
    };
    fetchUserLocations();
  }, []);

  const handleNext = () => {
    if (!report.location_id || !report.date || !report.start_time || !report.end_time) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    localStorage.setItem('daily_report_draft', JSON.stringify(report));
    navigate('/report-details');
  };

  const handleCancel = () => {
    const confirmed = window.confirm('Are you sure you want to cancel and return to the dashboard? Your progress will not be saved.');
    if (confirmed) navigate('/dashboard');
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Daily Activity Report</h3>
      {report.report_number && <div className="mb-3"><strong>Report #: </strong>{report.report_number}</div>}

      <div className="mb-3">
        <label className="form-label">Location</label>
        {locations.length > 0 ? (
          <select className="form-select" value={report.location_id} onChange={e => setReport({ ...report, location_id: e.target.value })}>
            <option value="" disabled>Select Location</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        ) : (
          <div className="alert alert-warning">You have no assigned locations.</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Date</label>
        <input type="date" className="form-control" value={report.date} onChange={e => setReport({ ...report, date: e.target.value })} />
      </div>

      <div className="row mb-3">
        <div className="col">
          <label className="form-label">Start Time</label>
          <input type="time" className="form-control" value={report.start_time} onChange={e => setReport({ ...report, start_time: e.target.value })} />
        </div>
        <div className="col">
          <label className="form-label">End Time</label>
          <input type="time" className="form-control" value={report.end_time} onChange={e => setReport({ ...report, end_time: e.target.value })} />
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-outline-secondary" onClick={handleCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleNext}>Next</button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default DailyActivityReport;

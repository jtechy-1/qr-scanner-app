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

  useEffect(() => { // cleaned up to remove report number generation
    
    const fetchUserLocations = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data } = await supabase
        .from('employee_locations')
        .select('location_id, locations(name)')
        .eq('employee_id', userId);

      if (data) {
        const locs = data.map(entry => ({ id: entry.location_id, name: entry.locations?.name || 'Unnamed' }));
        setLocations(locs);
      }
    };
    fetchUserLocations();
  }, []);

  const handleNext = async () => {
    if (locations.length === 0) {
      toast.error('You have no assigned locations. Cannot create report.');
      return;
    }
    if (!report.location_id || !report.date || !report.start_time || !report.end_time) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    let employeeName = '';
    if (userId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('name')
        .eq('id', userId)
        .single();
      employeeName = emp?.name || '';
    }

    let locationName = '';
    if (report.location_id) {
      const { data: loc } = await supabase
        .from('locations')
        .select('name')
        .eq('id', report.location_id)
        .single();
      locationName = loc?.name || '';
    }

    let reportData = { ...report };
    const { data: newNumber, error: rptErr } = await supabase.rpc('get_next_report_number');
    if (rptErr) {
      toast.error('Failed to generate report number.');
      return;
    }
    reportData.report_number = newNumber;
    if (!reportData.report_number) {
      toast.error('Report number was not generated. Please try again.');
      return;
    }
    setReport(prev => ({ ...prev, report_number: newNumber }));

    const { error, data: inserted } = await supabase.from('reports').insert({
      date: reportData.date,
      start_time: reportData.start_time,
      end_time: reportData.end_time,
      employee_id: userId,
      location_id: reportData.location_id,
      report_number: reportData.report_number,
      status: 'Draft',
      entries: [],
      photos: []
    }).select().single();

    if (error) {
      console.error('Supabase insert error:', error);
      toast.error('Failed to save report to database: ' + error.message);
      return;
    }

    reportData.id = inserted.id;

    localStorage.setItem('daily_report_draft', JSON.stringify({
      ...reportData,
      employee_id: userId,
      employee_name: employeeName,
      location_name: locationName,
      created_at: inserted.created_at
    }));
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
        <button className="btn btn-primary" onClick={handleNext} disabled={!report.location_id || !report.date || !report.start_time || !report.end_time}>Next</button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default DailyActivityReport;

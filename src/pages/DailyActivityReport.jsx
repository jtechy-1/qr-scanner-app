import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';

const DailyActivityReport = () => {
  const [locations, setLocations] = useState([]);
  const [report, setReport] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
    entries: [''],
    photos: [],
    status: 'Draft',
  });

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase.from('locations').select('id, name');
      if (data) setLocations(data);
    };
    fetchLocations();
  }, []);

  const handleAddEntry = () => {
    setReport(prev => ({ ...prev, entries: [...prev.entries, ''] }));
  };

  const handleEntryChange = (index, value) => {
    const newEntries = [...report.entries];
    newEntries[index] = value;
    setReport(prev => ({ ...prev, entries: newEntries }));
  };

  const handleFileChange = (e) => {
    setReport(prev => ({ ...prev, photos: Array.from(e.target.files) }));
  };

  const handleSubmit = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      toast.error('You must be logged in to submit a report.');
      return;
    }

    if (!report.location_id || !report.date || !report.start_time || !report.end_time) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    let uploadedUrls = [];
    for (const photo of report.photos) {
      const fileName = `${Date.now()}-${photo.name}`;
      const { data, error } = await supabase.storage.from('report_photos').upload(fileName, photo);
      if (!error) {
        const { data: publicUrl } = supabase.storage.from('report_photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl.publicUrl);
      }
    }

    const { error: insertError } = await supabase.from('reports').insert({
      location_id: report.location_id,
      date: report.date,
      start_time: report.start_time,
      end_time: report.end_time,
      entries: report.entries,
      photos: uploadedUrls,
      status: report.status,
      employee_id: userId,
    });

    if (!insertError) {
      toast.success(`Report saved successfully as ${report.status}.`);
      setReport({
        location_id: '',
        date: '',
        start_time: '',
        end_time: '',
        entries: [''],
        photos: [],
        status: 'Draft',
      });
      setTimeout(() => {
        window.location.href = '/view-reports';
      }, 1000);
    } else {
      toast.error('Failed to save report.');
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Daily Activity Report</h3>

      <div className="mb-3">
        <label className="form-label">Location</label>
        <select className="form-select" value={report.location_id} onChange={e => setReport({ ...report, location_id: e.target.value })}>
          <option value="" disabled>Select Location</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
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

      <h5>Hourly Entries</h5>
      {report.entries.map((entry, i) => (
        <div className="mb-2" key={i}>
          <textarea
            className="form-control"
            placeholder={`Entry ${i + 1}`}
            value={entry}
            onChange={e => handleEntryChange(i, e.target.value)}
          />
        </div>
      ))}
      <button className="btn btn-outline-primary mb-3" onClick={handleAddEntry}>Add Entry</button>

      <div className="mb-3">
        <label className="form-label">Upload Photos</label>
        <input type="file" className="form-control" multiple onChange={handleFileChange} />
      </div>

      <button className="btn btn-outline-secondary me-2" onClick={() => setReport(prev => ({ ...prev, status: 'Draft' }))}>Save as Draft</button>
      <button className="btn btn-success" onClick={() => {
        setReport(prev => ({ ...prev, status: 'Review' }));
        handleSubmit();
      }}>Submit for Review</button>
    <ToastContainer position="top-right" autoClose={3000} />
    </div>);
};

export default DailyActivityReport;

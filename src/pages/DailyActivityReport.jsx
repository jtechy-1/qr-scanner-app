import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';

const DailyActivityReport = () => {
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [report, setReport] = useState({
    location_id: '',
    date: '',
    start_time: '',
    end_time: '',
    entries: [{ time: '', note: '' }],
    photos: [],
    status: 'Draft',
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

    const fetchLocations = async () => {
      const { data } = await supabase.from('locations').select('id, name');
      if (data) setLocations(data);
    };
    fetchLocations();
  }, []);

  const handleAddEntry = () => {
    setReport(prev => ({ ...prev, entries: [...prev.entries, { time: '', note: '' }] }));
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...report.entries];
    newEntries[index][field] = value;
    setReport(prev => ({ ...prev, entries: newEntries }));
  };

  const handleFileChange = (e) => {
    setReport(prev => ({ ...prev, photos: Array.from(e.target.files) }));
  };

  const submitWithStatus = async (status) => {
    setSubmitting(true);
    const updatedReport = { ...report, status };

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      toast.error('You must be logged in to submit a report.');
      setSubmitting(false);
      return;
    }

    if (!updatedReport.location_id || !updatedReport.date || !updatedReport.start_time || !updatedReport.end_time) {
      toast.warning('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const incompleteEntry = updatedReport.entries.some(entry => !entry.time || !entry.note);
    if (incompleteEntry) {
      toast.warning('Each entry must include a time and note.');
      setSubmitting(false);
      return;
    }

    let uploadedUrls = [];
    for (const photo of updatedReport.photos) {
      const fileName = `${Date.now()}-${photo.name}`;
      const { data, error } = await supabase.storage.from('report_photos').upload(fileName, photo);
      if (!error) {
        const { data: publicUrl } = supabase.storage.from('report_photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl.publicUrl);
      }
    }

    const submittedAt = status === 'Review' ? new Date().toISOString() : null;
    const { error: insertError } = await supabase.from('reports').insert({
      location_id: updatedReport.location_id,
      date: updatedReport.date,
      start_time: updatedReport.start_time,
      end_time: updatedReport.end_time,
      entries: updatedReport.entries,
      photos: uploadedUrls,
      report_number: updatedReport.report_number,
      status: updatedReport.status,
      submitted_at: submittedAt,
      employee_id: userId,
    });

    if (!insertError) {
      toast.success(`Report saved successfully as ${status}.`);
      setReport({
        location_id: '',
        date: '',
        start_time: '',
        end_time: '',
        entries: [{ time: '', note: '' }],
        photos: [],
        status: 'Draft',
        report_number: '',
      });
      setTimeout(() => {
        setSubmitting(false);
        window.location.href = '/view-reports';
      }, 1000);
    } else {
      toast.error('Failed to save report.');
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Daily Activity Report</h3>
      {report.report_number && <div className="mb-3"><strong>Report #: </strong>{report.report_number}</div>}

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
        <div className="row mb-2" key={i}>
          <div className="col-md-3">
            <input
              type="time"
              className="form-control"
              value={entry.time}
              onChange={e => handleEntryChange(i, 'time', e.target.value)}
            />
          </div>
          <div className="col-md-9">
            <div className="input-group">
              <textarea
                className="form-control"
                placeholder={`Entry ${i + 1}`}
                value={entry.note}
                onChange={e => handleEntryChange(i, 'note', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => {
                  const newEntries = [...report.entries];
                  if (report.entries.length > 1) {
                    newEntries.splice(i, 1);
                  } else {
                    toast.warning('At least one entry is required.');
                    return;
                  }
                  setReport(prev => ({ ...prev, entries: newEntries }));
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline-primary mb-3" onClick={handleAddEntry}>Add Entry</button>

      <div className="mb-3">
        <label className="form-label">Upload Photos</label>
        <input type="file" className="form-control" multiple onChange={handleFileChange} />
      </div>

      <button className="btn btn-outline-secondary me-2" onClick={() => submitWithStatus('Draft')} disabled={submitting}>Save as Draft</button>
      <button className="btn btn-success" onClick={() => submitWithStatus('Review')} disabled={submitting}>Submit for Review</button>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default DailyActivityReport;
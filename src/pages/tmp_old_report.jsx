import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, locations(name)')
        .eq('id', id)
        .single();
      if (!error) setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [id]);

  const handleSaveAll = async () => {
    const updated = report.entries.map((entry, index) => {
      const time = document.getElementById(`editTime-${index}`).value;
      const note = document.getElementById(`editNote-${index}`).value;
      return { time, note };
    });
    const { error } = await supabase.from('reports').update({ entries: updated }).eq('id', report.id);
    if (!error) {
      setReport(prev => ({ ...prev, entries: updated }));
      toast.success('Changes saved successfully. Redirecting...');
      setTimeout(() => {
        window.location.href = '/view-reports';
      }, 1500);
    }
  };

  const handleSubmitReport = async () => {
    if (!report.date || !report.start_time || !report.end_time || !report.entries?.length || !report.location_id) {
      toast.error('Report is incomplete. Please fill in all required fields.');
      return;
    }
    const submittedAt = new Date().toISOString();
    const { error } = await supabase
      .from('reports')
      .update({ status: 'Review', submitted_at: submittedAt })
      .eq('id', report.id);
    if (!error) {
      toast.success('Report submitted for review.');
      setReport(prev => ({ ...prev, status: 'Review', submitted_at: submittedAt }));
    } else {
      toast.error('Failed to submit report.');
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center mt-5" id="report-content">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!report) return (
    <div className="container mt-4" id="report-content" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>
      Report not found.
    </div>
  );

  return (
    <div className="container mt-4" id="report-content">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3 className="text-primary mb-3">Report #{report.report_number}</h3>

      <p><strong>Date:</strong> {report.date}</p>
      <p><strong>Location:</strong> {report.locations?.name || 'Unknown'}</p>
      <p><strong>Status:</strong> {report.status}</p>
      <p><strong>Start Time:</strong> {report.start_time}</p>
      <p><strong>End Time:</strong> {report.end_time}</p>

      <h5 className="mt-4">Hourly Entries</h5>
      <ul className="list-group mb-3" style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
        {report.entries?.map((entry, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center" style={{ border: 'none', padding: '6px 0' }}>
            <div>
              <input type="time" defaultValue={entry.time} id={`editTime-${index}`} className="form-control form-control-sm d-inline-block me-2" style={{ width: '100px' }} />
              <input type="text" defaultValue={entry.note} id={`editNote-${index}`} className="form-control form-control-sm d-inline-block me-2" style={{ width: '300px' }} />
              <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                const updated = report.entries.filter((_, i) => i !== index);
                const { error } = await supabase.from('reports').update({ entries: updated }).eq('id', report.id);
                if (!error) setReport(prev => ({ ...prev, entries: updated }));
              }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {report.status === 'Draft' && report.entries?.length > 0 && (
        <div className="mb-3">
          <button className="btn btn-success me-2" onClick={handleSaveAll}>Save</button>
          <button className="btn btn-dark" onClick={() => window.location.href = '/view-reports'}>Close</button>
          <button className="btn btn-primary ms-2" onClick={handleSubmitReport}>Submit Report</button>
        </div>
      )}

      {report.status === 'Draft' && (
        <div className="mb-4">
          <h6>Add Entry</h6>
          <div className="row g-2">
            <div className="col-md-3">
              <input type="time" className="form-control" id="entryTime" />
            </div>
            <div className="col-md-7">
              <input type="text" className="form-control" id="entryNote" placeholder="Note" />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={async () => {
                const time = document.getElementById('entryTime').value;
                const note = document.getElementById('entryNote').value;
                if (!time || !note) return toast.error('Please enter both time and note.');
                const updatedEntries = [...report.entries, { time, note }];
                const { error } = await supabase.from('reports').update({ entries: updatedEntries }).eq('id', report.id);
                if (!error) setReport(prev => ({ ...prev, entries: updatedEntries }));
                document.getElementById('entryTime').value = '';
                document.getElementById('entryNote').value = '';
              }}>Add</button>
            </div>
          </div>
        </div>
      )}

      <h5>Photos</h5>
      <div className="d-flex flex-wrap gap-2">
        {report.photos && report.photos.length > 0 ? (
          report.photos.map((url, index) => (
            <img key={index} src={url} alt={`Photo ${index + 1}`} className="img-thumbnail" style={{ maxWidth: '120px', border: '1px solid #ccc', padding: '2px' }} />
          ))
        ) : (
          <p>No photos attached.</p>
        )}
      </div>
    </div>
  );
};

export default ReportDetails;

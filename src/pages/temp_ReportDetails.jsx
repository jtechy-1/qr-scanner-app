import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';

const ReportDetails = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ time: '', note: '' });
  const [photos, setPhotos] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const draft = localStorage.getItem('daily_report_draft');
    if (!draft) return navigate('/');
    const parsed = JSON.parse(draft);
    setReport(parsed);
    setEntries(parsed.entries || []);
    setPhotos(parsed.photos || []);
  }, [navigate]);

  const addEntry = () => {
    if (!newEntry.time || !newEntry.note) {
      toast.warning('Please enter both time and note.');
      return;
    }
    setEntries([...entries, newEntry]);
    setNewEntry({ time: '', note: '' });
  };

  const removeEntry = (index) => {
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotos(prev => [...prev, ...urls]);
  };

  const removePhoto = (index) => {
    const updated = [...photos];
    updated.splice(index, 1);
    setPhotos(updated);
  };

  const handleCancel = () => {
    const confirmed = window.confirm('Are you sure you want to cancel? Your report will not be saved.');
    if (confirmed) {
      navigate('/dashboard');
    }
  };

  const handleSave = async () => {
    const confirmed = window.confirm('Do you want to save this report?');
    if (!confirmed) return;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    let error;

    if (report.id) {
      ({ error } = await supabase.from('reports').update({
        ...report,
        employee_id: userId,
        status: 'Draft',
        entries,
        photos
      }).eq('id', report.id));
    } else {
      ({ error } = await supabase.from('reports').insert({
        ...report,
        employee_id: userId,
        status: 'Draft',
        entries,
        photos
      }));
    }

    if (error) {
      toast.error('Failed to save report.');
    } else {
      toast.success('Report saved.');
      localStorage.removeItem('daily_report_draft');
      localStorage.removeItem('report_entries');
      localStorage.removeItem('report_photos');
      setTimeout(() => navigate('/view-reports'), 2000);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report Details</h3>

      <div className="mb-3">
        <label className="form-label">Time</label>
        <input
          type="time"
          className="form-control"
          value={newEntry.time}
          onChange={e => setNewEntry({ ...newEntry, time: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Note</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter description"
          value={newEntry.note}
          onChange={e => setNewEntry({ ...newEntry, note: e.target.value })}
        />
      </div>

      <button className="btn btn-primary mb-3" onClick={addEntry}>Add Entry</button>

      <ul className="list-group mb-3">
        {entries.map((entry, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            <span><strong>{entry.time}</strong> - {entry.note}</span>
            <button className="btn btn-sm btn-danger" onClick={() => removeEntry(index)}>Delete</button>
          </li>
        ))}
      </ul>

      <div className="mb-4">
        <label className="form-label">Upload Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          className="form-control"
          onChange={handlePhotoUpload}
        />
        <div className="d-flex flex-wrap mt-3 gap-2">
          {photos.map((url, index) => (
            <div key={index} className="position-relative">
              <img src={url} alt={`Uploaded ${index + 1}`} className="img-thumbnail" style={{ width: '100px' }} />
              <button
                className="btn btn-sm btn-close position-absolute top-0 end-0"
                onClick={() => removePhoto(index)}
              ></button>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={handleCancel}>Cancel</button>
        <button className="btn btn-success" onClick={handleSave}>Save</button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReportDetails;

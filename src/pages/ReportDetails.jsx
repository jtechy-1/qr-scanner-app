import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';

const ReportDetails = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({ time: '', note: '' });
  const [photos, setPhotos] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = localStorage.getItem('daily_report_draft');
      if (!draft) return navigate('/');

      const parsed = JSON.parse(draft);
      const updatedReport = { ...parsed };

      if (parsed.employee_id) {
        const { data: empData } = await supabase
          .from('employees')
          .select('name')
          .eq('id', parsed.employee_id)
          .single();
        updatedReport.employee_name = empData?.name;
      }

      if (parsed.location_id) {
        const { data: locData } = await supabase
          .from('locations')
          .select('name')
          .eq('id', parsed.location_id)
          .single();
        updatedReport.location_name = locData?.name;
      }

      setReport(updatedReport);
      setEntries((parsed.entries || []).sort((a, b) => a.time.localeCompare(b.time)));
      setPhotos(parsed.photos || []);
    };

    loadDraft();
  }, [navigate]);

  const addEntry = () => {
    if (!newEntry.time || !newEntry.note) {
      toast.warning('Please enter both time and note.');
      return;
    }
    setEntries([...entries, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
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
    setModalAction('cancel');
    setShowModal(true);
  };

  const handleSave = async () => {
    setModalAction('save');
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report Details</h3>

      {report && (
        <div className="mb-4">
          <div><strong>Employee Name:</strong> {report.employee_name || 'N/A'}</div>
          <div><strong>Location Name:</strong> {report.location_name || 'N/A'}</div>
          <div><strong>Date:</strong> {report.date || 'N/A'} &nbsp; <strong>Report #:</strong> {report.report_number || 'N/A'}</div>
          <div><strong>Start Time:</strong> {report.start_time || 'N/A'} &nbsp; <strong>End Time:</strong> {report.end_time || 'N/A'}</div>
        </div>
      )}

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

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Action</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>{modalAction === 'save' ? 'Do you want to save this report?' : 'Are you sure you want to cancel? Your report will not be saved.'}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={async () => {
                  setShowModal(false);
                  if (modalAction === 'cancel') {
                    navigate('/dashboard');
                  } else if (modalAction === 'save') {
                    const { data: session } = await supabase.auth.getSession();
                    const userId = session?.session?.user?.id;

                    let error, data;

                    if (report.id) {
                      const {
                        id,
                        date,
                        start_time,
                        end_time,
                        location_id,
                        report_number
                      } = report;

                      ({ error } = await supabase.from('reports').update({
                        date,
                        start_time,
                        end_time,
                        employee_id: userId,
                        location_id,
                        report_number,
                        status: 'Draft',
                        entries,
                        photos
                      }).eq('id', id));
                    } else {
                      let reportNumber = report.report_number;

                      if (!reportNumber) {
                        const { data: rptNum, error: rptErr } = await supabase.rpc('get_next_report_number');
                        if (rptErr) {
                          toast.error('Failed to generate report number.');
                          return;
                        }
                        reportNumber = rptNum;
                      }

                      ({ error, data } = await supabase.from('reports').insert({
                        date: report.date,
                        start_time: report.start_time,
                        end_time: report.end_time,
                        employee_id: userId,
                        location_id: report.location_id,
                        report_number: reportNumber || report.report_number,
                        status: 'Draft',
                        entries,
                        photos
                      }).select().single());

                      if (!error && data) {
                        setReport({ ...report, id: data.id, report_number: reportNumber });
                        localStorage.setItem('daily_report_draft', JSON.stringify({ ...report, id: data.id, entries, photos, report_number: reportNumber, employee_name: report.employee_name, location_name: report.location_name }));
                      }
                    }

                    if (error) {
                      toast.error('Failed to save report: ' + error.message);
                      console.error('Save error:', error);
                    } else {
                      const now = new Date().toLocaleString();
                      localStorage.setItem('report_last_saved', now);
                      toast.success('Report saved.');
                      setTimeout(() => navigate('/view-reports'), 2000);
                    }
                  }
                }}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReportDetails;

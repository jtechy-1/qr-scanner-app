import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReviewReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const draft = localStorage.getItem('daily_report_draft');
    const entryData = localStorage.getItem('report_entries');
    const photoData = localStorage.getItem('report_photos');

    if (!draft) return navigate('/');
    setReport(JSON.parse(draft));
    setEntries(entryData ? JSON.parse(entryData) : []);
    setPhotos(photoData ? JSON.parse(photoData) : []);
  }, [navigate]);

  const handleSubmit = async () => {
    toast.info('Submitting report...');
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { error } = await supabase.from('reports').insert({
      ...report,
      employee_id: userId,
      status: 'Review',
      entries,
      photos
    });

    if (error) {
      toast.error('Failed to submit report.');
    } else {
      toast.success('Report saved as draft.');
      localStorage.removeItem('daily_report_draft');
      localStorage.removeItem('report_entries');
      localStorage.removeItem('report_photos');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Review & Submit Report</h3>

      {report && (
        <div className="mb-4">
          <p><strong>Report #:</strong> {report.report_number}</p>
          <p><strong>Location:</strong> {report.location_id}</p>
          <p><strong>Date:</strong> {report.date}</p>
          <p><strong>Time:</strong> {report.start_time} - {report.end_time}</p>
        </div>
      )}

      <h5>Entries</h5>
      <ul className="list-group mb-4">
        {entries.map((e, i) => (
          <li key={i} className="list-group-item">
            <strong>{e.time}</strong> - {e.note}
          </li>
        ))}
      </ul>

      <h5>Photos</h5>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {photos.map((url, i) => (
          <img key={i} src={url} alt={`Photo ${i + 1}`} className="img-thumbnail" style={{ width: '120px' }} />
        ))}
      </div>

      <div className="d-flex justify-content-between">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button className="btn btn-success" onClick={handleSubmit}>Submit</button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReviewReport;

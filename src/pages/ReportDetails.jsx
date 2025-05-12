import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  if (loading) return <div className="container mt-4" id="report-content">Loading report...</div>;
  if (!report) return <div className="container mt-4" id="report-content" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>Report not found.</div>;

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report #{report.report_number}</h3>
      <button className="btn btn-sm btn-outline-secondary mb-3 d-print-none" onClick={async () => {
        const input = document.getElementById('report-content');
        const canvas = await html2canvas(input, {
          ignoreElements: (el) => el.classList.contains('d-print-none')
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${report.report_number || 'report'}.pdf`);
      }}>Download PDF</button>
      <p><strong>Date:</strong> {report.date}</p>
      <p><strong>Location:</strong> {report.locations?.name || 'Unknown'}</p>
      <p><strong>Status:</strong> {report.status}</p>
      <p><strong>Start Time:</strong> {report.start_time}</p>
      <p><strong>End Time:</strong> {report.end_time}</p>

      <h5 className="mt-4">Hourly Entries</h5>
      <ul className="list-group mb-3" style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
        {report.entries?.map((entry, index) => (
          <li key={index} className="list-group-item" style={{ border: 'none', padding: '6px 0' }}>
            <strong>{entry.time}</strong>: {entry.note}
          </li>
        ))}
      </ul>

      <h5>Photos</h5>
      <div className="d-flex flex-wrap gap-2">
        {report.photos?.map((url, index) => (
          <img key={index} src={url} alt={`Photo ${index + 1}`} className="img-thumbnail" style={{ maxWidth: '120px', border: '1px solid #ccc', padding: '2px' }} />
        )) || <p>No photos attached.</p>}
      </div>
    </div>
  );
};

export default ReportDetails;


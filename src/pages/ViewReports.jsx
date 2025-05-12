import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ViewReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase.from('reports').select('*, locations(name)').order('date', { ascending: false });
      if (!error) setReports(data);
      setLoading(false);
    };
    fetchReports();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report Log</h3>
      {loading ? (
        <div>Loading...</div>
      ) : reports.length === 0 ? (
        <div>No reports found.</div>
      ) : (
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Report #</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Actions</th></tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={index}>
                <td><a href={`/report/${report.id}`} className="text-decoration-none">{report.report_number}</a></td>
                <td>{report.date}</td>
                <td>{report.locations?.name || 'Unknown'}</td>
                <td>{report.status}</td>
                <td>{report.start_time}</td>
                $1
                <td><button className='btn btn-sm btn-outline-primary'>View Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewReports;

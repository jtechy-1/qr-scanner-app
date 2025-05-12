import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ViewReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedStart = localStorage.getItem('reportFilterStart');
    const savedEnd = localStorage.getItem('reportFilterEnd');
    const savedStatus = localStorage.getItem('reportFilterStatus');
    if (savedStart) setStartDate(savedStart);
    if (savedEnd) setEndDate(savedEnd);
    if (savedStatus) setStatusFilter(savedStatus);
    const fetchReports = async () => {
      const { data, error } = await supabase.from('reports').select('*, locations(name)').order('date', { ascending: false });
      if (!error) {
        setReports(data);
        setFilteredReports(data);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report Log</h3>
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Start Date</label>
          <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Review">Review</option>
            <option value="Submitted">Submitted</option>
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-outline-primary w-100" onClick={() => {
            localStorage.setItem('reportFilterStart', startDate);
            localStorage.setItem('reportFilterEnd', endDate);
            localStorage.setItem('reportFilterStatus', statusFilter);
            const filtered = reports.filter(r => {
              const reportDate = new Date(r.date);
              const matchesDate = (!startDate || new Date(startDate) <= reportDate) && (!endDate || reportDate <= new Date(endDate));
              const matchesStatus = !statusFilter || r.status === statusFilter;
              return matchesDate && matchesStatus;
            });
            setFilteredReports(filtered);
          }}>Filter</button>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-outline-secondary w-100" onClick={() => {
            setStartDate('');
            localStorage.removeItem('reportFilterStart');
            setEndDate('');
            localStorage.removeItem('reportFilterEnd');
            setStatusFilter('');
            localStorage.removeItem('reportFilterStatus');
            setFilteredReports(reports);
          }}>Reset</button>
        </div>
      </div>
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
            {filteredReports.map((report, index) => (
              <tr key={index}>
                <td><a href={`/report/${report.id}`} className="text-decoration-none">{report.report_number}</a></td>
                <td>{report.date}</td>
                <td>{report.locations?.name || 'Unknown'}</td>
                <td>{report.status}</td>
                <td>{report.start_time}</td>
                <td>{report.end_time}</td>
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

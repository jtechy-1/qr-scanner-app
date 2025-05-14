import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

const ViewReports = () => {
  const [userRole, setUserRole] = useState('');
  const [allReports, setAllReports] = useState([]);
  const [activeTab, setActiveTab] = useState('Draft');
  const [draftReports, setDraftReports] = useState([]);
  const [completedReports, setCompletedReports] = useState([]);
  const [deletedReports, setDeletedReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadReports = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: roleData } = await supabase.from('employees').select('role').eq('id', user.id).single();
      setUserRole(roleData?.role || '');

      const { data: reports } = await supabase
        .from('reports')
        .select('*, locations(name)')
        .or('status.eq.Draft,status.eq.Review,status.eq.Submitted,status.eq.Deleted')
        .order('date', { ascending: false });

      const now = new Date();
      const drafts = reports.filter(r => r.status === 'Draft');
      const completed = reports.filter(r => r.status === 'Submitted' || r.status === 'Review');
      const deleted = reports.filter(r => r.status === 'Deleted');

      const expired = deleted.filter(r => {
        const deletedAt = new Date(r.deleted_at);
        return now - deletedAt > 8 * 24 * 60 * 60 * 1000;
      });
      for (let r of expired) {
        await supabase.from('reports').delete().eq('id', r.id);
      }

      const validReports = reports.filter(r => r.status !== 'Deleted' || !expired.find(e => e.id === r.id));
      setAllReports(validReports);
      setDraftReports(validReports.filter(r => r.status === 'Draft'));
      setCompletedReports(validReports.filter(r => r.status === 'Submitted' || r.status === 'Review'));
      setDeletedReports(deleted.filter(r => !expired.find(e => e.id === r.id)));
    };

    loadReports();
  }, []);

  const displayedReports = activeTab === 'Draft' ? draftReports : activeTab === 'Completed' ? completedReports : deletedReports;

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Report Log</h3>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'Draft' ? 'active' : ''}`} onClick={() => setActiveTab('Draft')}>Draft</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'Completed' ? 'active' : ''}`} onClick={() => setActiveTab('Completed')}>Completed</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'Deleted' ? 'active' : ''}`} onClick={() => setActiveTab('Deleted')}>Deleted</button>
        </li>
      </ul>

      {displayedReports.length === 0 ? (
        <div className="alert alert-info">No reports found in this tab.</div>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedReports.map((report) => {
              const isIncomplete = !report.date || !report.start_time || !report.end_time || !report.entries?.length || !report.location_id;
              return (
                <tr key={report.id}>
                  <td>
                    <a href={`/report/${report.id}`} className="text-decoration-none">
                      {report.report_number}
                    </a>
                  </td>
                  <td>{report.date}</td>
                  <td>{report.locations?.name || 'Unknown'}</td>
                  <td>{report.status}</td>
                  <td>{report.start_time}</td>
                  <td>{report.end_time}</td>
                  <td>
                    {activeTab === 'Draft' && report.status === 'Draft' && (
                      <button
                        className='btn btn-sm btn-primary me-1'
                        disabled={isIncomplete}
                        title={isIncomplete ? 'Fill in all required fields before submitting' : ''}
                        onClick={async () => {
                          const confirm = window.confirm('Submit this report for review?');
                          if (!confirm) return;
                          const submittedAt = new Date().toISOString();
                          const { error } = await supabase.from('reports').update({ status: 'Review', submitted_at: submittedAt }).eq('id', report.id);
                          if (error) {
                            toast.error('Failed to submit report.');
                            return;
                          }
                          toast.success('Report submitted.');
                          setDraftReports(prev => prev.filter(r => r.id !== report.id));
                          setCompletedReports(prev => [...prev, { ...report, status: 'Review', submitted_at: submittedAt }]);
                        }}
                      >Submit Report</button>
                    )}
                    {userRole === 'admin' && activeTab === 'Completed' && report.status === 'Review' && (
                      <>
                        <button className='btn btn-sm btn-success me-1' onClick={async () => {
                          const confirm = window.confirm('Approve this report?');
                          if (!confirm) return;
                          await supabase.from('reports').update({ status: 'Submitted' }).eq('id', report.id);
                          toast.success('Approved.');
                          setCompletedReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'Submitted' } : r));
                        }}>Approve</button>
                        <button className='btn btn-sm btn-warning me-1' onClick={async () => {
                          const confirm = window.confirm('Return for editing?');
                          if (!confirm) return;
                          await supabase.from('reports').update({ status: 'Draft' }).eq('id', report.id);
                          toast.info('Returned for edit.');
                          setCompletedReports(prev => prev.filter(r => r.id !== report.id));
                          setDraftReports(prev => [...prev, { ...report, status: 'Draft' }]);
                        }}>Return</button>
                      </>
                    )}
                    {activeTab === 'Deleted' ? (
                      <button className='btn btn-sm btn-info' onClick={async () => {
                        const confirm = window.confirm('Restore this report?');
                        if (!confirm) return;
                        await supabase.from('reports').update({ status: 'Draft', deleted_at: null }).eq('id', report.id);
                        toast.success('Report restored.');
                        setDeletedReports(prev => prev.filter(r => r.id !== report.id));
                        setDraftReports(prev => [...prev, { ...report, status: 'Draft', deleted_at: null }]);
                      }}>Restore</button>
                    ) : (
                      <button className='btn btn-sm btn-danger' onClick={async () => {
  try {
    const confirm = window.confirm('Move this report to the Deleted tab?');
    if (!confirm) return;

    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from('reports')
      .update({ status: 'Deleted', deleted_at: deletedAt })
      .eq('id', report.id);

    if (error) {
      toast.error('Delete failed: ' + error.message);
      console.error('Delete error:', error);
      return;
    }

    toast.warning('Report moved to Deleted tab.');
    if (activeTab === 'Draft') {
      setDraftReports(prev => prev.filter(r => r.id !== report.id));
    } else {
      setCompletedReports(prev => prev.filter(r => r.id !== report.id));
    }
    setDeletedReports(prev => [...prev, { ...report, status: 'Deleted', deleted_at: deletedAt }]);
  } catch (e) {
    toast.error('Unexpected error deleting report.');
    console.error('Unexpected error:', e);
  }
}}>Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ViewReports;

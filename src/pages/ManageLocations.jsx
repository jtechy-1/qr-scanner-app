import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [qrLabel, setQrLabel] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('name');
    setLocations(data || []);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    const { error } = await supabase.from('locations').insert({ name: newLocation });
    if (!error) {
      setMessage('✅ Location added');
      setNewLocation('');
      fetchLocations();
      setShowForm(false);
    } else {
      setMessage(`❌ ${error.message}`);
    }
  };

  const handleAddQRCode = async (e) => {
    e.preventDefault();
    if (!selectedLocationId || !qrLabel || !qrValue) {
      setMessage('⚠️ Please fill all QR fields.');
      return;
    }
    const { error } = await supabase.from('qr_codes').insert({
      location_id: selectedLocationId,
      label: qrLabel,
      code_value: qrValue,
    });
    if (!error) {
      setMessage('✅ QR Code added');
      setQrLabel('');
      setQrValue('');
    } else {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Manage Locations & QR Codes</h3>

      <button className="btn btn-primary mb-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Location'}
      </button>

      {showForm && (
        <form onSubmit={handleAddLocation} className="card p-3 mb-4">
          <h5>Add New Location</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Location name"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <button className="btn btn-primary">Add Location</button>
        <button
            type="button"
            className="btn btn-danger mt-2"
            onClick={async () => {
              const confirm = prompt('Are you sure you want to delete this QR code? Type YES to confirm.');
              if (confirm === 'YES') {
                const { error } = await supabase
                  .from('qr_codes')
                  .delete()
                  .eq('location_id', selectedLocationId)
                  .eq('code_value', qrValue);
                if (!error) {
                  setMessage('✅ QR Code deleted');
                  setQrLabel('');
                  setQrValue('');
                } else {
                  setMessage(`❌ ${error.message}`);
                }
              }
            }}
          >
            Delete QR Code
          </button>
        <button
            type="button"
            className="btn btn-outline-secondary mt-2"
            onClick={async () => {
              const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('location_id', selectedLocationId);
              if (!error && data.length > 0) {
                alert('QR Codes:
' + data.map(code => `${code.label} → ${code.code_value}`).join('
'));
              } else {
                alert('No QR codes found or failed to load.');
              }
            }}
          >
            View Existing QR Codes
          </button>
        </form>
      )}

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td>{loc.name}</td>
              <td>{loc.address || '-'}</td>
              <td>{loc.status}</td>
              <td>
                <button
                  className="btn btn-sm btn-secondary me-2"
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    setShowForm(false);
                  }}
                >
                  Edit / QR Codes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLocationId && (
        <form onSubmit={handleAddQRCode} className="card p-3 mt-4">
          <h5>Add QR Code to Location</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="QR Code Label"
            value={qrLabel}
            onChange={(e) => setQrLabel(e.target.value)}
          />

          <input
            type="text"
            className="form-control mb-2"
            placeholder="QR Code Value (text in QR)"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
          />

          <button className="btn btn-success">Add QR Code</button>
        </form>
      )}

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
};

export default ManageLocations;

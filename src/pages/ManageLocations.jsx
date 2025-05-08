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
  const [qrList, setQrList] = useState([]);
  const [selectedQrCodes, setSelectedQrCodes] = useState([]);

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
                            console.error('❌ Supabase delete error:', error.message);
                            setMessage(`❌ ${error.message}`);
    }
  };

  const handleAddQRCode = async (e) => {
    e.preventDefault();
    if (!selectedLocationId || !qrLabel || !qrValue) {
      setMessage('⚠️ Please fill all QR fields.');
      return;
    }

    const { data: existingCode } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('location_id', selectedLocationId)
      .eq('code_value', qrValue)
      .maybeSingle();

    if (existingCode) {
      const { data: duplicateLabel } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('location_id', selectedLocationId)
        .eq('label', qrLabel)
        .neq('id', existingCode.id)
        .maybeSingle();

      if (duplicateLabel) {
        setMessage('⚠️ Label must be unique for each location.');
        return;
      }

      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ label: qrLabel })
        .eq('id', existingCode.id);

      if (!updateError) {
        setMessage('✅ QR Code updated');
        setQrLabel('');
        setQrValue('');
        const { data: updatedQrList } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('location_id', selectedLocationId);
        setQrList(updatedQrList || []);
        return;
      } else {
        setMessage(`❌ ${updateError.message}`);
        return;
      }
    }

    const { data: duplicate } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('location_id', selectedLocationId)
      .eq('label', qrLabel)
      .maybeSingle();

    if (duplicate) {
      setMessage('⚠️ Label must be unique for each location.');
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
      const { data: updatedQrList } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('location_id', selectedLocationId);
      setQrList(updatedQrList || []);
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
                  onClick={async () => {
                    setSelectedLocationId(loc.id);
                    const { data: qrData } = await supabase
                      .from('qr_codes')
                      .select('*')
                      .eq('location_id', loc.id);
                    setQrList(qrData || []);
                    setQrLabel('');
                    setQrValue('');
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
          <h5>Add or Edit QR Code</h5>
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

          <button className="btn btn-success">Save QR Code</button>
        </form>
      )}

      {message && <div className="alert alert-info mt-3">{message}</div>}

      {qrList.length > 0 && (
        <div className="card p-3 mt-3">
          <h5>QR Codes for Selected Location</h5>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th>QR Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {qrList.map(qr => (
                <tr key={qr.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedQrCodes.includes(qr.id)}
                      onChange={() => {
                        setSelectedQrCodes(prev =>
                          prev.includes(qr.id)
                            ? prev.filter(id => id !== qr.id)
                            : [...prev, qr.id]
                        );
                      }}
                    /> {qr.label}
                  </td>
                  <td>{qr.code_value}</td>
                  <td>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qr.code_value)}`}
                      alt={qr.label}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => {
                        setQrLabel(qr.label);
                        setQrValue(qr.code_value);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={async () => {
                        const confirmDelete = prompt('Are you sure you want to delete this QR code? Type YES to confirm.');
                        console.log('User typed:', confirmDelete);
                        if (confirmDelete === 'YES') {
                          console.log('Attempting to delete QR code ID:', qr.id);
                        if (confirmDelete === 'YES') {
                          const { error } = await supabase
                            .from('qr_codes')
                            .delete()
                            .eq('id', qr.id);
                          if (!error) {
                            console.log('✅ QR Code deleted successfully');
                            setQrList(prev => prev.filter(item => item.id !== qr.id));
                            setMessage('✅ QR Code deleted');
                          } else {
                            setMessage(`❌ ${error.message}`);
                          }
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn btn-outline-primary mt-3"
            onClick={() => {
              const selected = qrList.filter(qr => selectedQrCodes.includes(qr.id));
              const win = window.open('', 'PRINT', 'height=600,width=800');
              win.document.write('<html><head><title>Print QR Codes</title></head><body>');
              selected.forEach(qr => {
                win.document.write(`<div style='margin-bottom:20px;'><h4>${qr.label}</h4><img src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr.code_value)}' alt='${qr.label}' /></div>`);
              });
              win.document.write('</body></html>');
              win.document.close();
              win.focus();
              win.print();
              win.close();
            }}
          >
            Print Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;

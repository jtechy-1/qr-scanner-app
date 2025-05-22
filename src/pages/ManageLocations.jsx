import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabaseClient';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [qrLabel, setQrLabel] = useState('');
  const [qrValue, setQrValue] = useState('');
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
      toast.success('✅ Location added');
      setNewLocation('');
      fetchLocations();
      setShowForm(false);
    } else {
      toast.error(`❌ ${error.message}`);
    }
  };

  const handleAddQRCode = async (e) => {
    e.preventDefault();
    if (!selectedLocationId || !qrLabel || !qrValue) {
      toast.warning('⚠️ Please fill all QR fields.');
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
        toast.warning('⚠️ Label must be unique for each location.');
        return;
      }

      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ label: qrLabel })
        .eq('id', existingCode.id);

      if (!updateError) {
        toast.success('✅ QR Code updated');
        setQrLabel('');
        setQrValue('');
        const { data: updatedQrList } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('location_id', selectedLocationId);
        setQrList(updatedQrList || []);
        return;
      } else {
        toast.error(`❌ ${updateError.message}`);
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
      toast.warning('⚠️ Label must be unique for each location.');
      return;
    }

    const { error } = await supabase.from('qr_codes').insert({
      location_id: selectedLocationId,
      label: qrLabel,
      code_value: qrValue,
    });
    if (!error) {
      toast.success('✅ QR Code added');
      setQrLabel('');
      setQrValue('');
      const { data: updatedQrList } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('location_id', selectedLocationId);
      setQrList(updatedQrList || []);
    } else {
      toast.error(`❌ ${error.message}`);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="text-primary mb-3">Manage Locations & QR Codes</h3>

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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td>{loc.name}</td>
              <td>
                <button
                  className="btn btn-sm btn-secondary"
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
                        toast.info('Hold on! Deleting QR code...');
                        const { error } = await supabase
                          .from('qr_codes')
                          .delete()
                          .eq('id', qr.id);
                        if (!error) {
                          toast.success('✅ QR Code deleted');
                          setQrList(prev => prev.filter(item => item.id !== qr.id));
                        } else {
                          toast.error(`❌ ${error.message}`);
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
              win.document.write("<style>@media print { .qr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; page-break-inside: avoid; } .qr-item { text-align: center; margin-bottom: 20px; } }</style>");
              win.document.write('<div class="qr-grid">');
              selected.forEach(qr => {
                win.document.write(`
                  <div class='qr-item'>
                    <h5 style="margin-bottom: 4px;">${qr.label}</h5>
                    <img src='https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qr.code_value)}' alt='${qr.label}' /><div style="margin-top: 4px;"><small>${locations.find(loc => loc.id === qr.location_id)?.name || ''}</small></div>
                  </div>
                `);
              });
              win.document.write('</div>');
              win.document.write('</body></html>');
              win.document.close();
              win.focus();

              const images = win.document.images;
              let loadedCount = 0;

              for (let i = 0; i < images.length; i++) {
                images[i].onload = () => {
                  loadedCount++;
                  if (loadedCount === images.length) {
                    win.print();
                    win.close();
                  }
                };
              }

              // fallback if images never fire onload
              setTimeout(() => {
                win.print();
                win.close();
              }, 3000);
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

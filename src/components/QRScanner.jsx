import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const QRScanner = () => {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const html5QrCodeRef = useRef(null);
  const streamTrackRef = useRef(null);
  const isRunningRef = useRef(false);

  // 🔄 Load last 10 scans from Supabase
  const loadRecentScans = async () => {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (!error) {
      setScanHistory(data);
    } else {
      console.error('Error loading scans:', error.message);
    }
  };

  useEffect(() => {
    loadRecentScans(); // Load on page load
  }, []);

  const startScanner = async () => {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      const backCamera = devices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera ? backCamera.id : devices[0].id;

      html5QrCode
        .start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (decodedText !== result) {
              setResult(decodedText);

              // 🔊 Play beep sound
              const beep = new Audio('/beep.mp3');
              beep.play();

              // 💾 Save to Supabase
              const { error } = await supabase.from('scans').insert({
                code: decodedText,
                timestamp: new Date().toISOString()
              });

              if (error) {
                console.error('❌ Supabase insert error:', error);
                setMessage('❌ Error saving scan: ' + error.message);
              } else {
                setMessage('✅ Scan saved');
                await loadRecentScans(); // 🔄 Refresh scan history
                await stopScanner();     // 🛑 Stop scanner
              }
            }
          },
          (errorMessage) => {
            console.warn('Scan error:', errorMessage);
          }
        )
        .then(() => {
          isRunningRef.current = true;
          setIsScanning(true);

          const track = html5QrCode.getRunningTrack();
          if (track && typeof track.applyConstraints === 'function') {
            streamTrackRef.current = track;
          }
        })
        .catch(err => {
          console.error('Camera start error:', err);
          setMessage('❌ Failed to start camera');
        });
    } else {
      setMessage('❌ No cameras found');
    }
  };

  const stopScanner = async () => {
    if (isRunningRef.current && html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        isRunningRef.current = false;
        setIsScanning(false);
        setFlashOn(false);
        setMessage('✅ Scanner stopped');
      } catch (err) {
        console.warn('Stop error:', err.message);
        setMessage('❌ Error stopping scanner');
      }
    }
  };

  const toggleFlashlight = async () => {
    if (!streamTrackRef.current) {
      setMessage('⚠️ Flash not supported or scanner not running');
      return;
    }

    try {
      await streamTrackRef.current.applyConstraints({
        advanced: [{ torch: !flashOn }]
      });
      setFlashOn(!flashOn);
      setMessage(!flashOn ? '🔦 Flashlight turned ON' : '💡 Flashlight turned OFF');
    } catch (err) {
      console.warn('Flashlight error:', err.message);
      setMessage('❌ Flashlight not supported');
    }
  };

  return (
    <div>
      <h2>QR Scanner</h2>

      {!isScanning && (
        <button onClick={startScanner} style={{ marginRight: '10px' }}>
          Start Scan
        </button>
      )}

      {isScanning && (
        <>
          <button onClick={stopScanner} style={{ marginRight: '10px' }}>
            Cancel Scan
          </button>
          <button onClick={toggleFlashlight}>
            {flashOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
          </button>
        </>
      )}

      <div id="reader" style={{ width: '100%', maxWidth: 400, marginTop: '15px' }}></div>

      <p><strong>Scanned Code:</strong> {result}</p>
      <p>{message}</p>

      <hr />
      <h3>📜 Last 10 Scans</h3>
      <ul>
        {scanHistory.map(scan => (
          <li key={scan.id}>
            <strong>{scan.code}</strong> <br />
            <small>{new Date(scan.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QRScanner;

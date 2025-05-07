import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const QRScanner = () => {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const html5QrCodeRef = useRef(null);
  const isLocked = useRef(false);
  const idleTimer = useRef(null);

  const loadRecentScans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);
    setScanHistory(data || []);
  };

  useEffect(() => {
    loadRecentScans();
    setupIdleTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      removeActivityListeners();
    };
  }, []);

  const setupIdleTimer = () => {
    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousemove', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
  };

  const removeActivityListeners = () => {
    const events = ['mousemove', 'keydown', 'touchstart'];
    events.forEach(event => window.removeEventListener(event, setupIdleTimer));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const startScanner = async () => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(() => {});
      await html5QrCodeRef.current.clear().catch(() => {});
      html5QrCodeRef.current = null;
    }

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User at startScanner:", user);

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: 250 },
        async (decodedText) => {
          console.log("Detected QR:", decodedText);
          if (!isLocked.current) {
            isLocked.current = true;
            setResult(decodedText);
            new Audio('/beep.mp3').play();

            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('scans').insert({
              code: decodedText,
              timestamp: new Date().toISOString(),
              user_id: user.id
            });

            if (!error) {
              setMessage('✅ Scan saved');
              await stopScanner();
              await loadRecentScans();
            } else {
              console.error("Insert error:", error.message);
              setMessage('❌ ' + error.message);
            }
          }
        },
        (errorMessage) => {
          // console.warn(errorMessage); // optional: log scan failures
        }
      );
      setIsScanning(true);
    } catch (err) {
      setMessage("❌ Failed to start camera: " + err.message);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      html5QrCodeRef.current = null;
    }

    isLocked.current = false;
    setIsScanning(false);
    setResult('');
    setMessage('🛑 Scanner stopped.');
  };

  return (
    <div className="container mt-4">
      <div className="card p-4 mb-4">
        {!isScanning && (
          <button className="btn btn-success w-100 mb-2" onClick={startScanner}>
            Start Scan
          </button>
        )}
        {isScanning && (
          <button className="btn btn-danger w-100 mb-2" onClick={stopScanner}>
            Stop Scan
          </button>
        )}
        <div
          id="reader"
          className="border border-secondary rounded my-3"
          style={{ width: '100%', height: '400px' }}
        />
        {result && <p className="text-success fw-bold">Scanned: {result}</p>}
        {message && <p className="text-muted">{message}</p>}
      </div>

      <div className="card p-4">
        <h5 className="mb-3">Recent Scans</h5>
        <ul className="list-group">
          {scanHistory.map(scan => (
            <li key={scan.id} className="list-group-item">
              <div className="fw-bold">{scan.code}</div>
              <small className="text-muted">{new Date(scan.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;

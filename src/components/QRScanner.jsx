import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const QRScanner = () => {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const html5QrCodeRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;

        html5QrCode
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              if (decodedText !== result) {
                setResult(decodedText);

                // Log to Supabase
                const { error } = await supabase.from('scans').insert({
                  code: decodedText,
                  timestamp: new Date().toISOString()
                });

                setMessage(error ? '❌ Error saving scan' : '✅ Scan saved');
              }
            },
            (errorMessage) => {
              console.warn('Scan error:', errorMessage);
            }
          )
          .then(() => {
            isRunningRef.current = true;
          })
          .catch(err => {
            console.error('Failed to start camera:', err);
            setMessage('❌ Failed to start camera');
          });
      } else {
        setMessage('❌ No cameras found');
      }
    });

    // Cleanup on component unmount
    return () => {
      if (isRunningRef.current && html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current.clear();
          })
          .catch((err) => {
            console.warn('Stop error:', err.message);
          });
      }
    };
  }, [result]);

  return (
    <div>
      <h2>QR Scanner</h2>
      <div id="reader" style={{ width: '100%', maxWidth: 400 }}></div>
      <p><strong>Scanned Code:</strong> {result}</p>
      <p>{message}</p>
    </div>
  );
};

export default QRScanner;

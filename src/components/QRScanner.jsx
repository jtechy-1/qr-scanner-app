import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const QRScanner = () => {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const html5QrCodeRef = useRef(null);
  const streamTrackRef = useRef(null);
  const isRunningRef = useRef(false);

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
          setIsScanning(true);

          // Save MediaStreamTrack to control torch
          const tracks = html5QrCode.getRunningTrack();
          if (tracks && typeof tracks.applyConstraints === 'function') {
            streamTrackRef.current = tracks;
          }
        })
        .catch(err => {
          console.error('Failed to start camera:', err);
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
    </div>
  );
};

export default QRScanner;

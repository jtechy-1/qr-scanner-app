import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    // Step 1: Check if email + code exists in allowed_emails table
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .eq('email', email)
      .eq('invite_code', code)
      .single();

    if (error || !data) {
      setMessage('❌ Invalid email or invite code.');
      return;
    }

    // Step 2: If allowed, send magic link
    const { error: authError } = await supabase.auth.signInWithOtp({ email });

    if (authError) {
      setMessage('❌ ' + authError.message);
    } else {
      setMessage('📧 Check your email for the login link.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Request Login Link</h2>
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
      />
      <br />
      <input
        type="password"
        placeholder="Enter invite code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        Send Magic Link
      </button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
};

export default Login;

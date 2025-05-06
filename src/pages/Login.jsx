import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage('❌ ' + error.message);
    } else {
      setMessage('✅ Logged in!');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Login with Email & Password</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        Log In
      </button>
      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
};

export default Login;

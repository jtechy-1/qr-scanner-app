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
    <div className="container">
      <div className="card">
        <h2>Login with Email & Password</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Log In</button>
        {message && <p style={{ marginTop: '15px' }}>{message}</p>}
      </div>
    </div>
  );
};

export default Login;

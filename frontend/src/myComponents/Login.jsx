
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const createCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState(createCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;

  const getErrorMessage = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
    if (Array.isArray(data.errors) && data.errors.length > 0 && data.errors[0]?.msg) {
      return data.errors[0].msg;
    }
    return fallback;
  };
  
  const handleSignUp = async (e) =>{
    e.preventDefault();
    navigate("/createuser");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo('');

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('Captcha code does not match. Please try again.');
      setCaptchaInput('');
      setCaptchaCode(createCaptcha());
      return;
    }

    if (!apiUrl) {
      setError('API URL missing. Set REACT_APP_API_URL in frontend/.env.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Login failed'));
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user?.id || '');
      navigate('/');
    } catch (error) {
      setError(error.message);
      setCaptchaCode(createCaptcha());
      setCaptchaInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-backdrop-shape login-backdrop-shape--one" aria-hidden="true"></div>
        <div className="login-backdrop-shape login-backdrop-shape--two" aria-hidden="true"></div>

        <div className="login-shell">
          <section className="login-brand-panel" aria-label="Portal introduction">
            <p className="login-kicker">Equal Portal</p>
            <h1>Welcome back.</h1>
            <p className="login-subtitle">
              Sign in to share updates, connect with your network, and continue where you left off.
            </p>
            <ul className="login-bullets">
              <li>Personalized feed and conversations</li>
              <li>Fast posting with media support</li>
              <li>Secure session with account recovery</li>
            </ul>
          </section>

          <section className="login-card" aria-label="Login form">
            <h2>Sign in</h2>
            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-info">{info}</p>}

            <form onSubmit={handleLogin} className="login-form">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <label htmlFor="captchaInput">Captcha</label>
              <div className="login-captcha-wrap">
                <div className="login-captcha-code" aria-live="polite">
                  {captchaCode}
                </div>
                <button
                  type="button"
                  className="login-captcha-refresh"
                  onClick={() => {
                    setCaptchaCode(createCaptcha());
                    setCaptchaInput('');
                  }}
                >
                  New code
                </button>
              </div>
              <input
                id="captchaInput"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha code"
                autoComplete="off"
                required
              />

              <button type="submit" className="login-button login-button--primary" disabled={isLoading}>
                {isLoading ? "Please wait..." : "Sign in"}
              </button>
              <button type="button" className="login-button login-button--secondary" onClick={handleSignUp}>
                Create account
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default Login;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://equalportal.onrender.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store the token in localStorage and navigate to homepage
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
    <div className='homepage-container'>
       <nav className="navbar">
         <div className="logo-container"></div>
       </nav>
      <div className='container'>
        <p style={{color :"green"}}>Website still under development, i still have add createUser component. But i did make some accounts using Testing tools. </p>
        <p>Please use :New1@mail.com password:qwerty</p>
        <h1>Login</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className='button'>Login</button>
        </form>
      </div>
      
    </div>
    </>
  );
};

export default Login;

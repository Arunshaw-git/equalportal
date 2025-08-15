
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;
  
  const handleSignUp = async (e) =>{
    e.preventDefault();
    navigate("/createUser")
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Add this line

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store the token in localStorage and navigate to homepage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user?.id || '');
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <nav className="navbar">
         <div className="logo-container"></div>
       </nav>
    <div className='homepage-container'>
       
      <div className='container'>
        <p style={{color :"green"}}> Please reload the page if login takes too long and try again. </p>
        <h1>Login</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit} >
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
          <button type="submit" className='button'>
          {isLoading ? "Logining..." : "Login"}
          </button>
          <button  className="signUp" onClick={handleSignUp}>
            Sign Up
          </button>
        </form>
      </div>
      
    </div>
    </>
  );
};

export default Login;

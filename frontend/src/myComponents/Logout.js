import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Remove token from local storage
        localStorage.removeItem('token');

        // Optionally, clear any user data stored in state management (like Redux or Context API)

        // Redirect to login or homepage
        navigate('/login'); // Change this to your desired route
    };

    return (
        <button style={{backgroundColor:"red"}} onClick={handleLogout} className="profile-button" >Logout</button>
    );
};

export default Logout;

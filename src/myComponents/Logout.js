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
        <button onClick={handleLogout} style={{color: 'white', backgroundColor : "#7E0000", borderRadius :"5px", cursor: "pointer", border: "none", padding:"5px 10px", fontSize:"16px", marginRight: "20px"}} >Logout</button>
    );
};

export default Logout;

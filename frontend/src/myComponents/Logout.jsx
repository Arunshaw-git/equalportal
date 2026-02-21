import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import "../styles/ProfileBtn.css";

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
        <button onClick={handleLogout} className="profile-button" >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Logout</span>
        </button>
    );
};

export default Logout;

// frontend/src/myComponents/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faSearch, 
  faPlusSquare, 
  faUser 
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { icon: faHouse, text: 'Home', path: '/' },
    { icon: faSearch, text: 'Search', path: '/search' },
    { icon: faPlusSquare, text: 'Create', path: '/create' },
  
    { icon: faUser, text: 'Profile', path: '/profile' }
  ];
 

  return (
    <div className={`sidebar`}>
      <div className="sidebar-content">
        <nav className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.text}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} className="nav-icon" />
              <span className="nav-text">{item.text}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
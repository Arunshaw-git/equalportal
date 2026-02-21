// frontend/src/myComponents/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faSearch, 
  faPlusSquare, 
  faUser,
  faFire,
  faBell,
  faEnvelope,
  faBookmark,
  faUsers,
  faGear,
  faCircleQuestion,
  faEllipsis
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const primaryNavItems = [
    { icon: faHouse, text: 'Home', path: '/' },
    { icon: faSearch, text: 'Search', path: '/search' },
    { icon: faPlusSquare, text: 'Create', path: '/create' },
    { icon: faUser, text: 'Profile', path: '/profile' }
  ];

  const secondaryNavItems = [
    { icon: faFire, text: 'Trending', path: '/trending' },
    { icon: faBell, text: 'Notifications', path: '/notifications' },
    { icon: faEnvelope, text: 'Messages', path: '/messages' },
    { icon: faBookmark, text: 'Bookmarks', path: '/bookmarks' },
    { icon: faUsers, text: 'Following', path: '/following' },
    { icon: faGear, text: 'Settings', path: '/settings' },
    { icon: faCircleQuestion, text: 'Help', path: '/help' }
  ];

  const isActiveItem = (itemPath) => {
    if (itemPath === '/') return location.pathname === '/';
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };
 

  return (
    <div className={`sidebar`}>
      <div className="sidebar-content">
        <nav className="nav-menu">
          {primaryNavItems.map((item) => (
            <Link
              key={item.text}
              to={item.path}
              className={`nav-item ${isActiveItem(item.path) ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} className="nav-icon" />
              <span className="nav-text">{item.text}</span>
            </Link>
          ))}

          <button
            type="button"
            className={`nav-item nav-more-toggle ${showMore ? 'active' : ''}`}
            onClick={() => setShowMore((prev) => !prev)}
            aria-expanded={showMore}
            aria-label="More features"
          >
            <span className="nav-more-box">
              <FontAwesomeIcon icon={faEllipsis} className="nav-icon" />
            </span>
            <span className="nav-text nav-more-label">More</span>
          </button>

          {showMore &&
            secondaryNavItems.map((item) => (
              <Link
                key={item.text}
                to={item.path}
                className={`nav-item nav-item-secondary ${
                  isActiveItem(item.path) ? 'active' : ''
                }`}
                onClick={() => setShowMore(false)}
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

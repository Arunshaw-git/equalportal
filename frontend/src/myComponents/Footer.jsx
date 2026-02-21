import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fullWidthRoutes = ["/login", "/createuser", "/create"];
  const isFullWidthFooter = fullWidthRoutes.includes(location.pathname);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <footer className={`footer ${isFullWidthFooter ? "footer--full" : ""}`}>
      <div className="footer-shell">
        <div className="footer-brand">
          <p className="footer-kicker">Equal Portal</p>
          <h3>Built for meaningful stories and accountable dialogue.</h3>
          <p>A community platform for meaningful stories, dialogue, and action.</p>
        </div>

        <nav className="footer-links" aria-label="Footer links">
          <button type="button" className="footer-back-btn" onClick={handleGoBack}>
            &lt; Back
          </button>
          <Link to="/help">Help Center</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/profile">Profile</Link>
        </nav>

        <p className="footer-note">Copyright {new Date().getFullYear()} Equal Portal. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

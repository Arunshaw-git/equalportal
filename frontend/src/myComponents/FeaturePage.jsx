import React from "react";
import Sidebar from "./Sidebar";
import Logout from "./Logout";
import "../styles/FeaturePage.css";

const FeaturePage = ({ title, description }) => {
  return (
    <>
      <nav className="feature-navbar">
        <div className="feature-logo" />
        <div className="feature-actions">
          <span className="feature-pill">Live feed</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <main className="feature-page">
        <section className="feature-card">
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
      </main>
    </>
  );
};

export default FeaturePage;

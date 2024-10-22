import './App.css';
import Homepage from './myComponents/Homepage'; // Example import of your homepage
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './myComponents/Login'; // Example import of your homepage
import CreatePost from './myComponents/CreatePost'; // Example import of your homepage
import Footer from './myComponents/Footer'; // Import your Footer component


function App() {
  return (
    <Router>
      <div className="app-container"> 
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreatePost />} />
        </Routes>
        <Footer/>
      </div>

    </Router>
  );
}

export default App;

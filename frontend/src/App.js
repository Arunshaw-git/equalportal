import './App.css';
import Homepage from './myComponents/Homepage'; // Example import of your homepage
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './myComponents/Login'; // Example import of your homepage
import CreatePost from './myComponents/CreatePost'; 
import Footer from './myComponents/Footer'; 
import CreateUser from './myComponents/CreateUser';
import Profile from './myComponents/Profile';

function App() {
  return (
    <Router>
      <div className="app-container"> 
        <Routes>
          <Route path="/createuser" element={<CreateUser />}/>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Footer/>
      </div>

    </Router>
  );
}

export default App;

import "./App.css";
import Homepage from "./myComponents/Homepage"; // Example import of your homepage
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./myComponents/Login"; // Example import of your homepage
import CreatePost from "./myComponents/CreatePost";
import Footer from "./myComponents/Footer";
import CreateUser from "./myComponents/CreateUser";
import Profile from "./myComponents/Profile";
import Convo from "./myComponents/Convo";
import { PostsProvider } from "./contexts/PostsContext";

function App() {
  return (
    <Router>
      <PostsProvider>
        <div className="app-container">
          <Routes>
            <Route path="/createuser" element={<CreateUser />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/profile/:id?" element={<Profile />} />

            <Route path="/login" element={<Login />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/:user1/:user2" element={<Convo/>}></Route>
          </Routes>
          <Footer />
        </div>
      </PostsProvider>
    </Router>
  );
}
export default App;

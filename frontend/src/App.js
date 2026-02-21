import "./App.css";
import Homepage from "./myComponents/Homepage"; // Example import of your homepage
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./myComponents/Login"; // Example import of your homepage
import CreatePost from "./myComponents/CreatePost";
import Footer from "./myComponents/Footer";
import CreateUser from "./myComponents/CreateUser";
import Profile from "./myComponents/Profile";
import Convo from "./myComponents/Convo";
import FeaturePage from "./myComponents/FeaturePage";
import SearchPage from "./myComponents/SearchPage";
import MessagesPage from "./myComponents/MessagesPage";
import SettingsPage from "./myComponents/SettingsPage";
import { PostsProvider } from "./contexts/PostsContext";
import { UserProvider } from "./contexts/ProfileUser";

function App() {
  return (
    <Router>
      <UserProvider>
        <PostsProvider>
          <div className="app-container">
            <Routes>
              <Route path="/createuser" element={<CreateUser />} />
              <Route path="/" element={<Homepage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route
                path="/trending"
                element={
                  <FeaturePage
                    title="Trending"
                    description="See posts ranked by engagement and current momentum."
                  />
                }
              />
              <Route
                path="/notifications"
                element={
                  <FeaturePage
                    title="Notifications"
                    description="Track likes, comments, mentions, and follow activity in one place."
                  />
                }
              />
              <Route
                path="/messages"
                element={<MessagesPage />}
              />
              <Route
                path="/bookmarks"
                element={
                  <FeaturePage
                    title="Bookmarks"
                    description="Save important posts and come back to them anytime."
                  />
                }
              />
              <Route
                path="/following"
                element={
                  <FeaturePage
                    title="Following"
                    description="Read updates from people and topics you follow."
                  />
                }
              />
              <Route path="/profile/:id?" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/help"
                element={
                  <FeaturePage
                    title="Help"
                    description="Get support, report issues, and learn platform guidelines."
                  />
                }
              />

              <Route path="/login" element={<Login />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/:user1/:user2" element={<Convo />}></Route>
            </Routes>
            <Footer />
          </div>
        </PostsProvider>
      </UserProvider>
    </Router>
  );
}
export default App;

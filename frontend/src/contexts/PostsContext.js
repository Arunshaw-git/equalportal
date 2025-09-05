import { useState, createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const PostsContext = createContext();

export const PostsProvider = ({ children }) => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("Token not provided while fetching posts context");
        
        return; // Prevent fetching posts without a token
      }
      
      try {
        const response = await fetch(`${apiUrl}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401 ) { 
          localStorage.removeItem("token"); 
          navigate("/login"); // redirect to login
        }

        const data = await response.json();
        console.log(data);
        setPosts(data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
        console.error("Errow while fetching posts :", error);
      }
    };
    fetchPosts();
  }, [apiUrl, navigate]);

  return (
    <PostsContext.Provider
      value={{
        posts,
        loading,
        error,
        setError,
        setPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};
export const usePosts = () => useContext(PostsContext);

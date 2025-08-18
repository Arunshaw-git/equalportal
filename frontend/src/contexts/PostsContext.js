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
        console.error("Token not provided while fetching posts");
        navigate("/login"); // Redirect to login page if no token is found
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
        if (!response.ok) {
          const errorData = await response.json(); // Attempt to parse the response as JSON
          throw new Error(errorData.error || "Failed to fetch posts");
        }

        const data = await response.json();
        console.log(data);
        setPosts(data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
        console.error("Internal sever error ", error);
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

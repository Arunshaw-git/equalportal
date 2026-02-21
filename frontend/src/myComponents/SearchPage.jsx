import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Logout from "./Logout";
import "../styles/SearchPage.css";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState({ users: [], posts: [] });
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const hasResults = searchData.users.length > 0 || searchData.posts.length > 0;

  const buildFallbackResultsFromPosts = (posts, rawQuery) => {
    const normalized = rawQuery.toLowerCase();
    const safePosts = Array.isArray(posts) ? posts : [];

    const filteredPosts = safePosts.filter((post) => {
      const title = String(post?.title || "").toLowerCase();
      const desc = String(post?.desc || "").toLowerCase();
      return title.includes(normalized) || desc.includes(normalized);
    });

    const userMap = new Map();
    safePosts.forEach((post) => {
      const author = post?.author;
      if (!author?._id) return;
      const joined = `${author?.name || ""} ${author?.userName || ""}`.toLowerCase();
      if (joined.includes(normalized)) {
        userMap.set(author._id, {
          _id: author._id,
          name: author.name || "Unknown",
          userName: author.userName || "user",
          email: author.email || "",
          profilePicture: author.profilePicture || "",
        });
      }
    });

    return {
      users: Array.from(userMap.values()),
      posts: filteredPosts,
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchData({ users: [], posts: [] });
      setError("");
      return;
    }

    const controller = new AbortController();
    const token = localStorage.getItem("token");
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const baseApiUrl = apiUrl || "http://localhost:5001";
        const response = await fetch(`${baseApiUrl}/search?q=${encodeURIComponent(trimmed)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed (${response.status})`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Search endpoint returned non-JSON response");
        }

        const data = await response.json();
        setSearchData({
          users: Array.isArray(data.users) ? data.users : [],
          posts: Array.isArray(data.posts) ? data.posts : [],
        });
      } catch (searchError) {
        if (searchError.name !== "AbortError") {
          try {
            const baseApiUrl = apiUrl || "http://localhost:5001";
            const fallbackResponse = await fetch(`${baseApiUrl}/`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            });

            if (!fallbackResponse.ok) {
              throw new Error(`Fallback failed (${fallbackResponse.status})`);
            }

            const fallbackPosts = await fallbackResponse.json();
            const fallbackData = buildFallbackResultsFromPosts(fallbackPosts, trimmed);
            setSearchData(fallbackData);
            setError("");
          } catch (fallbackError) {
            console.error("Search error:", searchError);
            console.error("Fallback search error:", fallbackError);
            setError("Unable to search right now.");
          }
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [apiUrl, query]);

  const filteredUsers = useMemo(
    () => (activeTab === "posts" ? [] : searchData.users),
    [activeTab, searchData.users]
  );
  const filteredPosts = useMemo(
    () => (activeTab === "users" ? [] : searchData.posts),
    [activeTab, searchData.posts]
  );

  return (
    <>
      <nav className="search-navbar">
        <div className="search-logo" />
        <div className="search-actions">
          <span className="search-pill">Search</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <main className="search-page">
        <section className="search-card">
          <h1>Search</h1>
          <p>Find posts, people, and topics across Equal Portal.</p>

          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="Search posts, users, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="search-tabs">
            <button
              type="button"
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              type="button"
              className={activeTab === "posts" ? "active" : ""}
              onClick={() => setActiveTab("posts")}
            >
              Posts
            </button>
            <button
              type="button"
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          </div>

          {loading && <p className="search-state">Searching...</p>}
          {error && <p className="search-error">{error}</p>}
          {!loading && query.trim() && !hasResults && !error && (
            <p className="search-state">No results found for "{query.trim()}".</p>
          )}
        </section>

        {!loading && hasResults && (
          <section className="search-results">
            {filteredUsers.length > 0 && (
              <div className="search-block">
                <h2>Users ({filteredUsers.length})</h2>
                <div className="result-grid">
                  {filteredUsers.map((user) => (
                    <article key={user._id} className="result-card user-card">
                      <img
                        src={user.profilePicture || "https://via.placeholder.com/70?text=User"}
                        alt={user.name || "User"}
                      />
                      <div>
                        <h3>{user.name}</h3>
                        <p>@{user.userName}</p>
                        {user.email && <p>{user.email}</p>}
                      </div>
                      <Link to={`/profile/${user._id}`}>View Profile</Link>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {filteredPosts.length > 0 && (
              <div className="search-block">
                <h2>Posts ({filteredPosts.length})</h2>
                <div className="result-grid">
                  {filteredPosts.map((post) => (
                    <article key={post._id} className="result-card post-card">
                      <h3>{post.title}</h3>
                      <p>{post.desc}</p>
                      <div className="post-meta">
                        <span>By {post.author?.name || "Unknown"}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      {post.author?._id && <Link to={`/profile/${post.author._id}`}>Go to Author</Link>}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
};

export default SearchPage;

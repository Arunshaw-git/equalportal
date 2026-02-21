import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Logout from "./Logout";
import "../styles/SettingsPage.css";

const defaultAccount = {
  name: "",
  userName: "",
  email: "",
  phoneNumber: "",
  gender: "",
  profilePicture: "",
};

const defaultPrivacy = {
  privateProfile: false,
  showEmail: false,
  showPhone: false,
};

const defaultNotifications = {
  inApp: true,
  email: true,
  mentions: true,
};

const defaultPreferences = {
  compactMode: false,
  reduceMotion: false,
  contentLanguage: "English",
};

const defaultSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const defaultUsernameForm = {
  newUserName: "",
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [account, setAccount] = useState(defaultAccount);
  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [security, setSecurity] = useState(defaultSecurity);
  const [usernameForm, setUsernameForm] = useState(defaultUsernameForm);
  const [saving, setSaving] = useState({
    account: false,
    username: false,
    privacy: false,
    notifications: false,
    preferences: false,
    security: false,
  });
  const [messages, setMessages] = useState({
    account: "",
    username: "",
    privacy: "",
    notifications: "",
    preferences: "",
    security: "",
  });

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const updateMessage = (section, message = "") => {
    setMessages((prev) => ({ ...prev, [section]: message }));
  };

  useEffect(() => {
    document.documentElement.dataset.compact = preferences.compactMode ? "true" : "false";
    if (preferences.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    localStorage.setItem("compactMode", preferences.compactMode ? "1" : "0");
    localStorage.setItem("reduceMotion", preferences.reduceMotion ? "1" : "0");

    return () => {
      document.documentElement.classList.remove("reduce-motion");
      delete document.documentElement.dataset.compact;
    };
  }, [preferences.compactMode, preferences.reduceMotion]);

  const extractError = async (response, fallback) => {
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (typeof data?.error === "string" && data.error.trim()) return data.error;
        if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;
      } else {
        const text = await response.text();
        if (
          text.includes("Cannot GET /settings") ||
          text.includes("Cannot PATCH /settings") ||
          text.includes("Cannot PATCH /settings/")
        ) {
          return "Settings API is not available on backend. Restart backend server.";
        }
        if (text) return text;
      }
    } catch {
      // Ignore parsing errors and use fallback
    }
    return fallback;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const headers = authHeaders();
      if (!headers) {
        navigate("/login");
        return;
      }

      if (!apiUrl) {
        setIsLoading(false);
        setError("API URL missing. Set REACT_APP_API_URL in frontend/.env.");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/settings`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const message = await extractError(response, "Unable to load settings");

          if (message.includes("Settings API is not available")) {
            const profileResponse = await fetch(`${apiUrl}/profile`, {
              method: "GET",
              headers,
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setAccount({
                name: profileData.name || "",
                userName: profileData.userName || "",
                email: profileData.email || "",
                phoneNumber: profileData.phoneNumber || "",
                gender: profileData.gender || "",
                profilePicture: profileData.profilePicture || "",
              });
            }
            setError(message);
            return;
          }

          throw new Error(message);
        }

        const data = await response.json();
        setAccount({
          name: data.name || "",
          userName: data.userName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          gender: data.gender || "",
          profilePicture: data.profilePicture || "",
        });
        setUsernameForm({ newUserName: data.userName || "" });
        setPrivacy({
          privateProfile: Boolean(data.settings?.privacy?.privateProfile),
          showEmail: Boolean(data.settings?.privacy?.showEmail),
          showPhone: Boolean(data.settings?.privacy?.showPhone),
        });
        setNotifications({
          inApp: data.settings?.notifications?.inApp !== false,
          email: data.settings?.notifications?.email !== false,
          mentions: data.settings?.notifications?.mentions !== false,
        });
        setPreferences({
          compactMode: Boolean(data.settings?.preferences?.compactMode),
          reduceMotion: Boolean(data.settings?.preferences?.reduceMotion),
          contentLanguage: data.settings?.preferences?.contentLanguage || "English",
        });
        setError("");
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [apiUrl, navigate]);

  const saveSection = async (section, endpoint, payload, successMessage) => {
    const headers = authHeaders();
    if (!headers) {
      navigate("/login");
      return;
    }

    setSaving((prev) => ({ ...prev, [section]: true }));
    updateMessage(section, "");

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await extractError(response, `Failed to save ${section} settings`);
        throw new Error(message);
      }

      const data = await response.json();
      if (data?.settings) {
        setPrivacy({
          privateProfile: Boolean(data.settings?.privacy?.privateProfile),
          showEmail: Boolean(data.settings?.privacy?.showEmail),
          showPhone: Boolean(data.settings?.privacy?.showPhone),
        });
        setNotifications({
          inApp: data.settings?.notifications?.inApp !== false,
          email: data.settings?.notifications?.email !== false,
          mentions: data.settings?.notifications?.mentions !== false,
        });
        setPreferences({
          compactMode: Boolean(data.settings?.preferences?.compactMode),
          reduceMotion: Boolean(data.settings?.preferences?.reduceMotion),
          contentLanguage: data.settings?.preferences?.contentLanguage || "English",
        });
      }

      if (data?.user) {
        setAccount({
          name: data.user.name || "",
          userName: data.user.userName || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          gender: data.user.gender || "",
          profilePicture: data.user.profilePicture || "",
        });
        setUsernameForm({ newUserName: data.user.userName || "" });
      }

      updateMessage(section, successMessage);
      setError("");
    } catch (saveError) {
      updateMessage(section, saveError.message || `Failed to save ${section}`);
    } finally {
      setSaving((prev) => ({ ...prev, [section]: false }));
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();

    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      updateMessage("security", "Fill all password fields");
      return;
    }

    if (security.newPassword.length < 6) {
      updateMessage("security", "New password must be at least 6 characters");
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      updateMessage("security", "New password and confirm password do not match");
      return;
    }

    await saveSection(
      "security",
      "/settings/password",
      { currentPassword: security.currentPassword, newPassword: security.newPassword },
      "Password updated successfully"
    );
    setSecurity(defaultSecurity);
  };

  const handleUsernameSave = async () => {
    const nextUserName = String(usernameForm.newUserName || "").trim();
    if (nextUserName.length < 4) {
      updateMessage("username", "Username must be at least 4 characters");
      return;
    }

    if (nextUserName === account.userName) {
      updateMessage("username", "New username is same as current username");
      return;
    }

    await saveSection(
      "username",
      "/settings/account",
      { userName: nextUserName },
      "Username updated successfully"
    );
  };

  if (isLoading) {
    return <p className="settings-loading">Loading settings...</p>;
  }

  return (
    <>
      <nav className="feature-navbar">
        <div className="feature-logo" />
        <div className="feature-actions">
          <span className="feature-pill">Account control</span>
          <Logout />
        </div>
      </nav>

      <Sidebar />

      <main className="settings-page">
        <section className="settings-hero">
          <h1>Settings</h1>
          <p>Manage account, privacy, notifications, and preferences.</p>
        </section>

        {error && <div className="settings-error">{error}</div>}

        <section className="settings-grid">
          <article className="settings-card">
            <div className="settings-head">
              <h2>Change Username</h2>
              <button
                type="button"
                className="settings-save-btn"
                disabled={saving.username}
                onClick={handleUsernameSave}
              >
                {saving.username ? "Saving..." : "Save Username"}
              </button>
            </div>
            <label>
              Current Username
              <input type="text" value={account.userName} readOnly />
            </label>
            <label>
              New Username
              <input
                type="text"
                value={usernameForm.newUserName}
                onChange={(e) =>
                  setUsernameForm((prev) => ({ ...prev, newUserName: e.target.value }))
                }
                placeholder="Enter new username"
              />
            </label>
            {messages.username && <p className="settings-message">{messages.username}</p>}
          </article>

          <article className="settings-card settings-card-wide">
            <div className="settings-head">
              <h2>Account Information</h2>
              <button
                type="button"
                className="settings-save-btn"
                disabled={saving.account}
                onClick={() =>
                  saveSection(
                    "account",
                    "/settings/account",
                    account,
                    "Account details updated"
                  )
                }
              >
                {saving.account ? "Saving..." : "Save Account"}
              </button>
            </div>
            <div className="settings-form-grid">
              <label>
                Full Name
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => setAccount((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label>
                Username
                <input
                  type="text"
                  value={account.userName}
                  onChange={(e) => setAccount((prev) => ({ ...prev, userName: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={account.email}
                  onChange={(e) => setAccount((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  type="text"
                  value={account.phoneNumber}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                />
              </label>
              <label>
                Gender
                <select
                  value={account.gender}
                  onChange={(e) => setAccount((prev) => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                Profile Image URL
                <input
                  type="text"
                  value={account.profilePicture}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, profilePicture: e.target.value }))
                  }
                />
              </label>
            </div>
            {messages.account && <p className="settings-message">{messages.account}</p>}
          </article>

          <article className="settings-card">
            <div className="settings-head">
              <h2>Privacy</h2>
              <button
                type="button"
                className="settings-save-btn"
                disabled={saving.privacy}
                onClick={() =>
                  saveSection(
                    "privacy",
                    "/settings/privacy",
                    privacy,
                    "Privacy settings updated"
                  )
                }
              >
                {saving.privacy ? "Saving..." : "Save Privacy"}
              </button>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={privacy.privateProfile}
                onChange={(e) =>
                  setPrivacy((prev) => ({ ...prev, privateProfile: e.target.checked }))
                }
              />
              <span>Private profile</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={privacy.showEmail}
                onChange={(e) => setPrivacy((prev) => ({ ...prev, showEmail: e.target.checked }))}
              />
              <span>Show email on profile</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={privacy.showPhone}
                onChange={(e) => setPrivacy((prev) => ({ ...prev, showPhone: e.target.checked }))}
              />
              <span>Show phone on profile</span>
            </label>
            {messages.privacy && <p className="settings-message">{messages.privacy}</p>}
          </article>

          <article className="settings-card">
            <div className="settings-head">
              <h2>Notifications</h2>
              <button
                type="button"
                className="settings-save-btn"
                disabled={saving.notifications}
                onClick={() =>
                  saveSection(
                    "notifications",
                    "/settings/notifications",
                    notifications,
                    "Notification settings updated"
                  )
                }
              >
                {saving.notifications ? "Saving..." : "Save Notifications"}
              </button>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.inApp}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, inApp: e.target.checked }))
                }
              />
              <span>In-app notifications</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, email: e.target.checked }))
                }
              />
              <span>Email notifications</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.mentions}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, mentions: e.target.checked }))
                }
              />
              <span>Mentions and replies</span>
            </label>
            {messages.notifications && (
              <p className="settings-message">{messages.notifications}</p>
            )}
          </article>

          <article className="settings-card">
            <div className="settings-head">
              <h2>Preferences</h2>
              <button
                type="button"
                className="settings-save-btn"
                disabled={saving.preferences}
                onClick={() =>
                  saveSection(
                    "preferences",
                    "/settings/preferences",
                    preferences,
                    "Preferences updated"
                  )
                }
              >
                {saving.preferences ? "Saving..." : "Save Preferences"}
              </button>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={preferences.compactMode}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, compactMode: e.target.checked }))
                }
              />
              <span>Compact feed mode</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, reduceMotion: e.target.checked }))
                }
              />
              <span>Reduce motion effects</span>
            </label>
            <label>
              Content Language
              <select
                value={preferences.contentLanguage}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, contentLanguage: e.target.value }))
                }
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </label>
            {messages.preferences && <p className="settings-message">{messages.preferences}</p>}
          </article>

          <article className="settings-card settings-card-wide">
            <div className="settings-head">
              <h2>Security</h2>
            </div>
            <form className="settings-form-grid security-form" onSubmit={handlePasswordSave}>
              <label>
                Current Password
                <input
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  autoComplete="current-password"
                />
              </label>
              <label>
                New Password
                <input
                  type="password"
                  value={security.newPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm New Password
                <input
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" className="settings-save-btn" disabled={saving.security}>
                {saving.security ? "Saving..." : "Change Password"}
              </button>
            </form>
            {messages.security && <p className="settings-message">{messages.security}</p>}
          </article>
        </section>
      </main>
    </>
  );
};

export default SettingsPage;

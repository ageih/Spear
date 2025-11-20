// src/pages/Settings.jsx
import React, { useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Setting.css";

function Settings({ currentUser, userPermissions }) {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    notifications: true,
    emailAlerts: true,
    autoSave: true,
    compactView: false,
    fontSize: "medium",
  });

  const [activeTab, setActiveTab] = useState("general");
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // In a real app, you would save to backend here
    console.log(`Setting changed: ${key} = ${value}`);
  };

  const handlePasswordChange = () => {
    const newPassword = prompt("Enter new password:");
    if (newPassword) {
      // In real app, call API to change password
      alert("Password change request sent!");
    }
  };

  const handleExportData = () => {
    // In real app, implement data export
    alert("Data export functionality would be implemented here");
  };

  const handleClearCache = () => {
    setShowClearCacheConfirm(true);
  };

  const confirmClearCache = () => {
    // In real app, clear cache
    alert("Cache cleared successfully");
    setShowClearCacheConfirm(false);
  };

  const cancelClearCache = () => {
    setShowClearCacheConfirm(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and application settings</p>
          </div>
          <div className="user-badge">
            <span
              className="user-level-badge"
              style={{ backgroundColor: userPermissions?.color }}
            >
              Level {currentUser?.cs_user_level} • {userPermissions?.name} •{" "}
              {currentUser.cs_user_department}
            </span>
          </div>
        </div>
      </div>

      {/* Clear Cache Confirmation Modal */}
      {showClearCacheConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Clear Cache?</h3>
            <p>
              Are you sure you want to clear all cached data? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={cancelClearCache}>
                Cancel
              </button>
              <button className="danger-button" onClick={confirmClearCache}>
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <div className="sidebar-section">
            <h4>Preferences</h4>
            <button
              className={`sidebar-tab ${
                activeTab === "general" ? "active" : ""
              }`}
              onClick={() => setActiveTab("general")}
            >
              General
            </button>
            <button
              className={`sidebar-tab ${
                activeTab === "appearance" ? "active" : ""
              }`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
            <button
              className={`sidebar-tab ${
                activeTab === "notifications" ? "active" : ""
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </button>
          </div>

          <div className="sidebar-section">
            <h4>Account</h4>
            <button
              className={`sidebar-tab ${
                activeTab === "security" ? "active" : ""
              }`}
              onClick={() => setActiveTab("security")}
            >
              Security
            </button>
            <button
              className={`sidebar-tab ${
                activeTab === "privacy" ? "active" : ""
              }`}
              onClick={() => setActiveTab("privacy")}
            >
              Privacy
            </button>
          </div>

          <div className="sidebar-section">
            <h4>System</h4>
            <button
              className={`sidebar-tab ${
                activeTab === "permissions" ? "active" : ""
              }`}
              onClick={() => setActiveTab("permissions")}
            >
              Permissions
            </button>
            <button
              className={`sidebar-tab ${activeTab === "data" ? "active" : ""}`}
              onClick={() => setActiveTab("data")}
            >
              Data Management
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="content-card">
              <h3>General Settings</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Language</label>
                    <p>Choose your preferred language</p>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) =>
                      handleSettingChange("language", e.target.value)
                    }
                    className="setting-control"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Auto-save</label>
                    <p>Automatically save your work</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) =>
                        handleSettingChange("autoSave", e.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Compact View</label>
                    <p>Use compact layout for better space utilization</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.compactView}
                      onChange={(e) =>
                        handleSettingChange("compactView", e.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="content-card">
              <h3>Appearance</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Theme</label>
                    <p>Choose your preferred theme</p>
                  </div>
                  <div className="theme-options">
                    {["light", "dark", "auto"].map((theme) => (
                      <label key={theme} className="theme-option">
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={settings.theme === theme}
                          onChange={(e) =>
                            handleSettingChange("theme", e.target.value)
                          }
                        />
                        <span className="theme-preview">
                          <span className={`theme-demo ${theme}`}></span>
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Font Size</label>
                    <p>Adjust the text size throughout the application</p>
                  </div>
                  <select
                    value={settings.fontSize}
                    onChange={(e) =>
                      handleSettingChange("fontSize", e.target.value)
                    }
                    className="setting-control"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="content-card">
              <h3>Notifications</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Push Notifications</label>
                    <p>Receive notifications for important updates</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        handleSettingChange("notifications", e.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email Alerts</label>
                    <p>Receive important updates via email</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) =>
                        handleSettingChange("emailAlerts", e.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="content-card">
              <h3>Security</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Password</label>
                    <p>Last changed: 2 weeks ago</p>
                  </div>
                  <button
                    className="primary-button"
                    onClick={handlePasswordChange}
                  >
                    Change Password
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Two-Factor Authentication</label>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="secondary-button">Enable 2FA</button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Session Management</label>
                    <p>View and manage active sessions</p>
                  </div>
                  <button className="secondary-button">Manage Sessions</button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <div className="content-card">
              <h3>Privacy Settings</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Data Collection</label>
                    <p>
                      Allow anonymous usage data collection to improve the app
                    </p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Profile Visibility</label>
                    <p>Control who can see your profile information</p>
                  </div>
                  <select className="setting-control" defaultValue="department">
                    <option value="public">Everyone</option>
                    <option value="department">My Department</option>
                    <option value="private">Only Me</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Activity Status</label>
                    <p>Show when you're active in the system</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Permissions Settings */}
          {activeTab === "permissions" && (
            <div className="content-card">
              <h3>Your Permissions</h3>
              <div className="permissions-overview">
                <div className="permission-level">
                  <div
                    className="level-badge"
                    style={{ backgroundColor: userPermissions?.color }}
                  >
                    {userPermissions?.icon} Level {currentUser?.cs_user_level}
                  </div>
                  <h4>{userPermissions?.name}</h4>
                  <p>Based on your position and department</p>
                </div>

                <div className="permissions-grid">
                  <div className="permission-category">
                    <h5>View Access</h5>
                    <div className="permission-tags">
                      {userPermissions?.canView?.map((permission, index) => (
                        <span key={index} className="permission-tag view-tag">
                          👁️ {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="permission-category">
                    <h5>Edit Access</h5>
                    <div className="permission-tags">
                      {userPermissions?.canEdit?.map((permission, index) => (
                        <span key={index} className="permission-tag edit-tag">
                          ✏️ {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="permission-category">
                    <h5>Available Features</h5>
                    <div className="permission-tags">
                      {userPermissions?.features?.map((feature, index) => (
                        <span
                          key={index}
                          className="permission-tag feature-tag"
                        >
                          ⭐ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === "data" && (
            <div className="content-card">
              <h3>Data Management</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Export Data</label>
                    <p>Download all your data in JSON format</p>
                  </div>
                  <button className="primary-button" onClick={handleExportData}>
                    Export My Data
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Clear Cache</label>
                    <p>Remove temporary files and free up space</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={handleClearCache}
                  >
                    Clear Cache
                  </button>
                </div>

                <div className="setting-item danger-zone">
                  <div className="setting-info">
                    <label className="danger-label">Delete Account</label>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <button className="danger-button" disabled>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;

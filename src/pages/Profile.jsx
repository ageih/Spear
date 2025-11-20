// src/pages/Profile.jsx
import React from "react";
import "../styles/Dashboard.css";

function Profile({ currentUser, userPermissions }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>
      <div className="content-card">
        <div className="profile-header">
          <div
            className="profile-avatar-large"
            style={{ backgroundColor: userPermissions?.color }}
          >
            {currentUser?.name.charAt(0)}
          </div>
          <div className="profile-info">
            <h2>{currentUser?.name}</h2>
            <p style={{ color: userPermissions?.color }}>
              {userPermissions?.name} (Level {currentUser?.level})
            </p>
          </div>
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <label>Email:</label>
            <span>{currentUser?.email}</span>
          </div>
          <div className="detail-item">
            <label>User ID:</label>
            <span>{currentUser?.id}</span>
          </div>
          <div className="detail-item">
            <label>Role:</label>
            <span>{userPermissions?.name}</span>
          </div>
          <div className="detail-item">
            <label>Access Level:</label>
            <span>Level {currentUser?.level}</span>
          </div>
          <div className="detail-item">
            <label>Status:</label>
            <span className="status-active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

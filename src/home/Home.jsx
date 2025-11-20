import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Profile from "../pages/Profile.jsx";
import Settings from "../pages/Settings.jsx";
import StaffManagement from "../pages/StaffManagement.jsx";
import AssignTasks from "../pages/AssignTasks.jsx";
import TaskProgress from "../pages/TaskProgress.jsx";
import StaffTaskDashboard from "../pages/StaffTaskDashboard.jsx";

import LetterTracker from "../lima/LetterTracker.jsx";
import LegalExpansion from "../montok/pages/LegalExpansion/LegalExpansion.jsx";
import PolicyTracker from "../montok/pages/PolicyTracker/PolicyTracker.jsx";
import MeetingMode from "../montok/pages/MeetingMode/MeetingMode.jsx";
import Summary from "../lima/Summary.jsx";

import "../styles/Home.css";
import gonLogo from "../assets/GON-logo.webp";
import gonLogo1 from "../assets/GON-logo1.png";
import { gapi } from "../montok/component/GlobalAPI.js";

const API_BASE = `${gapi}`;

function Home({ onUserLevelChange }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");
  const [userPermissions, setUserPermissions] = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [apiErrors, setApiErrors] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Enhanced error logging function
  const logError = (context, error, additionalInfo = {}) => {
    const errorObj = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      ...additionalInfo,
    };

    console.error(`❌ ${context.toUpperCase()} ERROR:`, errorObj);
    setApiErrors((prev) => [...prev.slice(-9), errorObj]);
  };

  const getAxiosConfig = () => {
    if (!sessionId) {
      console.warn("⚠️ No session ID available for API call");
      return {};
    }
    return {
      headers: {
        Authorization: sessionId,
      },
    };
  };

  const fetchUserPermissions = async () => {
    if (!sessionId) {
      console.warn("⚠️ Cannot fetch permissions: No session ID");
      return;
    }

    console.log("🎯 Fetching user permissions...");
    try {
      const response = await axios.get(
        `${API_BASE}/user-permissions`,
        getAxiosConfig()
      );
      console.log("✅ User permissions fetched:", response.data);
      setUserPermissions(response.data);
    } catch (error) {
      logError("fetchUserPermissions", error, {
        sessionId: sessionId ? "Present" : "Missing",
      });
    }
  };

  const fetchLevelData = async () => {
    if (!sessionId) {
      console.warn("⚠️ Cannot fetch level data: No session ID");
      return;
    }

    console.log("📈 Fetching level data...");
    try {
      const response = await axios.get(
        `${API_BASE}/level-data`,
        getAxiosConfig()
      );
      console.log("✅ Level data fetched:", response.data);
      setLevelData(response.data);
    } catch (error) {
      logError("fetchLevelData", error);
    }
  };

  // Fetch staff accounts for the sidebar
  const fetchStaffAccounts = async () => {
    if (!sessionId) {
      console.warn("⚠️ Cannot fetch staff accounts: No session ID");
      return;
    }

    console.log("👥 Fetching staff accounts...");
    try {
      const response = await axios.get(
        `${API_BASE}/staff-accounts`,
        getAxiosConfig()
      );
      console.log(
        `✅ Staff accounts fetched: ${response.data.length} accounts`
      );
      setStaffAccounts(response.data);
    } catch (error) {
      logError("fetchStaffAccounts", error);
    }
  };

  // Fetch pending tasks count for staff users
  const fetchPendingTasksCount = async () => {
    if (!sessionId) {
      return;
    }

    console.log("📋 Fetching pending tasks count...");
    try {
      const response = await axios.get(
        `${API_BASE}/staff-tasks`,
        getAxiosConfig()
      );
      console.log("✅ Staff tasks fetched for count:", response.data.length);

      // Calculate pending tasks (status = 'pending')
      const pendingCount = response.data.filter(
        (task) => task.task_status === "pending"
      ).length;

      setPendingTasksCount(pendingCount);
    } catch (error) {
      console.log("ℹ️ No staff tasks found or user is not staff");
      setPendingTasksCount(0);
    }
  };

  const handleLogout = async () => {
    console.log("🚪 Initiating logout...");
    try {
      if (sessionId) {
        await axios.post(`${API_BASE}/logout`, {}, getAxiosConfig());
        console.log("✅ Logout API call successful");
      } else {
        console.warn("⚠️ No session ID for logout API call");
      }
    } catch (error) {
      logError("handleLogout", error);
    } finally {
      console.log("🧹 Clearing local session data...");
      setCurrentUser(null);
      setSessionId(null);
      setUserPermissions(null);
      setLevelData(null);
      setStaffAccounts([]);
      setPendingTasksCount(0);
      setIsMobileSidebarOpen(false);
      localStorage.removeItem("ticketSession");
      console.log("✅ Logout completed");
    }
  };

  // Handle view change with mobile sidebar close
  const handleViewChange = (newView) => {
    console.log(`🔄 Changing view from ${currentView} to ${newView}`);
    setCurrentView(newView);

    // Close mobile sidebar when a view is selected
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Close mobile sidebar when clicking on overlay
  const handleOverlayClick = () => {
    setIsMobileSidebarOpen(false);
  };

  useEffect(() => {
    console.log("🔍 Checking for saved session...");
    const savedSession = localStorage.getItem("ticketSession");
    if (savedSession) {
      try {
        const { user, sessionId } = JSON.parse(savedSession);
        console.log("✅ Saved session found:", {
          user: user?.cs_user_name,
          sessionId: sessionId ? "Present" : "Missing",
        });
        setCurrentUser(user);
        setSessionId(sessionId);
      } catch (error) {
        logError("sessionRestore", error, { savedSession });
        localStorage.removeItem("ticketSession");
        setIsLoading(false);
      }
    } else {
      console.log("ℹ️ No saved session found");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId && currentUser) {
      console.log("🚀 Session initialized, fetching user data...");
      setIsLoading(false);
      fetchUserPermissions();
      fetchLevelData();
      fetchStaffAccounts();
      fetchPendingTasksCount();
    }
  }, [sessionId, currentUser]);

  useEffect(() => {
    console.log("🔍 DEBUG - Current Application State:", {
      currentUser: currentUser
        ? {
            name: currentUser.cs_user_name,
            level: currentUser.cs_user_level,
            department: currentUser.cs_user_department,
            is_staff: currentUser.is_staff,
          }
        : "No user",
      sessionId: sessionId ? "Present" : "Missing",
      userPermissions: userPermissions
        ? {
            name: userPermissions.name,
            canView: userPermissions.canView,
            canEdit: userPermissions.canEdit,
          }
        : "No permissions",
      staffAccounts: staffAccounts.length,
      pendingTasksCount,
      currentView,
      isLoading,
    });

    // Debug staff information
    console.log("🔍 STAFF DEBUG:", {
      is_staff: currentUser?.is_staff,
      userLevel: currentUser?.cs_user_level,
      hasStaffPermission:
        userPermissions?.canView?.includes("staff-management"),
      staffAccountsCount: staffAccounts.length,
      pendingTasksCount,
    });
  }, [
    userPermissions,
    currentUser,
    currentView,
    isLoading,
    staffAccounts,
    pendingTasksCount,
  ]);

  const handleLogin = (user, newSessionId) => {
    console.log("✅ Login successful, updating application state...");
    console.log("👤 User:", user);
    console.log("🎫 Session ID:", newSessionId ? "Received" : "Missing");

    setCurrentUser(user);
    setSessionId(newSessionId);

    const sessionData = { user, sessionId: newSessionId };
    localStorage.setItem("ticketSession", JSON.stringify(sessionData));
    console.log("💾 Session saved to localStorage");

    if (user?.cs_user_level && onUserLevelChange) {
      onUserLevelChange(user.cs_user_level);
    }
  };

  // Check if user has active staff accounts
  const hasActiveStaff = staffAccounts.some((staff) => staff.is_active);
  const activeStaffCount = staffAccounts.filter(
    (staff) => staff.is_active
  ).length;

  // Check if user is staff (either is_staff flag or level-based)
  const isStaffUser = currentUser?.is_staff || currentUser?.cs_user_level === 5;

  // Render different navigation based on user level
  const renderNavigation = () => {
    if (!userPermissions) {
      console.warn("⚠️ Cannot render navigation: No user permissions");
      return null;
    }

    console.log(
      "🧭 Rendering navigation with permissions:",
      userPermissions.canView
    );

    const getLevelIcon = () => {
      const icons = {
        1: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        2: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        3: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="9 22 9 12 15 12 15 22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        4: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="8.5"
              cy="7"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="20"
              y1="8"
              x2="20"
              y2="14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="23"
              y1="11"
              x2="17"
              y2="11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        5: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      };
      return icons[currentUser.cs_user_level] || icons[5];
    };

    return (
      <nav className="action-navigation">
        <div className="nav-section">
          <div className="nav-section-title">MAIN</div>
          <button
            onClick={() => handleViewChange("dashboard")}
            className={`nav-button ${
              currentView === "dashboard" ? "nav-button-active" : ""
            }`}
          >
            {getLevelIcon()}
            Dashboard
          </button>

          {userPermissions.canView.includes("letter-tracker") && (
            <button
              onClick={() => handleViewChange("letter-tracker")}
              className={`nav-button ${
                currentView === "letter-tracker" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Communications
            </button>
          )}

          {userPermissions.canView.includes("legal-case-tracker") && (
            <button
              onClick={() => handleViewChange("legal-case-tracker")}
              className={`nav-button ${
                currentView === "legal-case-tracker" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="10 9 9 9 8 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Legal Cases
            </button>
          )}

          {userPermissions.canView.includes("policy-tracker") && (
            <button
              onClick={() => handleViewChange("policy-tracker")}
              className={`nav-button ${
                currentView === "policy-tracker" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8v4l2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Policies
            </button>
          )}

          {userPermissions.canView.includes("meeting-modes") && (
            <button
              onClick={() => handleViewChange("meeting-modes")}
              className={`nav-button ${
                currentView === "meeting-modes" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Meetings
            </button>
          )}
        </div>

        {/* MY ASSISTANT SECTION - IMPROVED LOGIC */}
        {userPermissions.canView.includes("staff-management") && (
          <div className="nav-section">
            <div className="nav-section-title">MY ASSISTANT</div>

            {/* ALWAYS show Staff Management for users with permission */}
            <button
              onClick={() => handleViewChange("staff-management")}
              className={`nav-button ${
                currentView === "staff-management" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21v-2a4 4 0 0 0-3-3.87"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Staff Management
            </button>

            {/* Show My Tasks for staff users */}
            {/* {isStaffUser && (
              <button
                onClick={() => handleViewChange("staff-tasks")}
                className={`nav-button ${
                  currentView === "staff-tasks" ? "nav-button-active" : ""
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                My Tasks
                {pendingTasksCount > 0 && (
                  <span className="nav-badge orange">{pendingTasksCount}</span>
                )}
              </button>
            )} */}

            {/* Show Assign Tasks and Task Progress for non-staff users */}
            {/* {!isStaffUser && (
              <>
                <button
                  onClick={() => handleViewChange("assign-tasks")}
                  className={`nav-button ${
                    currentView === "assign-tasks" ? "nav-button-active" : ""
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Assign Tasks
                </button>

                <button
                  onClick={() => handleViewChange("task-progress")}
                  className={`nav-button ${
                    currentView === "task-progress" ? "nav-button-active" : ""
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Task Progress
                </button>
              </>
            )} */}
          </div>
        )}

        {/* Other Sections */}
        {/* <div className="nav-section">
          <div className="nav-section-title">WORK</div>
          {userPermissions.canView.includes("task-management") && (
            <button
              onClick={() => handleViewChange("task-management")}
              className={`nav-button ${
                currentView === "task-management" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Task Management
            </button>
          )}

          {userPermissions.canView.includes("documents") && (
            <button
              onClick={() => handleViewChange("documents")}
              className={`nav-button ${
                currentView === "documents" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="10 9 9 9 8 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Documents
            </button>
          )}
        </div> */}

        {/* Reports Section */}
        {/* <div className="nav-section">
          <div className="nav-section-title">REPORTS</div>
          {userPermissions.canView.includes("reports") && (
            <button
              onClick={() => handleViewChange("reports")}
              className={`nav-button ${
                currentView === "reports" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="10 9 9 9 8 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reports
            </button>
          )}

          {userPermissions.canView.includes("analytics") && (
            <button
              onClick={() => handleViewChange("analytics")}
              className={`nav-button ${
                currentView === "analytics" ? "nav-button-active" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 20V10M12 20V4M6 20v-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Analytics
            </button>
          )}
        </div> */}

        <div className="nav-section">
          <button
            onClick={() => handleViewChange("settings")}
            className={`nav-button ${
              currentView === "settings" ? "nav-button-active" : ""
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Settings
          </button>
        </div>
      </nav>
    );
  };

  // Render different content based on current view and user level
  const renderMainContent = () => {
    if (!currentUser || !userPermissions) {
      console.warn(
        "⚠️ Cannot render main content: Missing user or permissions"
      );
      return null;
    }

    console.log(`🖥️ Rendering view: ${currentView}`);

    const commonProps = {
      currentUser,
      userPermissions,
      staffAccounts,
    };

    switch (currentView) {
      case "dashboard":
        return <Dashboard {...commonProps} levelData={levelData} />;
      case "profile":
        return <Profile {...commonProps} />;
      case "settings":
        return <Settings {...commonProps} />;
      case "staff-management":
        return <StaffManagement {...commonProps} />;
      case "assign-tasks":
        return <AssignTasks {...commonProps} />;
      case "task-progress":
        return <TaskProgress {...commonProps} />;
      case "staff-tasks":
        console.log("🔄 Switching to Staff Task Dashboard");
        try {
          return (
            <StaffTaskDashboard
              currentUser={currentUser}
              userPermissions={userPermissions}
              staffAccounts={staffAccounts}
            />
          );
        } catch (error) {
          console.error("❌ StaffTaskDashboard error:", error);
          return (
            <div className="page-container">
              <div className="page-header">
                <h1>Error Loading Tasks</h1>
                <p>Failed to load task dashboard. Please try again.</p>
                <button
                  className="primary-button"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
              </div>
            </div>
          );
        }

      // UPDATED TRACKER PAGES - Show full content (summary + detail)
      case "letter-tracker":
        return (
          <div className="page-container">
            {/* <div className="page-header">
              <h1>Communications Tracker</h1>
              <p>Track and manage official correspondence and communications</p>
            </div> */}

            {/* Chart Card Summary */}
            {/* <div
              className="content-card"
              style={{ marginBottom: "20px", width: "100%" }}
            >
              <Summary
                activeDetail="communications-summary"
                currentUser={currentUser}
              />
            </div> */}

            {/* Detail View - Full Tracker */}
            <div className="content-card">
              {/* <h3>Communications Management</h3> */}
              <LetterTracker currentUser={currentUser} filterToPage={""} />
            </div>
          </div>
        );

      case "legal-case-tracker":
        return (
          <div className="page-container">
            {/* <div className="page-header">
              <h1>Legal Case Tracker</h1>
              <p>Monitor and manage legal proceedings and case status</p>
            </div> */}

            {/* Chart Card Summary */}
            {/* <div className="content-card" style={{ marginBottom: "20px" }}>
              <Summary activeDetail="legal-summary" currentUser={currentUser} />
            </div> */}

            {/* Detail View - Full Tracker */}
            <div className="content-card">
              {/* <h3>Case Management</h3> */}
              <LegalExpansion filterToPage={""} />
            </div>
          </div>
        );

      case "policy-tracker":
        return (
          <div className="page-container">
            {/* <div className="page-header">
              <h1>Policy Tracker</h1>
              <p>
                Track policy development, approval, and implementation status
              </p>
            </div> */}

            {/* Chart Card Summary */}
            {/* <div className="content-card" style={{ marginBottom: "20px" }}>
              <Summary
                activeDetail="policies-summary"
                currentUser={currentUser}
              />
            </div> */}

            {/* Detail View - Full Tracker */}
            <div className="content-card">
              {/* <h3>Policy Management</h3> */}
              <PolicyTracker currentUser={currentUser} filterToPage={""} />
            </div>
          </div>
        );

      case "meeting-modes":
        return (
          <div className="page-container">
            {/* <div className="page-header">
              <h1>Meeting Tracker</h1>
              <p>Manage meeting schedules, minutes, and action items</p>
            </div> */}

            {/* Chart Card Summary */}
            {/* <div className="content-card" style={{ marginBottom: "20px" }}>
              <Summary
                activeDetail="meetings-summary"
                currentUser={currentUser}
              />
            </div> */}

            {/* Detail View - Full Tracker */}
            <div className="content-card">
              {/* <h3>Meeting Management</h3> */}
              <MeetingMode currentUser={currentUser} filterToPage={""} />
            </div>
          </div>
        );

      // ... rest of your cases remain the same ...
      case "task-management":
        return (
          <div className="page-container">
            <div className="page-header">
              <h1>Task Management</h1>
              <p>Manage your personal tasks and assignments</p>
            </div>
            <div className="content-card">
              <h3>Personal Tasks</h3>
              <p>
                Level {currentUser.cs_user_level} - {userPermissions.name}{" "}
                Access
              </p>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="page-container">
            <div className="page-header">
              <h1>Documents</h1>
              <p>Manage and organize your documents</p>
            </div>
            <div className="content-card">
              <h3>Document Management</h3>
              <p>
                Level {currentUser.cs_user_level} - {userPermissions.name}{" "}
                Access
              </p>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="page-container">
            <div className="page-header">
              <h1>Reports</h1>
              <p>View and generate reports</p>
            </div>
            <div className="content-card">
              <h3>Reporting Dashboard</h3>
              <p>
                Level {currentUser.cs_user_level} - {userPermissions.name}{" "}
                Access
              </p>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="page-container">
            <div className="page-header">
              <h1>Analytics</h1>
              <p>View system analytics and insights</p>
            </div>
            <div className="content-card">
              <h3>Analytics Dashboard</h3>
              <p>
                Level {currentUser.cs_user_level} - {userPermissions.name}{" "}
                Access
              </p>
            </div>
          </div>
        );

      default:
        console.warn(
          `⚠️ Unknown view: ${currentView}, falling back to dashboard`
        );
        return <Dashboard {...commonProps} levelData={levelData} />;
    }
  };

  if (isLoading) {
    console.log("⏳ Showing loading state...");
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    console.log("👤 No user, showing login screen");
    return <Login onLogin={handleLogin} />;
  }

  console.log("🏠 Rendering main application layout");
  return (
    <div className="action-container">
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <button className="hamburger-button" onClick={toggleMobileSidebar}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="mobile-logo">
          <span>SPEAR Nagaland</span>
        </div>
        <div className="mobile-user">
          <div
            className="user-avatar mobile"
            style={{ backgroundColor: userPermissions?.color || "#7c3aed" }}
          >
            {currentUser.cs_user_name?.charAt(0)}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="mobile-overlay" onClick={handleOverlayClick}></div>
      )}

      {/* Sidebar */}
      <div
        className={`action-sidebar ${isMobileSidebarOpen ? "mobile-open" : ""}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logoContainer">
              <img
                src={gonLogo1}
                alt="SPEAR Nagaland Logo"
                className="logoImage"
                onError={(e) => {
                  console.error("❌ Sidebar logo failed to load:", e);
                  e.target.style.display = "none";
                  const fallback = document.querySelector(".fallbackLogo");
                  if (fallback) fallback.style.display = "block";
                }}
                onLoad={() =>
                  console.log("✅ Sidebar logo loaded successfully")
                }
              />
              <div className="fallbackLogo">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="sidebar-logo-text">SPEAR Nagaland</span>
          </div>
          <div className="user-info">
            <div
              className="user-avatar"
              style={{ backgroundColor: userPermissions?.color || "#7c3aed" }}
            >
              {currentUser.cs_user_name?.charAt(0)}
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser.cs_user_name}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign Out
          </button>
        </div>
        {/* Navigation */}
        {renderNavigation()}
      </div>

      {/* Main Content */}
      <div className="action-main-content">{renderMainContent()}</div>
    </div>
  );
}

const styles = {
  logoContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "150px",
    height: "100px",
  },
  logoImage: {
    width: "150%",
    height: "100%",
    objectFit: "contain",
    justifyContent: "flex-end",
    display: "flex",
  },
  fallbackLogo: {
    display: "none",
    color: "#667eea",
  },
};

export default Home;

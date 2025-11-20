// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Level1, Level2, Level3, Level4, Level5 } from "./levels/index.js";
import "../styles/Dashboard.css";

const API_BASE = `${process.env.REACT_APP_API_URL}`;

function Dashboard({
  currentUser,
  userPermissions,
  levelData: initialLevelData,
}) {
  const [levelData, setLevelData] = useState(initialLevelData || []);
  const [departmentData, setDepartmentData] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [accessibleUsers, setAccessibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const logError = (context, error) => {
    const errorObj = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    };

    console.error(`❌ DASHBOARD ${context.toUpperCase()} ERROR:`, errorObj);
    setErrors((prev) => [...prev.slice(-4), errorObj]); // Keep last 5 errors
  };

  const getAxiosConfig = () => {
    const sessionId = localStorage.getItem("ticketSession")
      ? JSON.parse(localStorage.getItem("ticketSession")).sessionId
      : null;

    if (!sessionId) {
      console.warn("⚠️ Dashboard: No session ID available");
    }

    return sessionId ? { headers: { Authorization: sessionId } } : {};
  };

  const fetchData = async () => {
    console.log("📊 Dashboard: Starting data fetch...");
    try {
      setLoading(true);
      setErrors([]);

      const [deptRes, tasksRes, usersRes] = await Promise.all([
        axios
          .get(`${API_BASE}/department-data`, getAxiosConfig())
          .catch((error) => {
            logError("department-data", error);
            return { data: [] };
          }),
        axios.get(`${API_BASE}/user-tasks`, getAxiosConfig()).catch((error) => {
          logError("user-tasks", error);
          return { data: [] };
        }),
        axios
          .get(`${API_BASE}/accessible-users`, getAxiosConfig())
          .catch((error) => {
            logError("accessible-users", error);
            return { data: [] };
          }),
      ]);

      console.log("✅ Dashboard data fetched:", {
        departmentData: deptRes.data.length,
        userTasks: tasksRes.data.length,
        accessibleUsers: usersRes.data.length,
      });

      setDepartmentData(deptRes.data);
      setUserTasks(tasksRes.data);
      setAccessibleUsers(usersRes.data);
    } catch (error) {
      logError("dashboard-fetch", error);
    } finally {
      setLoading(false);
      console.log("📊 Dashboard data loading complete");
    }
  };

  useEffect(() => {
    console.log("🎯 Dashboard mounted:", {
      user: currentUser?.cs_user_name,
      level: currentUser?.cs_user_level,
      hasInitialLevelData: !!initialLevelData?.length,
    });

    // Only fetch additional data if levelData wasn't passed as prop
    if (!initialLevelData || initialLevelData.length === 0) {
      console.log("🔄 Dashboard: Fetching all data...");
      fetchData();
    } else {
      console.log("✅ Dashboard: Using provided level data, skipping fetch");
      setLevelData(initialLevelData);
      setLoading(false);
    }
  }, [currentUser, initialLevelData]);

  if (loading) {
    console.log("⏳ Dashboard: Showing loading state");
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Loading Dashboard...</h1>
          <p>Fetching your data...</p>
        </div>
        {errors.length > 0 && (
          <div className="error-banner">
            ⚠️ Some data failed to load. Check console for details.
          </div>
        )}
      </div>
    );
  }

  console.log("🎨 Dashboard: Rendering level component", {
    userLevel: currentUser.cs_user_level,
    levelDataCount: levelData.length,
    departmentDataCount: departmentData.length,
    userTasksCount: userTasks.length,
    accessibleUsersCount: accessibleUsers.length,
  });

  // Render different component based on user level
  const renderLevelComponent = () => {
    const props = {
      currentUser,
      userPermissions,
      levelData,
      departmentData,
      userTasks,
      accessibleUsers,
      errors, // Pass errors to level components
    };

    const levelComponents = {
      1: Level1,
      2: Level2,
      3: Level3,
      4: Level4,
      5: Level5,
    };

    const LevelComponent = levelComponents[currentUser.cs_user_level] || Level5;

    console.log(`👑 Rendering Level ${currentUser.cs_user_level} dashboard`);
    return <LevelComponent {...props} />;
  };

  return (
    <>
      {/* {errors.length > 0 && (
        <div className="error-banner">
          ⚠️ {errors.length} error(s) occurred while loading data.
          <button
            onClick={() => console.log("🐛 Dashboard Errors:", errors)}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              color: "#fff",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            View Details
          </button>
        </div>
      )} */}
      {renderLevelComponent()}
    </>
  );
}

export default Dashboard;

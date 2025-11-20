// src/pages/levels/Level2.jsx
import React, { useState, useEffect } from "react";
import "../../styles/Dashboard.css";
import "../../styles/Level2.css";

function Level4({
  currentUser,
  levelData,
  departmentData,
  userTasks,
  accessibleUsers,
}) {
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  // Use the EXACT SAME method as StaffManagement
  const logError = (context, error, additionalInfo = {}) => {
    const errorObj = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      ...additionalInfo,
    };

    console.error(`❌ LEVEL2 ${context.toUpperCase()} ERROR:`, errorObj);
    setErrors((prev) => [...prev.slice(-4), errorObj]);
  };

  const getSessionId = () => {
    try {
      const ticketSession = localStorage.getItem("ticketSession");
      if (!ticketSession) {
        console.error("🚨 No ticketSession found in localStorage");
        return null;
      }

      const { sessionId } = JSON.parse(ticketSession);
      if (!sessionId) {
        console.error("🚨 No sessionId in ticketSession");
        return null;
      }

      return sessionId;
    } catch (error) {
      console.error("🚨 Error getting sessionId:", error);
      return null;
    }
  };

  // Use the EXACT SAME makeApiCall method as StaffManagement
  const makeApiCall = async (url, options = {}) => {
    const sessionId = getSessionId();
    if (!sessionId) {
      throw new Error("No valid session found. Please login again.");
    }

    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const fullUrl = `${baseUrl}${url}`;

    console.log("🌐 Level2 Making API call to:", fullUrl);

    const defaultOptions = {
      headers: {
        Authorization: sessionId,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(fullUrl, defaultOptions);

      console.log("📨 Level2 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          "❌ Level2 Non-JSON response received. First 200 chars:",
          text.substring(0, 200)
        );

        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          throw new Error(
            `Backend server not reachable. Is the backend running on ${baseUrl}?`
          );
        }

        throw new Error(
          `Server returned ${
            contentType || "unknown"
          } instead of JSON. Response: ${text.substring(0, 100)}...`
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Level2 API call successful, data received");
      return data;
    } catch (error) {
      console.error("💥 Level2 Fetch error:", error);
      throw error;
    }
  };

  // Fetch staff accounts using the SAME method as StaffManagement
  const fetchStaffAccounts = async () => {
    console.log("📥 Level2: Fetching staff accounts...");
    try {
      const data = await makeApiCall("/api/staff-accounts");

      // Use the SAME filtering logic as StaffManagement
      const userStaffAccounts = data.filter(
        (staff) =>
          staff.owner_user_id === currentUser.cs_user_id ||
          staff.owner_user_id === currentUser.id
      );

      console.log(
        `✅ Level2: Staff accounts fetched: ${userStaffAccounts.length} accounts (filtered from ${data.length} total)`
      );
      setStaffAccounts(userStaffAccounts);
      setErrors([]);
    } catch (error) {
      logError("fetchStaffAccounts", error);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    console.log("📋 Level2: Fetching activity logs...");
    try {
      const data = await makeApiCall(
        `/api/staff-activity-logs?owner_id=${currentUser.cs_user_id}`
      );
      console.log(
        `✅ Level2: Activity logs fetched: ${data.logs?.length || 0} entries`
      );
      setActivityLogs(data.logs || []);
    } catch (error) {
      logError("fetchActivityLogs", error);
    }
  };

  useEffect(() => {
    console.log("🎬 Level2: Component mounted");
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStaffAccounts(), fetchActivityLogs()]);
      setIsLoading(false);
    };

    if (currentUser?.cs_user_id) {
      fetchData();
    }
  }, [currentUser]);

  // Get team members (non-staff, same department)
  const teamMembers = accessibleUsers.filter(
    (user) =>
      user.cs_user_department === currentUser.cs_user_department &&
      user.cs_user_level >= 2
  );

  const getStatusBadge = (isActive) => {
    return (
      <span className={`status-badge ${isActive ? "active" : "inactive"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  console.log(" Level2: Rendering with", {
    staffCount: staffAccounts.length,
    activityLogsCount: activityLogs.length,
    errorsCount: errors.length,
  });

  return (
    <div className="dashboard-container">
      <div className="supervisor-dashboard">
        <div className="dashboard-header supervisor-header">
          <div>
            <h1> Secretary Dashboard</h1>
            <p>Welcome, {currentUser.cs_user_name}</p>
            <p>
              Department: {currentUser.cs_user_department} • Level:{" "}
              {currentUser.cs_user_level}
            </p>
          </div>
          <div className="supervisor-badge">
            Level {currentUser.cs_user_level} • Secretary
          </div>
        </div>

        {/* Error Banner */}
        {/* {errors.length > 0 && (
          <div className="error-banner">
            ⚠️ {errors.length} error(s) occurred.
            <button
              onClick={() => {
                console.log(" Level2 Errors:", errors);
                alert(
                  `Check browser console for ${errors.length} recent errors`
                );
              }}
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
            <button
              onClick={() => setErrors([])}
              style={{
                marginLeft: "10px",
                background: "none",
                border: "none",
                color: "#fff",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        )} */}

        <div className="supervisor-content">
          {/* Department Performance */}
          {levelData.length > 0 && (
            <div className="content-card">
              <h3>Performance Overview</h3>
              <div className="data-grid">
                {levelData.map((item, index) => (
                  <div key={index} className="data-item">
                    <div className="data-value">{item.cs_data_value}</div>
                    <div className="data-label">{item.cs_data_title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div className="content-card activity-logs-card">
            <div className="card-header">
              <h3>Staff Activity Logs ({activityLogs.length})</h3>
              <span className="subtitle">
                Recent activities by your staff members
              </span>
            </div>

            {activityLogs.length > 0 ? (
              <div className="activity-logs">
                {activityLogs.slice(0, 10).map((log, index) => (
                  <div key={log.id || index} className="activity-log-item">
                    <div className="log-header">
                      <div className="log-staff">
                        <strong>{log.staff_username}</strong>
                        <span className="log-designation">
                          ({log.staff_designation})
                        </span>
                      </div>
                      <div className="log-time">
                        {new Date(log.cs_performed_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="log-action">{log.action_performed}</div>
                    <div className="log-details">
                      <span className="module-badge">
                        {log.module_affected}
                      </span>
                      {/* {log.ip_address && (
                        <span className="log-ip">IP: {log.ip_address}</span>
                      )} */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No activity logs found.</p>
                <p className="empty-subtitle">
                  Staff activities will appear here when they use the system.
                </p>
              </div>
            )}
          </div>
          {/* Staff Accounts Section - USING SAME DATA AS STAFFMANAGEMENT */}
          {/* <div className="content-card-head">
            <div className="card-header">
              <h3> My Staff Accounts ({staffAccounts.length})</h3>
              {isLoading && <span className="loading-badge">Loading...</span>}
            </div>
            
            {isLoading ? (
              <div className="loading-state">Loading staff accounts...</div>
            ) : staffAccounts.length > 0 ? (   
              <div className="staff-members-grid">
                {staffAccounts.map((staff) => (
                  <div key={staff.id} className="staff-member-card">
                    <div className="staff-header">
                      <div className="staff-info">
                        <h4>{staff.staff_email}</h4>
                        <span className="staff-designation">{staff.staff_designation}</span>
                      </div>
                      {getStatusBadge(staff.is_active)}
                    </div>

                    <div className="staff-details">
                      <div className="detail-item">
                        <span className="detail-label">Username:</span>
                        <span className="detail-value">{staff.staff_username}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(staff.cs_created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Activity:</span>
                        <span className="detail-value">
                          {staff.last_activity ? formatDate(staff.last_activity) : 'Never'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Activities:</span>
                        <span className="detail-value">{staff.activity_count || 0} actions</span>
                      </div>
                    </div>

                    <div className="staff-permissions">
                      <h5>Permissions:</h5>
                      <div className="permission-chips">
                        {(() => {
                          try {
                            const permissions = typeof staff.permissions === 'string' 
                              ? JSON.parse(staff.permissions) 
                              : staff.permissions || [];
                            return permissions.length > 0 ? (
                              permissions.map(perm => (
                                <span key={perm} className="permission-chip">
                                  {perm}
                                </span>
                              ))
                            ) : (
                              <span className="permission-chip empty">No permissions</span>
                            );
                          } catch (error) {
                            console.error(`❌ Error parsing permissions for staff ${staff.id}:`, error, staff.permissions);
                            return <span className="permission-chip error">Error loading permissions</span>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No Staff Accounts</h4>
                <p>You haven't created any staff accounts yet.</p>
                <p className="empty-subtitle">
                  Go to <strong>Staff Management</strong> to create your first staff account.
                </p>
              </div>
            )}
          </div> */}

          {/* Department Performance */}
          {/* {levelData.length > 0 && (
            <div className="content-card">
              <h3>📈 Department Performance</h3>
              <div className="data-grid">
                {levelData.map((item, index) => (
                  <div key={index} className="data-item">
                    <div className="data-value">{item.cs_data_value}</div>
                    <div className="data-label">{item.cs_data_title}</div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Department Data */}
          {/* {departmentData.length > 0 && (
            <div className="content-card">
              <h3>📊 Department Metrics</h3>
              <div className="data-grid">
                {departmentData.map((item, index) => (
                  <div key={index} className="data-item">
                    <div className="data-value">{item.cs_data_value}</div>
                    <div className="data-label">{item.cs_data_title}</div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Team Members */}
          {/* <div className="content-card">
            <h3>👥 Team Members ({teamMembers.length})</h3>
            <div className="team-members-grid">
              {teamMembers.map((user, index) => (
                <div key={index} className="team-member-card">
                  <div className="member-name">{user.cs_user_name}</div>
                  <div className="member-details">
                    <span className="member-level">Level {user.cs_user_level}</span>
                    <span className="member-dept">{user.cs_user_department}</span>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* User Tasks */}
          {/* {userTasks.length > 0 && (
            <div className="content-card">
              <h3>📋 Your Tasks ({userTasks.length})</h3>
              <div className="tasks-list">
                {userTasks.map((task, index) => (
                  <div key={index} className="task-item">
                    <div className="task-main">
                      <div className="task-title">{task.cs_task_title}</div>
                      <div className="task-status">{task.cs_task_status}</div>
                    </div>
                    {task.cs_due_date && (
                      <div className="task-due">
                        Due: {new Date(task.cs_due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default Level4;

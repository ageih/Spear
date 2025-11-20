// src/pages/StaffManagement.jsx
import React, { useState, useEffect } from "react";
import "../styles/StaffManagement.css";

function StaffManagement({ currentUser, userPermissions }) {
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState({}); // Store logs by staff ID
  const [logsLoading, setLogsLoading] = useState({}); // Loading state per staff
  const [expandedStaff, setExpandedStaff] = useState(null); // Track which staff is expanded
  const [errors, setErrors] = useState([]);

  const [newStaff, setNewStaff] = useState({
    staff_email: "",
    staff_password: "",
    staff_designation: "",
    permissions: [],
  });

  // Available permissions for staff accounts
  const availablePermissions = [
    {
      id: "view_tasks",
      label: "View Tasks",
      description: "Can view assigned tasks and work",
    },
    {
      id: "respond_emails",
      label: "Respond to Emails",
      description: "Can send and respond to emails",
    },
    {
      id: "schedule_meetings",
      label: "Schedule Meetings",
      description: "Can schedule and manage meetings",
    },
    {
      id: "manage_calendar",
      label: "Manage Calendar",
      description: "Can manage calendar events",
    },
    {
      id: "process_documents",
      label: "Process Documents",
      description: "Can create and edit documents",
    },
    {
      id: "manage_correspondence",
      label: "Manage Correspondence",
      description: "Can handle official correspondence",
    },
    {
      id: "view_documents",
      label: "View Documents",
      description: "Can view documents (read-only)",
    },
    {
      id: "view_financial",
      label: "View Financial Data",
      description: "Can view financial information",
    },
  ];

  const logError = (context, error, additionalInfo = {}) => {
    const errorObj = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      ...additionalInfo,
    };

    console.error(
      `❌ STAFF MANAGEMENT ${context.toUpperCase()} ERROR:`,
      errorObj
    );
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

  // Enhanced makeApiCall with proper base URL
  const makeApiCall = async (url, options = {}) => {
    const sessionId = getSessionId();
    if (!sessionId) {
      throw new Error("No valid session found. Please login again.");
    }

    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const fullUrl = `${baseUrl}${url}`;

    console.log("🌐 Making API call to:", fullUrl);

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

      console.log("📨 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          "❌ Non-JSON response received. First 200 chars:",
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
      console.log("✅ API call successful, data received");
      return data;
    } catch (error) {
      console.error("💥 Fetch error:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("👥 StaffManagement: Component mounted");
    fetchStaffAccounts();
  }, []);

  const fetchStaffAccounts = async () => {
    console.log("📥 Fetching staff accounts...");
    try {
      const data = await makeApiCall("/staff-accounts");
      console.log(
        data,
        "kjnksgjnskdgskjdngksjngksjdgnksjdgnksdjgnksjgdnskjgnskjdgnskjdngskjgdn"
      );

      // FILTER: Only show staff accounts that belong to current user
      // const userStaffAccounts = data.filter(
      //   (staff) =>
      //     staff.owner_user_id === currentUser.cs_user_id ||
      //     staff.owner_user_id === currentUser.id
      // );
      // console.log(userStaffAccounts, "lklk", currentUser);

      // console.log(
      //   `✅ Staff accounts fetched: ${userStaffAccounts.length} accounts (filtered from ${data.length} total)`
      // );
      // setStaffAccounts(userStaffAccounts);
      setStaffAccounts(data);

      setErrors([]);
    } catch (error) {
      logError("fetchStaffAccounts", error);
      alert(`Failed to load staff accounts: ${error.message}`);
    }
  };

  // Fetch activity logs for a specific staff member
  const fetchActivityLogs = async (staffId) => {
    console.log(`📊 Fetching activity logs for staff ${staffId}...`);
    setLogsLoading((prev) => ({ ...prev, [staffId]: true }));

    try {
      const data = await makeApiCall(`/api/staff-activity/${staffId}`);
      console.log(`✅ Activity logs fetched: ${data.length} entries`);
      setActivityLogs((prev) => ({ ...prev, [staffId]: data }));
    } catch (error) {
      logError("fetchActivityLogs", error, { staffId });
      alert(`Failed to load activity logs: ${error.message}`);
    } finally {
      setLogsLoading((prev) => ({ ...prev, [staffId]: false }));
    }
  };

  // Handle view activity logs - toggle expansion
  const handleViewActivity = async (staff) => {
    if (expandedStaff === staff.id) {
      // If already expanded, collapse it
      console.log(`📭 Collapsing staff ${staff.id}`);
      setExpandedStaff(null);
    } else {
      // Expand and load activity logs
      console.log(`📖 Expanding staff ${staff.id}`);
      setExpandedStaff(staff.id);

      // If we haven't loaded logs for this staff yet, fetch them
      if (!activityLogs[staff.id]) {
        await fetchActivityLogs(staff.id);
      }
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    console.log("➕ Creating new staff account...", newStaff);
    setLoading(true);

    try {
      await makeApiCall("/staff-accounts", {
        method: "POST",
        body: JSON.stringify(newStaff),
      });

      console.log("✅ Staff account created successfully");

      setShowAddModal(false);
      setNewStaff({
        staff_email: "",
        staff_password: "",
        staff_designation: "",
        permissions: [],
      });
      fetchStaffAccounts();
      alert("Staff account created successfully!");
    } catch (error) {
      logError("createStaff", error, { staffData: newStaff });
      alert(`Failed to create staff account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    console.log(`🗑️ Deleting staff account ${staffId}...`);
    if (
      !window.confirm(
        "Are you sure you want to delete this staff account? This action cannot be undone."
      )
    ) {
      console.log("❌ Staff deletion cancelled by user");
      return;
    }

    try {
      await makeApiCall(`/staff-accounts/${staffId}`, {
        method: "DELETE",
      });

      console.log("✅ Staff account deleted successfully");
      fetchStaffAccounts();
      // If the deleted staff was expanded, collapse it
      if (expandedStaff === staffId) {
        setExpandedStaff(null);
      }
      alert("Staff account deleted successfully!");
    } catch (error) {
      logError("deleteStaff", error, { staffId });
      alert(`Failed to delete staff account: ${error.message}`);
    }
  };

  const handleToggleStaffStatus = async (staffId, currentStatus) => {
    console.log(
      `🔄 Toggling staff status for ${staffId} to ${
        !currentStatus ? "active" : "inactive"
      }...`
    );
    try {
      await makeApiCall(`/staff-accounts/${staffId}`, {
        method: "PUT",
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      console.log("✅ Staff status updated successfully");
      fetchStaffAccounts();
      alert(
        `Staff account ${
          !currentStatus ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      logError("toggleStaffStatus", error, {
        staffId,
        newStatus: !currentStatus,
      });
      alert(`Failed to update staff account: ${error.message}`);
    }
  };

  const togglePermission = (permissionId) => {
    console.log(`🎯 Toggling permission: ${permissionId}`);
    setNewStaff((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

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

  const getStaffCounts = () => {
    const active = staffAccounts.filter((s) => s.is_active).length;
    const inactive = staffAccounts.filter((s) => !s.is_active).length;
    return { active, inactive, total: staffAccounts.length };
  };

  const staffCounts = getStaffCounts();

  console.log("👥 StaffManagement: Rendering with", {
    staffCount: staffAccounts.length,
    expandedStaff,
    activityLogsCount: Object.keys(activityLogs).length,
    errorsCount: errors.length,
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Staff Account Management</h1>
            <p>Manage personal staff accounts that can work on your behalf</p>
          </div>
          <div className="user-badge">
            <span
              className="user-level-badge"
              style={{ backgroundColor: userPermissions?.color }}
            >
              Level {currentUser?.cs_user_level} • {userPermissions?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {/* {errors.length > 0 && (
        <div className="error-banner">
          ⚠️ {errors.length} error(s) occurred.
          <button
            onClick={() => {
              console.log("🐛 Staff Management Errors:", errors);
              alert(`Check browser console for ${errors.length} recent errors`);
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

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{staffCounts.total}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#16a34a" }}>
            {staffCounts.active}
          </div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#dc2626" }}>
            {staffCounts.inactive}
          </div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">4</div>
          <div className="stat-label">Max Allowed</div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Staff Account</h3>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label>Staff Email *</label>
                <input
                  type="email"
                  value={newStaff.staff_email}
                  onChange={(e) =>
                    setNewStaff((prev) => ({
                      ...prev,
                      staff_email: e.target.value,
                    }))
                  }
                  placeholder="e.g., cm_ps01@t, home_steno01@t"
                  required
                />
                <small>This will be used as login email for staff</small>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newStaff.staff_password}
                  onChange={(e) =>
                    setNewStaff((prev) => ({
                      ...prev,
                      staff_password: e.target.value,
                    }))
                  }
                  placeholder="Set initial password"
                  required
                  minLength="4"
                />
                <small>Minimum 4 characters required</small>
              </div>

              <div className="form-group">
                <label>Designation *</label>
                <input
                  type="text"
                  value={newStaff.staff_designation}
                  onChange={(e) =>
                    setNewStaff((prev) => ({
                      ...prev,
                      staff_designation: e.target.value,
                    }))
                  }
                  placeholder="e.g., Personal Secretary, Stenographer"
                  required
                  maxLength="20"
                />
                <small>
                  Max 20 characters ({20 - newStaff.staff_designation.length}{" "}
                  remaining)
                </small>
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-grid">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={newStaff.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <div className="permission-info">
                        <div className="permission-title">
                          {permission.label}
                        </div>
                        <div className="permission-desc">
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    console.log("❌ Staff creation cancelled");
                    setShowAddModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="content-section">
        <div className="section-header">
          <h3>Staff Accounts</h3>
          <button
            className="primary-button"
            onClick={() => {
              console.log("➕ Opening staff creation modal");
              setShowAddModal(true);
            }}
            disabled={staffCounts.total >= 4}
          >
            + Add New Staff
          </button>
        </div>

        {staffCounts.total >= 5 && (
          <div className="warning-banner">
            ⚠️ You have reached the maximum limit of 4 staff accounts. Remove
            existing accounts to create new ones.
          </div>
        )}

        {staffAccounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4>No Staff Accounts</h4>
            <p>
              You haven't created any staff accounts yet. Create your first
              staff account to get started.
            </p>
            <button
              className="primary-button"
              onClick={() => setShowAddModal(true)}
            >
              Create First Staff Account
            </button>
          </div>
        ) : (
          <div className="staff-grid">
            {staffAccounts.map((staff) => (
              <div
                key={staff.id}
                className={`staff-card ${
                  expandedStaff === staff.id ? "expanded" : ""
                }`}
              >
                <div className="staff-header">
                  <div className="staff-info">
                    <h4>{staff.staff_email}</h4>
                    <span className="staff-designation">
                      {staff.staff_designation}
                    </span>
                  </div>
                  {getStatusBadge(staff.is_active)}
                </div>

                <div className="staff-details">
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {formatDate(staff.cs_created_at)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Activity:</span>
                    <span className="detail-value">
                      {staff.last_activity
                        ? formatDate(staff.last_activity)
                        : "Never"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Activities:</span>
                    <span className="detail-value">
                      {staff.activity_count || 0} actions
                    </span>
                  </div>
                </div>

                <div className="staff-permissions">
                  <h5>Permissions:</h5>
                  <div className="permission-chips">
                    {(() => {
                      try {
                        const permissions =
                          typeof staff.permissions === "string"
                            ? JSON.parse(staff.permissions)
                            : staff.permissions || [];
                        return permissions.map((perm) => (
                          <span key={perm} className="permission-chip">
                            {availablePermissions.find((p) => p.id === perm)
                              ?.label || perm}
                          </span>
                        ));
                      } catch (error) {
                        console.error(
                          `❌ Error parsing permissions for staff ${staff.id}:`,
                          error,
                          staff.permissions
                        );
                        return (
                          <span className="permission-chip error">
                            Error loading permissions
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="staff-actions">
                  <button
                    className={`secondary-button small ${
                      expandedStaff === staff.id ? "active" : ""
                    }`}
                    onClick={() => handleViewActivity(staff)}
                  >
                    {expandedStaff === staff.id
                      ? "Hide Activity"
                      : "View Activity"}
                  </button>
                  <button
                    className={`secondary-button small ${
                      staff.is_active ? "warning" : "success"
                    }`}
                    onClick={() =>
                      handleToggleStaffStatus(staff.id, staff.is_active)
                    }
                  >
                    {staff.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="danger-button small"
                    onClick={() => handleDeleteStaff(staff.id)}
                  >
                    Delete
                  </button>
                </div>

                {/* Activity Logs Section - Only show for expanded staff */}
                {expandedStaff === staff.id && (
                  <div className="activity-logs-section">
                    <div className="activity-header">
                      <h5>Activity Logs for {staff.staff_email}</h5>
                      {logsLoading[staff.id] && (
                        <span className="loading-text">Loading...</span>
                      )}
                    </div>

                    {activityLogs[staff.id] &&
                    activityLogs[staff.id].length === 0 ? (
                      <div className="empty-activity">
                        <p>No activity recorded for this staff member.</p>
                      </div>
                    ) : (
                      <div className="activity-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Date & Time</th>
                              <th>Action</th>
                              <th>Module</th>
                              <th>IP Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activityLogs[staff.id]?.map((log) => (
                              <tr key={log.id}>
                                <td>{formatDate(log.cs_performed_at)}</td>
                                <td>{log.action_performed}</td>
                                <td>
                                  <span className="module-badge">
                                    {log.module_affected}
                                  </span>
                                </td>
                                <td>{log.ip_address || "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffManagement;

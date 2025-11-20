// src/pages/StaffTaskDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = `${process.env.REACT_APP_API_URL}`;

const StaffTaskDashboard = ({ currentUser, userPermissions }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateText, setUpdateText] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const getAxiosConfig = () => {
    const sessionId = localStorage.getItem("ticketSession")
      ? JSON.parse(localStorage.getItem("ticketSession")).sessionId
      : null;

    return sessionId ? { headers: { Authorization: sessionId } } : {};
  };

  const fetchStaffTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("📋 Fetching staff tasks...");
      const response = await axios.get(
        `${API_BASE}/staff-tasks`,
        getAxiosConfig()
      );

      console.log("✅ Staff tasks fetched:", response.data);
      setTasks(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch tasks:", error);
      setError("Failed to load tasks. Please try again.");

      // // For development: Create mock tasks if API fails
      // if (error.response?.status === 404) {
      //   console.log('⚠️ API endpoint not found, using mock data for development');
      //   const mockTasks = [
      //     {
      //       id: 1,
      //       task_title: 'Review Quarterly Reports',
      //       task_description: 'Go through the quarterly financial reports and highlight key metrics',
      //       task_status: 'pending',
      //       priority: 'high',
      //       owner_name: 'Manager',
      //       due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      //       update_count: 0
      //     },
      //     {
      //       id: 2,
      //       task_title: 'Prepare Meeting Agenda',
      //       task_description: 'Create agenda for upcoming department meeting',
      //       task_status: 'in-progress',
      //       priority: 'medium',
      //       owner_name: 'Supervisor',
      //       due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      //       update_count: 2
      //     }
      //   ];
      //   setTasks(mockTasks);
      //   setError(null);
      // }
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (
    taskId,
    newStatus,
    progressPercentage = 0
  ) => {
    try {
      console.log(`🔄 Updating task ${taskId} to ${newStatus}...`);

      // For development: Simulate API call
      if (API_BASE.includes("localhost")) {
        // Update local state for development
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, task_status: newStatus } : task
          )
        );

        setUpdateText("");
        setProgress(0);
        setSelectedTask(null);
        alert("Task status updated successfully! (Development Mode)");
        return;
      }

      const response = await axios.put(
        `${API_BASE}/staff-tasks/${taskId}/status`,
        {
          task_status: newStatus,
          progress_percentage: progressPercentage,
          update_text: updateText || `Status changed to ${newStatus}`,
        },
        getAxiosConfig()
      );

      if (response.status === 200) {
        setUpdateText("");
        setProgress(0);
        setSelectedTask(null);
        fetchStaffTasks(); // Refresh the task list
        alert("Task status updated successfully!");
      }
    } catch (error) {
      console.error("❌ Error updating task:", error);
      alert("Failed to update task status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#6b7280";
      case "in-progress":
        return "#ea580c";
      case "completed":
        return "#16a34a";
      case "cancelled":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "#16a34a";
      case "medium":
        return "#ca8a04";
      case "high":
        return "#ea580c";
      case "urgent":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    console.log(
      "👤 StaffTaskDashboard mounted for user:",
      currentUser?.cs_user_name
    );
    fetchStaffTasks();
  }, [currentUser]);

  // Check if user is staff (either is_staff flag or level-based)
  const isStaffUser = currentUser?.is_staff || currentUser?.cs_user_level === 5;

  if (!isStaffUser) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>This page is only accessible to staff accounts.</p>
          <div className="content-card">
            <p>Current user level: {currentUser?.cs_user_level}</p>
            <p>Staff flag: {currentUser?.is_staff ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Tasks</h1>
        <p>Tasks assigned to you by your manager</p>
        <div className="user-badge">
          <span className="user-level-badge">
            Staff • {currentUser?.cs_user_department}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              color: "#fff",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Task Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{tasks.length}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#16a34a" }}>
            {tasks.filter((t) => t.task_status === "completed").length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#ea580c" }}>
            {tasks.filter((t) => t.task_status === "in-progress").length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: "#6b7280" }}>
            {tasks.filter((t) => t.task_status === "pending").length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="content-card">
        <div className="section-header">
          <h3>Assigned Tasks</h3>
          <button
            className="secondary-button"
            onClick={fetchStaffTasks}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h4>No Tasks Assigned</h4>
            <p>You don't have any tasks assigned to you yet.</p>
            <button className="secondary-button" onClick={fetchStaffTasks}>
              Check Again
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-header">
                  <div className="task-info">
                    <h4>{task.task_title}</h4>
                    <p className="task-description">{task.task_description}</p>
                    <div className="task-meta">
                      <span className="task-assigned-by">
                        Assigned by: <strong>{task.owner_name}</strong>
                      </span>
                      {task.due_date && (
                        <span className="task-due-date">
                          Due: {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-status">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(task.task_status),
                      }}
                    >
                      {task.task_status.replace("-", " ")}
                    </span>
                    <span
                      className="priority-badge"
                      style={{
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    className={`action-button ${
                      task.task_status === "in-progress" ? "active" : ""
                    }`}
                    onClick={() => updateTaskStatus(task.id, "in-progress", 50)}
                    disabled={task.task_status === "completed"}
                  >
                    Start Progress
                  </button>

                  <button
                    className={`action-button ${
                      task.task_status === "completed" ? "active" : ""
                    }`}
                    onClick={() => updateTaskStatus(task.id, "completed", 100)}
                  >
                    Mark Complete
                  </button>

                  <button
                    className="secondary-button small"
                    onClick={() =>
                      setSelectedTask(
                        selectedTask?.id === task.id ? null : task
                      )
                    }
                  >
                    {selectedTask?.id === task.id
                      ? "Cancel Update"
                      : "Add Update"}
                  </button>

                  <button
                    className="secondary-button small"
                    onClick={() => {
                      alert(
                        `Viewing updates for: ${task.task_title}\n\nThis would open a detailed view in a real application.`
                      );
                    }}
                  >
                    View Updates ({task.update_count || 0})
                  </button>
                </div>

                {/* Quick Progress Update */}
                {selectedTask?.id === task.id && (
                  <div className="task-update-form">
                    <h5>Update Progress for: {task.task_title}</h5>
                    <div className="form-group">
                      <label>Progress (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                      />
                      <span>{progress}%</span>
                    </div>
                    <div className="form-group">
                      <label>Update Notes</label>
                      <textarea
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        placeholder="Add progress notes or comments..."
                        rows="3"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setSelectedTask(null);
                          setUpdateText("");
                          setProgress(0);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="primary-button"
                        onClick={() =>
                          updateTaskStatus(task.id, "in-progress", progress)
                        }
                      >
                        Save Update
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Development Notice */}
      {/* {process.env.NODE_ENV === "development" && (
        <div
          className="content-card"
          style={{ background: "#fef3c7", borderColor: "#f59e0b" }}
        >
          <h4>🛠️ Development Mode</h4>
          <p>
            This is using mock data for development. Backend API endpoints need
            to be implemented:
          </p>
          <ul>
            <li>
              <code>GET /api/staff-tasks</code> - Fetch staff tasks
            </li>
            <li>
              <code>PUT /api/staff-tasks/:id/status</code> - Update task status
            </li>
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default StaffTaskDashboard;

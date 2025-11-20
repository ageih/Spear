// src/pages/AssignTasks.jsx
import React, { useState } from "react";

const AssignTasks = ({ currentUser, userPermissions, staffAccounts }) => {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const activeStaff = staffAccounts.filter((staff) => staff.is_active);

  const handleAssignTask = (e) => {
    e.preventDefault();
    // Handle task assignment logic here
    console.log("Assigning task:", {
      staff: selectedStaff,
      title: taskTitle,
      description: taskDescription,
      dueDate,
      priority,
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Assign Tasks to Staff</h1>
        <p>Delegate work to your assistant staff members</p>
      </div>

      <div className="content-card">
        <h3>Assign New Task</h3>

        {activeStaff.length === 0 ? (
          <div className="empty-state">
            <p>
              No active staff members available. Please activate staff accounts
              first.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAssignTask} className="task-form">
            <div className="form-group">
              <label>Select Staff Member *</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                required
              >
                <option value="">Choose a staff member</option>
                {activeStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.staff_email} - {staff.staff_designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label>Task Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe the task in detail"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <button type="submit" className="primary-button">
              Assign Task
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssignTasks;

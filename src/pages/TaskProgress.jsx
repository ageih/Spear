// src/pages/TaskProgress.jsx
import React from 'react';

const TaskProgress = ({ currentUser, userPermissions, staffAccounts }) => {
  // Mock data for demonstration
  const taskProgress = [
    {
      id: 1,
      staffName: "Personal Secretary",
      taskTitle: "Draft meeting minutes",
      status: "completed",
      progress: 100,
      dueDate: "2024-01-20"
    },
    {
      id: 2,
      staffName: "Stenographer",
      taskTitle: "Type official correspondence",
      status: "in-progress",
      progress: 75,
      dueDate: "2024-01-22"
    },
    {
      id: 3,
      staffName: "Assistant",
      taskTitle: "File documents",
      status: "not-started",
      progress: 0,
      dueDate: "2024-01-25"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in-progress': return '#ea580c';
      case 'not-started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'not-started': return 'Not Started';
      default: return status;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Task Progress</h1>
        <p>Monitor progress of tasks assigned to your staff</p>
      </div>

      <div className="content-card">
        <h3>Staff Task Progress</h3>
        
        {taskProgress.length === 0 ? (
          <div className="empty-state">
            <p>No tasks have been assigned yet.</p>
          </div>
        ) : (
          <div className="task-progress-grid">
            {taskProgress.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h4>{task.taskTitle}</h4>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {getStatusText(task.status)}
                  </span>
                </div>
                
                <div className="task-details">
                  <div className="detail-item">
                    <span className="detail-label">Assigned to:</span>
                    <span className="detail-value">{task.staffName}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{task.dueDate}</span>
                  </div>
                  
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{task.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskProgress;
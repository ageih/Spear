import React, { useState, useEffect } from "react";
import "./MeetingMode.css";
import axios from "axios";
import { gapi } from "../../component/GlobalAPI";
import { useUserSession } from "../../component/useUserSession";
import Toast from "../../component/Toast";
import { useUser } from "../../../LevelContext";
import History from "../../component/histry/Htory";
import { Binic, Deleteic } from "../../component/UseIcons";

const MeetingMode = ({ filterToPage, setSummaryInfo }) => {
  const contextuser = useUser();
  const levelUsers = contextuser?.levelUser;

  // Use the new user session hook
  const {
    userData,
    isLoading: userLoading,
    error: userError,
  } = useUserSession();

  const departments = [
    "Finance",
    "Health",
    "Education",
    "Public Works",
    "Energy",
    "Home",
    "Agriculture",
  ];

  // Status options
  const statusOptions = ["Pending", "Important", "Critical", "Completed"];

  const [meetings, setMeetings] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showMeetingArea, setShowMeetingArea] = useState(false);
  const [expandedMeeting, setExpandedMeeting] = useState(null);
  const [actionText, setActionText] = useState("");
  const [actionDeadline, setActionDeadline] = useState("");
  const [actionAssignedTo, setActionAssignedTo] = useState("");
  const [savedActions, setSavedActions] = useState([]);
  const [recycleBin, setRecycleBin] = useState(false);
  const [deleted, setDeleted] = useState([]);
  const [filter, setFilter] = useState("");
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [filteredDeleted, setFilteredDeleted] = useState([]);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Loading states for different operations
  const [loading, setLoading] = useState({
    save: false,
    delete: null, // stores the meeting ID being deleted
    statusUpdate: null, // stores the meeting ID being updated
    actionStatusUpdate: null, // stores the action ID being updated
  });

  const [toast, setToast] = useState(null);

  const [meetingForm, setMeetingForm] = useState({
    date: new Date().toISOString().split("T")[0],
    mode: "In-person",
    // Removed decisions field
    assigned_by: "",
    status: "Pending",
  });

  // Effect to automatically set filter when filterToPage changes
  useEffect(() => {
    if (filterToPage || filterToPage.trim() == "") {
      console.log("🎯 Setting filter from prop:", filterToPage);
      setFilter(filterToPage);
    }
  }, [filterToPage]);

  // Date range filter function
  const getDateRangeFilter = (filterText) => {
    if (!filterText) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filterLower = filterText.toLowerCase().trim();

    if (filterLower.includes("due this week")) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { type: "week", start: startOfWeek, end: endOfWeek };
    }

    if (filterLower.includes("due this month")) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { type: "month", start: startOfMonth, end: endOfMonth };
    }

    return null;
  };

  // Check if deadline is within date range
  const isDeadlineInRange = (deadline, start, end) => {
    if (!deadline || deadline === "N/A" || deadline === "") return false;

    try {
      const datePart = deadline.split(" ")[0];
      const deadlineDate = new Date(datePart);

      if (isNaN(deadlineDate.getTime())) {
        return false;
      }

      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate >= start && deadlineDate <= end;
    } catch (error) {
      console.error("Invalid deadline date:", deadline, error);
      return false;
    }
  };

  // Flatten all users from ALL levels dynamically
  const allUsers = React.useMemo(() => {
    if (!levelUsers) return [];

    const users = [];
    Object.keys(levelUsers).forEach((key) => {
      if (Array.isArray(levelUsers[key])) {
        users.push(...levelUsers[key]);
      }
    });
    return users;
  }, [levelUsers]);

  // Helper function to find user name by ID
  const getUserNameById = (userId) => {
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
  };

  // Initialize meeting form with user data when available
  useEffect(() => {
    if (userData?.user?.user_id) {
      setMeetingForm((prev) => ({
        ...prev,
        assigned_by: userData.user.user_id,
      }));
    }
  }, [userData]);

  // Update summary counts function - FIXED to use meeting date
  const updateSummaryCounts = (meetingsData) => {
    if (!setSummaryInfo) {
      console.log("❌ setSummaryInfo is not available");
      return;
    }

    console.log(
      "🔄 updateSummaryCounts called with:",
      meetingsData?.length,
      "meetings"
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate date ranges
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Count meetings by status
    const criticalCount = meetingsData.filter(
      (m) => m.status === "Critical"
    ).length;

    const importantCount = meetingsData.filter(
      (m) => m.status === "Important"
    ).length;

    // Count meetings due this week (status must be Pending) - FIXED
    const dueThisWeekCount = meetingsData.filter((m) => {
      if (m.status !== "Pending") return false;
      if (!m.date) return false;

      return isDeadlineInRange(m.date, startOfWeek, endOfWeek);
    }).length;

    // Count meetings due this month (status must be Pending) - FIXED
    const dueThisMonthCount = meetingsData.filter((m) => {
      if (m.status !== "Pending") return false;
      if (!m.date) return false;

      return isDeadlineInRange(m.date, startOfMonth, endOfMonth);
    }).length;

    console.log("📊 Meeting Summary counts:", {
      critical: criticalCount,
      important: importantCount,
      dueThisWeek: dueThisWeekCount,
      dueThisMonth: dueThisMonthCount,
      totalMeetings: meetingsData.length,
    });

    // Update the summary info
    setSummaryInfo((prev) => ({
      ...prev,
      meetings: [
        { label: "Critical", value: criticalCount },
        { label: "Important", value: importantCount },
        { label: "Due This Week", value: dueThisWeekCount },
        { label: "Due this month", value: dueThisMonthCount },
      ],
    }));
  };

  // Fetch meetings function
  const fetchMeetings = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/meetings?user_id=${userData.user.user_id}`
      );

      console.log(" Server response for meetings:", response.data);

      const mappedMeetings = response.data.data.map((serverMeeting, index) => {
        const status = serverMeeting.status || "Pending";

        return {
          id: serverMeeting.meeting_actions_id,
          dept: serverMeeting.department,
          subject: serverMeeting.subject,
          user_id: serverMeeting.user_id,
          sno: index + 1,
          date: serverMeeting.action_deadline
            ? new Date(serverMeeting.action_deadline)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0],
          mode: "In-person",
          // Removed decisions field
          assigned_by: serverMeeting.assigned_by || "",
          status: status,
          actions: serverMeeting.actions
            ? serverMeeting.actions.map((serverAction) => ({
                id: serverAction.actions_id,
                text: serverAction.action || "",
                deadline: serverAction.action_deadline
                  ? new Date(serverAction.action_deadline)
                      .toISOString()
                      .split("T")[0]
                  : "",
                status: serverAction.action_status || "Pending",
                assigned_to: serverAction.assigned_to || "",
                assigned_to_name: getUserNameById(serverAction.assigned_to),
              }))
            : [],
        };
      });

      console.log("📡 Final mapped meetings:", mappedMeetings);
      setMeetings(mappedMeetings);
      return mappedMeetings;
    } catch (error) {
      console.error("Error fetching meetings:", error);
      return false;
    }
  };

  const fetchDeleted = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/meetings?deleted=true&user_id=${userData.user.user_id}`
      );

      const mappedMeetings = response.data.data.map((serverMeeting, index) => {
        const status = serverMeeting.status || "Pending";

        return {
          id: serverMeeting.meeting_actions_id,
          dept: serverMeeting.department,
          subject: serverMeeting.subject,
          user_id: serverMeeting.user_id,
          sno: index + 1,
          date: serverMeeting.action_deadline
            ? new Date(serverMeeting.action_deadline)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0],
          mode: "In-person",
          // Removed decisions field
          assigned_by: serverMeeting.assigned_by || "",
          status: status,
          actions: serverMeeting.actions
            ? serverMeeting.actions.map((serverAction) => ({
                id: serverAction.actions_id,
                text: serverAction.action || "",
                deadline: serverAction.action_deadline
                  ? new Date(serverAction.action_deadline)
                      .toISOString()
                      .split("T")[0]
                  : "",
                status: serverAction.action_status || "Pending",
                assigned_to: serverAction.assigned_to || "",
                assigned_to_name: getUserNameById(serverAction.assigned_to),
              }))
            : [],
        };
      });

      setDeleted(mappedMeetings);
      return true;
    } catch (error) {
      console.error("Error fetching deleted meetings:", error);
      return false;
    }
  };

  // Fetch data when user data is ready - FIXED VERSION
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.user?.user_id) {
        return;
      }

      setIsLoading(true);
      try {
        const meetingsData = await fetchMeetings();
        await fetchDeleted();

        // ✅ Update summary counts after initial fetch with the actual data
        if (meetingsData) {
          console.log("🎯 Initial fetch - updating summary counts");
          updateSummaryCounts(meetingsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      fetchData();
    }
  }, [userData, userLoading]);

  // Update summary counts whenever meetings change - FIXED VERSION
  useEffect(() => {
    if (meetings.length > 0) {
      console.log("🔄 Meetings state changed, updating summary counts");
      updateSummaryCounts(meetings);
    }
  }, [meetings]);

  // Check if current user can edit/delete the meeting
  const canUserEditMeeting = (meeting) => {
    if (!userData?.user?.user_id) return false;

    return (
      userData.user.user_id === meeting.assigned_by ||
      meeting.actions?.some(
        (action) => userData.user.user_id === action.assigned_to
      )
    );
  };

  // Filter meetings based on filter text
  const applyFilter = (meetingsList, filterText) => {
    if (!filterText || filterText.trim() === "") {
      return meetingsList;
    }

    const dateRangeFilter = getDateRangeFilter(filterText);

    if (dateRangeFilter) {
      return meetingsList.filter((meeting) => {
        const meetingStatus = meeting.status || "Pending";

        if (meetingStatus !== "Pending") {
          return false;
        }

        // Compare the MAIN MEETING DATE, not action deadlines - FIXED
        if (!meeting.date) return false;
        return isDeadlineInRange(
          meeting.date,
          dateRangeFilter.start,
          dateRangeFilter.end
        );
      });
    }

    const lowerFilter = filterText.toLowerCase();
    const statusMatch = statusOptions.some(
      (status) => status.toLowerCase() === lowerFilter
    );

    if (statusMatch) {
      return meetingsList.filter((meeting) => {
        const meetingStatus = meeting.status || "Pending";
        return meetingStatus.toLowerCase() === lowerFilter;
      });
    }

    return meetingsList.filter((meeting) => {
      const meetingStatus = meeting.status || "Pending";

      return (
        meetingStatus.toLowerCase().includes(lowerFilter) ||
        meeting.dept?.toLowerCase().includes(lowerFilter) ||
        meeting.subject?.toLowerCase().includes(lowerFilter) ||
        meeting.actions?.some(
          (action) =>
            action.text?.toLowerCase().includes(lowerFilter) ||
            action.status?.toLowerCase().includes(lowerFilter) ||
            action.assigned_to_name?.toLowerCase().includes(lowerFilter)
        )
      );
    });
  };

  // Apply filter whenever meetings, deleted, or filter changes
  useEffect(() => {
    setFilteredMeetings(applyFilter(meetings, filter));
  }, [meetings, filter]);

  useEffect(() => {
    setFilteredDeleted(applyFilter(deleted, filter));
  }, [deleted, filter]);

  // Initialize with first department selected
  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0]);
    }
  }, [departments, selectedDept]);

  const startMeeting = (e) => {
    e.stopPropagation();

    if (!selectedDept) {
      alert("Select department");
      return;
    }

    if (!selectedSubject.trim()) {
      alert("Enter subject");
      return;
    }

    setCurrentSession({
      dept: selectedDept,
      subject: selectedSubject.trim(),
      actions: [],
    });

    setMeetingForm({
      date: new Date().toISOString().split("T")[0],
      mode: "In-person",
      // Removed decisions field
      assigned_by: userData?.user?.user_id,
      status: "Pending",
    });

    setActionText("");
    setActionDeadline("");
    setActionAssignedTo("");
    setSavedActions([]);
    setShowMeetingArea(true);
  };

  const addActionInput = () => {
    if (!actionText.trim()) {
      alert("Enter action description");
      return;
    }

    const newAction = {
      text: actionText.trim(),
      deadline: actionDeadline,
      assigned_to: actionAssignedTo,
      assigned_to_name: getUserNameById(actionAssignedTo),
      status: "Pending",
      id: Date.now() + Math.random(),
    };

    setSavedActions([...savedActions, newAction]);
    setActionText("");
    setActionDeadline("");
    setActionAssignedTo("");
  };

  const saveMeeting = async () => {
    if (!currentSession) return;

    // Set loading state
    setLoading((prev) => ({ ...prev, save: true }));

    const newMeeting = {
      id: Date.now().toString(),
      dept: currentSession.dept,
      subject: currentSession.subject,
      date: meetingForm.date,
      mode: meetingForm.mode,
      // Removed decisions field
      assigned_by: userData?.user?.user_id,
      status: meetingForm.status,
      actions: savedActions,
    };

    try {
      const meetingData = {
        department: newMeeting.dept,
        subject: newMeeting.subject,
        action_deadline: newMeeting.date,
        // Removed action/decisions field
        assigned_by: userData?.user?.user_id,
        user_id: userData?.user?.user_id,
        status: newMeeting.status,
        actions: newMeeting.actions.map((action) => ({
          action: action.text,
          action_deadline: action.deadline,
          action_status: action.status,
          assigned_to: action.assigned_to,
        })),
      };

      console.log("📡 Sending meeting data to API:", meetingData);

      const response = await axios.post(
        `${gapi}/meeting_actions?user_id=${userData?.user?.user_id}`,
        meetingData
      );

      console.log("📡 API response after saving:", response.data);

      if (response.data) {
        const serverMeeting = response.data;
        newMeeting.id = serverMeeting.meeting_actions_id;

        if (
          serverMeeting.actions &&
          serverMeeting.actions.length === newMeeting.actions.length
        ) {
          newMeeting.actions = newMeeting.actions.map((action, index) => ({
            ...action,
            id: serverMeeting.actions[index].actions_id || action.id,
          }));
        }
      }

      // ✅ Update meetings state first, then summary counts will update automatically via useEffect
      const updatedMeetings = [newMeeting, ...meetings];
      setMeetings(updatedMeetings);

      setShowMeetingArea(false);
      setCurrentSession(null);
      setActionText("");
      setActionDeadline("");
      setActionAssignedTo("");
      setSavedActions([]);
      setExpandedMeeting(null);
      setSelectedSubject("");
      setToast({
        message: `${meetingData.subject} inserted successfully`,
        type: "success",
      });
    } catch (error) {
      console.error("Error saving meeting to API:", error);
      setToast({
        message: `${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
      });
    } finally {
      // Reset loading state
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const deleteMeeting = async (id) => {
    if (
      window.confirm(
        `${
          recycleBin
            ? "Delete this meeting note permanently"
            : "Delete this meeting note into recycle bin"
        }`
      )
    ) {
      // Set loading state for this specific meeting
      setLoading((prev) => ({ ...prev, delete: id }));

      try {
        const meetingToDelete = meetings.find((meeting) => meeting.id === id);
        const permanent = recycleBin ? true : false;

        if (recycleBin) {
          await axios.delete(
            `${gapi}/meetings?permanent=${permanent}&meeting_actions_id=${id}&user_id=${userData?.user?.user_id}`
          );
          const updatedDeleted = deleted.filter((meeting) => meeting.id !== id);
          setDeleted(updatedDeleted);
        } else {
          // Move to recycle bin
          if (meetingToDelete) {
            const updatedMeetings = meetings.filter(
              (meeting) => meeting.id !== id
            );
            setMeetings(updatedMeetings);
            setDeleted((prevDeleted) => [...prevDeleted, meetingToDelete]);
          }

          await axios.delete(
            `${gapi}/meetings?permanent=${permanent}&meeting_actions_id=${id}&user_id=${userData?.user?.user_id}`
          );
        }

        setToast({
          message: `Meeting ${
            recycleBin ? "permanently deleted" : "moved to recycle bin"
          }`,
          type: "success",
        });

        if (expandedMeeting === id) {
          setExpandedMeeting(null);
        }
      } catch (error) {
        console.error("Error deleting meeting from API:", error);
        setToast({
          message: `${error.errorMessage || "Internal Server Error"}`,
          type: "error",
        });
      } finally {
        // Reset loading state
        setLoading((prev) => ({ ...prev, delete: null }));
      }
    }
  };

  const endMeeting = () => {
    setShowMeetingArea(false);
    setCurrentSession(null);
    setActionText("");
    setActionDeadline("");
    setActionAssignedTo("");
    setSavedActions([]);
  };

  const toggleMeetingDetails = (meetingId) => {
    setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId);
  };

  // Function to update meeting status
  const updateMeetingStatus = async (meetingId, newStatus) => {
    // Set loading state for this specific meeting
    setLoading((prev) => ({ ...prev, statusUpdate: meetingId }));

    try {
      console.log(`📡 Updating meeting ${meetingId} status to:`, newStatus);

      await axios.put(
        `${gapi}/meetings?meeting_actions_id=${meetingId}&user_id=${userData?.user?.user_id}`,
        { status: newStatus }
      );

      // Update locally - this will trigger the useEffect that updates summary counts
      const updatedMeetings = meetings.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, status: newStatus } : meeting
      );
      setMeetings(updatedMeetings);

      // setToast({
      //   message: `Status updated to ${newStatus}`,
      //   type: "success",
      // });
      setToast({
        message: `Action status updated to ${newStatus}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating meeting status:", error);
      setToast({
        message: `Error updating status: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
      });
    } finally {
      // Reset loading state
      setLoading((prev) => ({ ...prev, statusUpdate: null }));
    }
  };

  // Function to update action status
  const updateActionStatus = async (meetingId, actionId, newStatus) => {
    // Set loading state for this specific action
    setLoading((prev) => ({ ...prev, actionStatusUpdate: actionId }));

    try {
      // Update locally - this will trigger the useEffect that updates summary counts
      const updatedMeetings = meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const updatedActions = meeting.actions.map((action) =>
            action.id === actionId ? { ...action, status: newStatus } : action
          );
          return { ...meeting, actions: updatedActions };
        }
        return meeting;
      });

      setMeetings(updatedMeetings);

      // Also update on server if needed
      await axios.put(
        `${gapi}/meeting_actions?actions_id=${actionId}&user_id=${userData?.user?.user_id}`,
        { action_status: newStatus }
      );
      setToast({
        message: `Action status updated to ${newStatus}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating action status:", error);
      setToast({
        message: `Error updating action status: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
      });
    } finally {
      // Reset loading state
      setLoading((prev) => ({ ...prev, actionStatusUpdate: null }));
    }
  };

  const toggleHistory = (recordId) => {
    setOpenHistoryId((prevId) => (prevId === recordId ? null : recordId));
  };

  const clearFilter = () => {
    setFilter("");
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Critical":
        return "meeting-status-critical";
      case "Important":
        return "meeting-status-important";
      case "Pending":
        return "meeting-status-pending";
      default:
        return "meeting-status-pending";
    }
  };

  // Mobile Card Component
  const MobileMeetingCard = ({ meeting, isDeleted }) => (
    <div
      className={`meeting-mobile-card ${
        expandedMeeting === meeting.id ? "expanded" : ""
      }`}
      onClick={() => toggleMeetingDetails(meeting.id)}
    >
      <div className="meeting-mobile-card-header">
        <div className="meeting-mobile-card-title">
          <span className="meeting-mobile-sno">{meeting.sno}.</span>
          <div>
            <div className="meeting-mobile-dept">{meeting.dept}</div>
            <div className="meeting-mobile-subject">{meeting.subject}</div>
          </div>
        </div>
        <div className="meeting-mobile-status-badge meeting-mobile-mode">
          {meeting.mode}
        </div>
      </div>

      <div className="meeting-mobile-card-body">
        <div className="meeting-mobile-field">
          <label>Date:</label>
          <span>{meeting.date}</span>
        </div>
        <div className="meeting-mobile-field">
          <label>Status:</label>
          <span
            className={`meeting-status-badge ${getStatusBadgeClass(
              meeting.status
            )}`}
          >
            {meeting.status}
          </span>
        </div>

        <div className="meeting-mobile-field">
          <label>Assigned By:</label>
          <span className="meeting-mobile-assigned">
            {getUserNameById(meeting.assigned_by)}
          </span>
        </div>
      </div>

      {expandedMeeting === meeting.id && (
        <div className="meeting-mobile-card-details">
          <div className="meeting-mobile-actions-section">
            <label>Action Items:</label>
            {meeting.actions && meeting.actions.length > 0 ? (
              <div className="meeting-mobile-actions-list">
                {meeting.actions.map((action, actionIndex) => (
                  <div key={action.id} className="meeting-mobile-action-item">
                    <div className="meeting-mobile-action-header">
                      <span className="meeting-mobile-action-number">
                        {actionIndex + 1}.
                      </span>
                      <span className="meeting-mobile-action-text">
                        {action.text}
                      </span>
                    </div>
                    <div className="meeting-mobile-action-details">
                      <span className="meeting-mobile-action-deadline">
                        {action.deadline || "No deadline"}
                      </span>
                      <span className="meeting-mobile-action-assigned">
                        {action.assigned_to_name || "Unassigned"}
                      </span>
                      <span
                        className={`meeting-mobile-action-status meeting-mobile-action-status-${action.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {action.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="meeting-mobile-empty">
                No actions for this meeting
              </div>
            )}
          </div>
        </div>
      )}

      <div className="meeting-mobile-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleHistory(meeting.MT_id);
          }}
          className="meeting-btn meeting-btn-small"
        >
          History
        </button>
        {openHistoryId === meeting.MT_id && (
          <History
            record_id={meeting.MT_id}
            setHistoryOpen={setOpenHistoryId}
          />
        )}
        {canUserEditMeeting(meeting) && !isDeleted ? (
          <button
            className="meeting-btn meeting-btn-small delete"
            onClick={(e) => {
              e.stopPropagation();
              deleteMeeting(meeting.id);
            }}
            disabled={loading.delete === meeting.id}
          >
            {loading.delete === meeting.id ? "Deleting..." : <Deleteic />}
          </button>
        ) : (
          !isDeleted && (
            <span className="meeting-mobile-not-owner">Not the owner</span>
          )
        )}
      </div>
    </div>
  );

  // Show loading/error states
  if (userLoading) {
    return (
      <div className="meeting-page-content">
        <div className="meeting-card">
          <div className="meeting-loading">Loading user session...</div>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="meeting-page-content">
        <div className="meeting-card">
          <div className="meeting-error">
            <h3>Authentication Required</h3>
            <p>Please log in to access meeting features.</p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="meeting-btn"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="meeting-page-content">
        <div className="meeting-card">
          <div className="meeting-loading">Loading meeting data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-page-content">
      <div className="meeting-wrap">
        <div className="meeting-card">
          <h1 className="meeting-title">
            Meeting Notes & Action Tracker {recycleBin && "> recycle bin"}{" "}
          </h1>
          <p className="meeting-muted">
            Select Department and Subject. Add action items during the meeting
            with deadlines. Status appears after saving.
          </p>

          {/* Show active filter badge */}
          {filter && (
            <div
              style={{
                marginBottom: "15px",
                padding: "8px 12px",
                backgroundColor: "#e3f2fd",
                border: "1px solid #2196f3",
                borderRadius: "4px",
                color: "#1976d2",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                🔍 Filtering by: <strong>{filter}</strong>
                {filterToPage && filterToPage === filter && " (from dashboard)"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1976d2",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "12px",
                }}
              >
                Clear Filter
              </button>
            </div>
          )}

          <div className="meeting-section">
            <div className="meeting-filter">
              <input
                type="text"
                className="meeting-filter-input"
                placeholder="Filter meeting by status / department / assigned to"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button
                className="meeting-btn meeting-btn-ghost meeting-btn-small"
                onClick={clearFilter}
              >
                Clear
              </button>
              <button
                className="legal-policy-btn legal-policy-btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecycleBin((prev) => !prev);
                }}
              >
                <Binic />
              </button>
            </div>
            {recycleBin ? null : (
              <div className="meeting-row">
                <div className="meeting-col meeting-col-medium">
                  <label htmlFor="department" className="meeting-label">
                    Department
                  </label>
                  <select
                    id="department"
                    className="meeting-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="meeting-col meeting-col-large">
                  <label htmlFor="subject" className="meeting-label">
                    Subject
                  </label>
                  <div className="meeting-input-group">
                    <input
                      type="text"
                      className="meeting-input"
                      placeholder="Enter meeting subject"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && startMeeting()}
                    />
                  </div>
                </div>

                {!showMeetingArea && (
                  <div className="meeting-col-auto">
                    <button className="meeting-btn" onClick={startMeeting}>
                      Start Meeting
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Level 2: Meeting form */}
          {showMeetingArea && !recycleBin && (
            <div className="meeting-meeting-area">
              <div className="meeting-card meeting-card-inner">
                <div className="meeting-row">
                  <div className="meeting-col meeting-col-small">
                    <label htmlFor="meetingDate" className="meeting-label">
                      Date of Meeting
                    </label>
                    <input
                      type="date"
                      id="meetingDate"
                      className="meeting-input"
                      value={meetingForm.date}
                      onChange={(e) =>
                        setMeetingForm({ ...meetingForm, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="meeting-col meeting-col-small">
                    <label htmlFor="mode" className="meeting-label">
                      Mode
                    </label>
                    <select
                      id="mode"
                      className="meeting-select"
                      value={meetingForm.mode}
                      onChange={(e) =>
                        setMeetingForm({ ...meetingForm, mode: e.target.value })
                      }
                    >
                      <option>In-person</option>
                      <option>Video Conference</option>
                      <option>Hybrid</option>
                    </select>
                  </div>

                  <div className="meeting-col meeting-col-small">
                    <label htmlFor="status" className="meeting-label">
                      Status
                    </label>
                    <select
                      id="status"
                      className="meeting-select"
                      value={meetingForm.status}
                      onChange={(e) =>
                        setMeetingForm({
                          ...meetingForm,
                          status: e.target.value,
                        })
                      }
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="meeting-divider" />

                <h3 className="meeting-subtitle">Action Items</h3>

                <div className="meeting-action-inputs">
                  <div className="meeting-row meeting-row-compact">
                    <div className="meeting-col">
                      <input
                        type="text"
                        className="meeting-input"
                        placeholder="Action description"
                        value={actionText}
                        onChange={(e) => setActionText(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && addActionInput()
                        }
                      />
                    </div>

                    <div className="meeting-col meeting-col-small">
                      <input
                        type="date"
                        className="meeting-input"
                        value={actionDeadline}
                        onChange={(e) => {
                          e.stopPropagation();
                          setActionDeadline(e.target.value);
                        }}
                      />
                    </div>

                    <div className="meeting-col">
                      {/* <select
                        className="meeting-select"
                        value={actionAssignedTo}
                        onChange={(e) => setActionAssignedTo(e.target.value)}
                      >
                        <option value="">Assign Action To</option>
                        {allUsers.map((user) => (
                          <option key={user.cs_user_id} value={user.cs_user_id}>
                            {user.cs_user_name}
                          </option>
                        ))}
                      </select> */}

                      <select
                        className="meeting-select"
                        value={actionAssignedTo}
                        onChange={(e) => setActionAssignedTo(e.target.value)}
                      >
                        <option value="">Assign Action To</option>
                        {allUsers
                          .filter(
                            (u) => u.cs_user_id !== userData?.user?.user_id
                          ) // <-- hide yourself
                          .map((user) => (
                            <option
                              key={user.cs_user_id}
                              value={user.cs_user_id}
                            >
                              {user.cs_user_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  className="meeting-btn meeting-btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    addActionInput();
                  }}
                >
                  Add Action
                </button>

                <table className="meeting-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Action</th>
                      <th>Deadline</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedActions.map((action, index) => (
                      <tr key={action.id}>
                        <td>{index + 1}</td>
                        <td>{action.text}</td>
                        <td>{action.deadline || "-"}</td>
                        <td>{action.assigned_to_name || "Unassigned"}</td>
                        <td className="meeting-status-pending">
                          {action.status}
                        </td>
                        <td>
                          <button
                            className="meeting-btn meeting-btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSavedActions(
                                savedActions.filter((a) => a.id !== action.id)
                              );
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="meeting-form-actions">
                  <button
                    className="meeting-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveMeeting();
                    }}
                    disabled={loading.save}
                  >
                    {loading.save ? "Saving..." : "Save Meeting"}
                  </button>
                  <button
                    className="meeting-btn meeting-btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      endMeeting();
                    }}
                    disabled={loading.save}
                  >
                    End / Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="meeting-meetings-list">
            <h3 className="meeting-subtitle">
              Saved Meetings{" "}
              {filter && `(Filtered: ${filteredMeetings.length})`}
            </h3>

            {/* Desktop Table View */}
            <div className="tablecon">
              <table className="meeting-table">
                <thead>
                  <tr>
                    <th>Sl</th>
                    <th>Dept</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Assigned By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="meeting-meeting-body">
                  {recycleBin ? (
                    filteredDeleted.length > 0 ? (
                      filteredDeleted.map((meeting, index) => (
                        <React.Fragment key={meeting.id}>
                          <tr
                            className="meeting-meeting-row"
                            onClick={() => toggleMeetingDetails(meeting.id)}
                          >
                            <td>{index + 1}</td>
                            <td>{meeting.dept}</td>
                            <td>{meeting.subject}</td>
                            <td>{meeting.date}</td>
                            <td>{getUserNameById(meeting.assigned_by)}</td>
                            <td>
                              <span
                                className={`meeting-status-badge ${getStatusBadgeClass(
                                  meeting.status
                                )}`}
                              >
                                {meeting.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="iconcon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMeeting(meeting.id);
                                }}
                                disabled={loading.delete === meeting.id}
                              >
                                {loading.delete === meeting.id ? (
                                  "Deleting..."
                                ) : (
                                  <Deleteic />
                                )}
                              </button>
                            </td>
                          </tr>

                          {expandedMeeting === meeting.id && (
                            <tr className="meeting-details-row">
                              <td colSpan="7">
                                <div className="meeting-details">
                                  <div>
                                    <strong>Assigned By:</strong>{" "}
                                    {getUserNameById(meeting.assigned_by)}
                                  </div>
                                  <div>
                                    <strong>Status:</strong>{" "}
                                    <span
                                      className={`meeting-status-badge ${getStatusBadgeClass(
                                        meeting.status
                                      )}`}
                                    >
                                      {meeting.status}
                                    </span>
                                  </div>

                                  <div style={{ marginTop: "12px" }}>
                                    <strong>Actions:</strong>
                                    {meeting.actions &&
                                    meeting.actions.length > 0 ? (
                                      <table className="meeting-table meeting-table-nested">
                                        <thead>
                                          <tr>
                                            <th>#</th>
                                            <th>Action</th>
                                            <th>Deadline</th>
                                            <th>Assigned To</th>
                                            <th>Status</th>
                                            <th>Update</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {meeting.actions.map(
                                            (action, actionIndex) => (
                                              <tr key={action.id}>
                                                <td>{actionIndex + 1}</td>
                                                <td>{action.text}</td>
                                                <td>
                                                  {action.deadline || "-"}
                                                </td>
                                                <td>
                                                  {action.assigned_to_name ||
                                                    "Unassigned"}
                                                </td>
                                                <td
                                                  className={
                                                    action.status === "Pending"
                                                      ? "meeting-status-pending"
                                                      : "meeting-status-completed"
                                                  }
                                                >
                                                  {action.status}
                                                </td>
                                                <td>
                                                  <select
                                                    value={action.status}
                                                    onChange={(e) =>
                                                      updateActionStatus(
                                                        meeting.id,
                                                        action.id,
                                                        e.target.value
                                                      )
                                                    }
                                                    className="meeting-select meeting-select-small"
                                                    disabled={
                                                      loading.actionStatusUpdate ===
                                                      action.id
                                                    }
                                                  >
                                                    <option value="Pending">
                                                      Pending
                                                    </option>
                                                    <option value="In Progress">
                                                      In Progress
                                                    </option>
                                                    <option value="Completed">
                                                      Completed
                                                    </option>
                                                  </select>
                                                  {loading.actionStatusUpdate ===
                                                    action.id && (
                                                    <span
                                                      style={{
                                                        marginLeft: "5px",
                                                        fontSize: "12px",
                                                      }}
                                                    >
                                                      Updating...
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            )
                                          )}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="meeting-muted">
                                        No actions for this meeting
                                      </div>
                                    )}
                                  </div>

                                  {canUserEditMeeting(meeting) && (
                                    <div style={{ marginTop: "12px" }}>
                                      <strong>Update Meeting Status:</strong>
                                      <select
                                        value={meeting.status}
                                        onChange={(e) =>
                                          updateMeetingStatus(
                                            meeting.id,
                                            e.target.value
                                          )
                                        }
                                        className="meeting-select meeting-select-small"
                                        style={{ marginLeft: "10px" }}
                                        disabled={
                                          loading.statusUpdate === meeting.id
                                        }
                                      >
                                        {statusOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                      {loading.statusUpdate === meeting.id && (
                                        <span
                                          style={{
                                            marginLeft: "5px",
                                            fontSize: "12px",
                                          }}
                                        >
                                          Updating...
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="meeting-no-data">
                          {filter
                            ? `No deleted meetings match "${filter}"`
                            : "No deleted meetings found"}
                        </td>
                      </tr>
                    )
                  ) : filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting, index) => (
                      <React.Fragment key={meeting.id}>
                        <tr
                          className="meeting-meeting-row"
                          onClick={() => toggleMeetingDetails(meeting.id)}
                        >
                          <td>{index + 1}</td>
                          <td>{meeting.dept}</td>
                          <td>{meeting.subject}</td>
                          <td>{meeting.date}</td>
                          <td>{getUserNameById(meeting.assigned_by)}</td>
                          <td>
                            <span
                              className={`meeting-status-badge ${getStatusBadgeClass(
                                meeting.status
                              )}`}
                            >
                              {meeting.status}
                            </span>
                          </td>
                          <td>
                            {canUserEditMeeting(meeting) ? (
                              <button
                                className="iconcon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMeeting(meeting.id);
                                }}
                                disabled={loading.delete === meeting.id}
                              >
                                {loading.delete === meeting.id ? (
                                  "Deleting..."
                                ) : (
                                  <Deleteic />
                                )}
                              </button>
                            ) : (
                              "Not the owner"
                            )}
                          </td>
                        </tr>

                        {expandedMeeting === meeting.id && (
                          <tr className="meeting-details-row">
                            <td colSpan="7">
                              <div className="meeting-details">
                                <div>
                                  <strong>Assigned By:</strong>{" "}
                                  {getUserNameById(meeting.assigned_by)}
                                </div>
                                <div>
                                  <strong>Status:</strong>{" "}
                                  <span
                                    className={`meeting-status-badge ${getStatusBadgeClass(
                                      meeting.status
                                    )}`}
                                  >
                                    {meeting.status}
                                  </span>
                                </div>

                                <div style={{ marginTop: "12px" }}>
                                  <strong>Actions:</strong>
                                  {meeting.actions &&
                                  meeting.actions.length > 0 ? (
                                    <table className="meeting-table meeting-table-nested">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Action</th>
                                          <th>Deadline</th>
                                          <th>Assigned To</th>
                                          <th>Status</th>
                                          <th>Update</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {meeting.actions.map(
                                          (action, actionIndex) => (
                                            <tr key={action.id}>
                                              <td>{actionIndex + 1}</td>
                                              <td>{action.text}</td>
                                              <td>{action.deadline || "-"}</td>
                                              <td>
                                                {action.assigned_to_name ||
                                                  "Unassigned"}
                                              </td>
                                              <td
                                                className={
                                                  action.status === "Pending"
                                                    ? "meeting-status-pending"
                                                    : "meeting-status-completed"
                                                }
                                              >
                                                {action.status}
                                              </td>
                                              <td>
                                                <select
                                                  value={action.status}
                                                  onChange={(e) =>
                                                    updateActionStatus(
                                                      meeting.id,
                                                      action.id,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="meeting-select meeting-select-small"
                                                  disabled={
                                                    loading.actionStatusUpdate ===
                                                    action.id
                                                  }
                                                >
                                                  <option value="Pending">
                                                    Pending
                                                  </option>
                                                  <option value="In Progress">
                                                    In Progress
                                                  </option>
                                                  <option value="Completed">
                                                    Completed
                                                  </option>
                                                </select>
                                                {loading.actionStatusUpdate ===
                                                  action.id && (
                                                  <span
                                                    style={{
                                                      marginLeft: "5px",
                                                      fontSize: "12px",
                                                    }}
                                                  >
                                                    Updating...
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="meeting-muted">
                                      No actions for this meeting
                                    </div>
                                  )}
                                </div>

                                {canUserEditMeeting(meeting) && (
                                  <div style={{ marginTop: "12px" }}>
                                    <strong>Update Meeting Status:</strong>
                                    <select
                                      value={meeting.status}
                                      onChange={(e) =>
                                        updateMeetingStatus(
                                          meeting.id,
                                          e.target.value
                                        )
                                      }
                                      className="meeting-select meeting-select-small"
                                      style={{ marginLeft: "10px" }}
                                      disabled={
                                        loading.statusUpdate === meeting.id
                                      }
                                    >
                                      {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    {loading.statusUpdate === meeting.id && (
                                      <span
                                        style={{
                                          marginLeft: "5px",
                                          fontSize: "12px",
                                        }}
                                      >
                                        Updating...
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="meeting-no-data">
                        {filter
                          ? `No meetings match "${filter}"`
                          : "No meetings added yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="meeting-mobile-container">
              {!recycleBin
                ? filteredMeetings.map((meeting) => (
                    <MobileMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      isDeleted={false}
                    />
                  ))
                : filteredDeleted.map((meeting) => (
                    <MobileMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      isDeleted={true}
                    />
                  ))}

              {filteredMeetings.length === 0 && !recycleBin && (
                <div className="meeting-mobile-empty">
                  {filter
                    ? `No meetings match "${filter}"`
                    : "No meetings found"}
                </div>
              )}

              {filteredDeleted.length === 0 && recycleBin && (
                <div className="meeting-mobile-empty">
                  {filter
                    ? `No deleted meetings match "${filter}"`
                    : "No deleted meetings found"}
                </div>
              )}
            </div>
          </div>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
              duration={3000}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingMode;

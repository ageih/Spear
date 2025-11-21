import React, { useState, useEffect } from "react";
import "./LetterTracker.css";
import axios from "axios";
import { gapi } from "./GlobalAPI";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useUserSession } from "../montok/component/useUserSession";
import { useUser } from "../LevelContext";
import { Deleteic, Editic } from "../montok/component/UseIcons";

const LetterTracker = ({ filterToPage, setSummaryInfo }) => {
  const contextuser = useUser();
  const valueuser = contextuser?.levelUser;

  // Use the new user session hook
  const {
    userData,
    isLoading: userLoading,
    error: userError,
  } = useUserSession();

  const [letters, setLetters] = useState([]);
  const [deletedLetters, setDeletedLetters] = useState([]);
  const [filter, setFilter] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    assigned_to: [], // Changed to array for multiple users
  });
  const [previousFormData, setPreviousFormData] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleted, setDeleted] = useState([]);
  const [showBin, setShowBin] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);
  const [isloading, setIsLoading] = useState(true);

  // Effect to automatically set filter when filterToPage changes
  useEffect(() => {
    if (filterToPage.trim() === "" || filterToPage) {
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

    if (filterLower.includes("due this year")) {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return { type: "year", start: startOfYear, end: endOfYear };
    }

    return null;
  };

  // Check if letter is pending
  const isLetterPending = (letter) => {
    const status = (letter.status || "").toLowerCase();
    return (
      status === "pending" || status === "in progress" || status === "open"
    );
  };

  // Check if deadline is within date range
  const isDeadlineInRange = (deadline, start, end) => {
    if (!deadline || deadline === "N/A" || deadline === "") return false;

    try {
      const datePart = deadline.split(" ")[0];
      const deadlineDate = new Date(datePart);

      if (isNaN(deadlineDate.getTime())) {
        console.error("Invalid deadline date after parsing:", deadline);
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
    if (!valueuser) {
      return [];
    }

    console.log("herer checking for leveluser in memo", valueuser);

    const users = [];

    Object.keys(valueuser).forEach((key) => {
      if (Array.isArray(valueuser[key])) {
        users.push(...valueuser[key]);
      }
    });

    setIsLoading(false);
    return users;
  }, [valueuser]);

  const getUserNameById = (userId) => {
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
  };

  // Get user names for multiple assigned users
  const getAssignedUserNames = (userIds) => {
    if (!userIds || !Array.isArray(userIds)) return ["Unassigned"];
    return userIds
      .map((userId) => getUserNameById(userId))
      .filter((name) => name !== "Unassigned");
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Initialize form with user data when available
  useEffect(() => {
    if (userData?.user?.user_id) {
      setFormData((prev) => ({
        ...prev,
        assigned_by: userData.user.user_id,
        user_id: userData.user.user_id,
        assigned_to: [], // Initialize as empty array
      }));
    }
  }, [userData]);

  // Fetch letters only when user and allUsers are available
  useEffect(() => {
    if (!userLoading && !isloading && userData?.user?.user_id) {
      console.log("✅ Everything ready, fetching letters...");
      fetchLetters();
      fetchDeletedLetters();
    }
  }, [userLoading, isloading, userData]);

  // Update summary counts
  const updateSummaryCounts = (updatedLetters) => {
    if (!setSummaryInfo) return;

    const today = new Date();

    const importantCount = updatedLetters.filter(
      (l) => !l.deleted && l.status && l.status.toLowerCase() === "important"
    ).length;

    const criticalCount = updatedLetters.filter(
      (l) => !l.deleted && l.status && l.status.toLowerCase() === "critical"
    ).length;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const dueThisWeekCount = updatedLetters.filter((l) => {
      if (l.deleted || !isLetterPending(l)) return false;
      return isDeadlineInRange(l.letter_date, startOfWeek, endOfWeek);
    }).length;

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dueThisMonthCount = updatedLetters.filter((l) => {
      if (l.deleted || !isLetterPending(l)) return false;
      return isDeadlineInRange(l.letter_date, startOfMonth, endOfMonth);
    }).length;

    const totalCount = updatedLetters.filter((l) => !l.deleted).length;

    setSummaryInfo((prev) => ({
      ...prev,
      communications: [
        { label: "Important", value: importantCount },
        { label: "Critical", value: criticalCount },
        { label: "Due This Week", value: dueThisWeekCount },
        { label: "Due this month", value: dueThisMonthCount },
      ],
    }));
  };

  // Separate function for fetching letters
  const fetchLetters = async () => {
    try {
      if (!userData?.user?.user_id) {
        return;
      }

      setLoading(true);
      const apiUrl = `${gapi}/LT?user_id=${userData.user.user_id}&deleted=false`;

      const response = await axios.get(apiUrl);

      let lettersFromAPI = [];
      if (Array.isArray(response.data)) {
        lettersFromAPI = response.data;
      } else if (
        response.data.response &&
        Array.isArray(response.data.response)
      ) {
        lettersFromAPI = response.data.response;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        lettersFromAPI = response.data.data;
      } else {
        console.error("❌ Unexpected API response structure:", response.data);
        lettersFromAPI = [];
      }

      const processedLetters = lettersFromAPI.map((letter) => {
        // Handle both single user and multiple users assignment
        const assignedTo = Array.isArray(letter.assigned_to)
          ? letter.assigned_to
          : letter.assigned_to
          ? [letter.assigned_to]
          : [];

        const mappedLetter = {
          LT_id: letter.LT_id,
          date_of_dispatch: letter.date_of_dispatch,
          letter_subject: letter.letter_subject,
          letter_number: letter.letter_number,
          description: letter.description,
          assigned_to: assignedTo,
          assigned_to_names: getAssignedUserNames(assignedTo),
          letter_date: letter.letter_date,
          status: letter.status,
          assigned_by: letter.assigned_by,
          assigned_by_name: getUserNameById(letter.assigned_by),
          current_stage: letter.current_stage,
          created_at: letter.created_at,
          updated_at: letter.updated_at,
          comment: letter.comment,
          user_id: letter.user_id,
          deleted: letter.deleted || false,
          isEdited:
            !!letter.updated_at && letter.updated_at !== letter.created_at,
        };

        return mappedLetter;
      });

      // Append new letters to existing array instead of replacing
      setLetters((prev) => {
        const existingIds = new Set(prev.map((l) => l.LT_id));
        const newLetters = processedLetters.filter(
          (l) => !existingIds.has(l.LT_id)
        );
        return [...newLetters, ...prev]; // New letters at the top
      });

      updateSummaryCounts([...processedLetters, ...letters]);
    } catch (error) {
      console.error("❌ Error fetching letters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedLetters = async () => {
    try {
      if (!userData?.user?.user_id) {
        return;
      }

      const apiUrl = `${gapi}/LT?user_id=${userData.user.user_id}&deleted=true&user_fetch=true`;

      const response = await axios.get(apiUrl);

      let lettersFromAPI = [];
      if (Array.isArray(response.data)) {
        lettersFromAPI = response.data;
      } else if (
        response.data.response &&
        Array.isArray(response.data.response)
      ) {
        lettersFromAPI = response.data.response;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        lettersFromAPI = response.data.data;
      } else {
        lettersFromAPI = [];
      }

      const processedLetters = lettersFromAPI.map((letter) => {
        const assignedTo = Array.isArray(letter.assigned_to)
          ? letter.assigned_to
          : letter.assigned_to
          ? [letter.assigned_to]
          : [];

        const mappedLetter = {
          LT_id: letter.LT_id,
          date_of_dispatch: letter.date_of_dispatch,
          letter_subject: letter.letter_subject,
          letter_number: letter.letter_number,
          description: letter.description,
          assigned_to: assignedTo,
          assigned_to_names: getAssignedUserNames(assignedTo),
          letter_date: letter.letter_date,
          status: letter.status,
          assigned_by: letter.assigned_by,
          assigned_by_name: getUserNameById(letter.assigned_by),
          current_stage: letter.current_stage,
          created_at: letter.created_at,
          updated_at: letter.updated_at,
          user_id: letter.user_id,
          deleted: letter.deleted || false,
          isEdited:
            !!letter.updated_at && letter.updated_at !== letter.created_at,
        };

        return mappedLetter;
      });

      setDeletedLetters((prev) => {
        const existingIds = new Set(prev.map((l) => l.LT_id));
        const newLetters = processedLetters.filter(
          (l) => !existingIds.has(l.LT_id)
        );
        return [...newLetters, ...prev];
      });
    } catch (error) {
      console.error("❌ Error fetching deleted letters:", error);
    }
  };

  // Refresh data when switching between active and bin
  useEffect(() => {
    if (!userData?.user?.user_id || isloading) return;

    if (!showBin) {
      fetchLetters();
    } else {
      fetchDeletedLetters();
    }
  }, [showBin, userData, isloading]);

  const fetchHistory = async (data) => {
    try {
      if (!userData?.user?.user_id) {
        return;
      }

      const response = await axios.get(
        `${gapi}/fetch-history?user_id=${userData.user.user_id}&record_id=${data.LT_id}`
      );
      setHistory(response.data.response || response.data);
    } catch (e) {
      console.error("❌ Error fetching history:", e);
    }
  };

  const openHistory = async (data) => {
    setHistoryOpen(true);
    await fetchHistory(data);
  };

  // Handle multi-user selection
  const handleUserSelection = (userId) => {
    setFormData((prev) => {
      const currentAssigned = prev.assigned_to || [];
      const isSelected = currentAssigned.includes(userId);

      if (isSelected) {
        return {
          ...prev,
          assigned_to: currentAssigned.filter((id) => id !== userId),
        };
      } else {
        return {
          ...prev,
          assigned_to: [...currentAssigned, userId],
        };
      }
    });
  };

  // Handle Save (Add / Edit)
  const handleSave = async () => {
    if (!userData?.user?.user_id) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    // Validate assigned_to
    if (!formData.assigned_to || formData.assigned_to.length === 0) {
      alert("Please assign at least one user.");
      return;
    }

    const confirmSave = window.confirm("Do you want to save changes?");
    if (!confirmSave) return;

    try {
      if (editIndex !== null) {
        // Compute changes
        const changes = {};
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== previousFormData[key]) {
            changes[key] = {
              old: previousFormData[key] || "",
              new: formData[key] || "",
            };
          }
        });

        const structuredData = {
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to, // Now an array
          letter_date: formData.letter_date,
          status: formData.status,
          assigned_by: userData.user.user_id,
          current_stage: formData.current_stage,
          user_id: userData.user.user_id,
          comment: formData.comment || "",
        };

        console.log("💾 Updating letter:", structuredData);

        await axios.put(`${gapi}/LT`, {
          updates: structuredData,
          LT_id: formData.LT_id,
          edit_changes: changes,
          edit_comment: formData.comment || "",
        });

        // Update local state without fetching again
        setLetters((prev) =>
          prev.map((letter, index) =>
            index === editIndex
              ? {
                  ...formData,
                  assigned_to_names: getAssignedUserNames(formData.assigned_to),
                  assigned_by: userData.user.user_id,
                  assigned_by_name: getUserNameById(userData.user.user_id),
                  deleted: false,
                  isEdited: true,
                  updated_at: new Date().toISOString(),
                  user_id: userData.user.user_id,
                }
              : letter
          )
        );

        alert("Letter updated successfully!");
      } else {
        console.log("🆕 Adding new letter:", formData);

        const newLetterData = {
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to, // Now an array
          letter_date: formData.letter_date,
          status: formData.status,
          assigned_by: userData.user.user_id,
          current_stage: formData.current_stage,
          user_id: userData.user.user_id,
        };

        const response = await axios.post(`${gapi}/LT`, {
          data: newLetterData,
          user_id: userData.user.user_id,
        });

        console.log("✅ New letter response:", response.data);

        let newLetterId = response.data;
        if (response.data.data) {
          newLetterId = response.data.data;
        } else if (response.data.response) {
          newLetterId = response.data.insertedId;
        }

        const mappedNewLetter = {
          LT_id: newLetterId,
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to,
          assigned_to_names: getAssignedUserNames(formData.assigned_to),
          letter_date: formData.letter_date,
          status: formData.status,
          assigned_by: userData.user.user_id,
          assigned_by_name: getUserNameById(userData.user.user_id),
          current_stage: formData.current_stage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userData.user.user_id,
          deleted: false,
          isEdited: false,
        };

        // Add new letter to the top without fetching again
        setLetters((prev) => [mappedNewLetter, ...prev]);
        updateSummaryCounts([mappedNewLetter, ...letters]);
      }

      setFormVisible(false);
      setFormData({ assigned_to: [] });
      setEditIndex(null);
    } catch (error) {
      console.error("❌ Error saving letter:", error);
      alert("Could not save the letter!");
    }
  };

  // Edit letter
  const handleEdit = (index) => {
    const letter = letters[index];
    console.log("✏️ Editing letter:", letter);
    setFormData({
      ...letter,
      assigned_to: letter.assigned_to || [], // Ensure it's an array
    });
    setPreviousFormData(letter);
    setFormVisible(true);
    setEditIndex(index);
  };

  // Soft Delete
  const handleDelete = async (LT_id) => {
    if (!userData?.user?.user_id) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    if (!LT_id) {
      alert("LC id invalid!");
      return;
    }

    const confirmDelete = window.confirm("Move this letter to Bin?");
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${gapi}/LT?user_id=${userData.user.user_id}&LT_id=${LT_id}&permanent=false`
      );

      // Update local state without fetching again
      setLetters((prev) => prev.filter((letter) => letter.LT_id !== LT_id));
      setDeletedLetters((prev) => {
        const deletedLetter = letters.find((l) => l.LT_id === LT_id);
        return deletedLetter
          ? [{ ...deletedLetter, deleted: true }, ...prev]
          : prev;
      });

      alert("Letter moved to Bin!");
    } catch (error) {
      console.error("Error while moving letter to Bin:", error);
      alert("Could not move letter to Bin!");
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (index, letterData) => {
    if (!userData?.user?.user_id) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    const confirmPermanent = window.confirm(
      "This will permanently delete the letter. Are you sure?"
    );
    if (!confirmPermanent) return;

    try {
      await axios.delete(
        `${gapi}/LT?user_id=${userData.user.user_id}&LT_id=${letterData.LT_id}&permanent=true`
      );

      // Update local state without fetching again
      setDeletedLetters((prev) => prev.filter((_, i) => i !== index));
      alert("Letter permanently deleted!");
    } catch (error) {
      console.error("Error deleting letter:", error);
      alert("Could not delete the letter from database!");
    }
  };

  // Enhanced status color helper with better visuals
  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    const statusClasses = {
      pending: "status-pending",
      "in progress": "status-inprogress",
      completed: "status-completed",
      dispatched: "status-dispatched",
      open: "status-open",
      closed: "status-closed",
      important: "status-important",
      critical: "status-critical",
    };
    return statusClasses[s] || "status-open";
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusMap = {
      pending: "Pending",
      "in progress": "In Progress",
      completed: "Completed",
      dispatched: "Dispatched",
      open: "Open",
      closed: "Closed",
      important: "Important",
      critical: "Critical",
    };
    return statusMap[status?.toLowerCase()] || status || "Open";
  };

  // Improved ownership check function
  const canUserEditLetter = (letter) => {
    if (!letter || !userData?.user?.user_id) {
      return false;
    }

    const currentUserId = userData.user.user_id;
    const assignedTo = Array.isArray(letter.assigned_to)
      ? letter.assigned_to
      : [letter.assigned_to];

    return (
      currentUserId === letter.user_id ||
      assignedTo.includes(currentUserId) ||
      currentUserId === letter.assigned_by
    );
  };

  // Filtered data based on current filter
  const filteredLetters = letters
    .filter((l) => !l.deleted)
    .filter((l) => {
      if (!filter || filter.trim() === "") return true;

      const dateRangeFilter = getDateRangeFilter(filter);

      if (dateRangeFilter) {
        const isPending = isLetterPending(l);
        const inRange = isDeadlineInRange(
          l.letter_date,
          dateRangeFilter.start,
          dateRangeFilter.end
        );

        if (!isPending) return false;
        return inRange;
      }

      const searchTerm = filter.toLowerCase();
      return (
        (l.letter_subject || "").toLowerCase().includes(searchTerm) ||
        (l.letter_number || "").toLowerCase().includes(searchTerm) ||
        (l.description || "").toLowerCase().includes(searchTerm) ||
        (l.assigned_to_names || []).some((name) =>
          name.toLowerCase().includes(searchTerm)
        ) ||
        (l.status || "").toLowerCase().includes(searchTerm) ||
        (l.current_stage || "").toLowerCase().includes(searchTerm)
      );
    });

  const filteredDeletedLetters = deletedLetters.filter((l) => {
    if (!filter || filter.trim() === "") return true;

    const dateRangeFilter = getDateRangeFilter(filter);

    if (dateRangeFilter) {
      const isPending = isLetterPending(l);
      const inRange = isDeadlineInRange(
        l.letter_date,
        dateRangeFilter.start,
        dateRangeFilter.end
      );

      if (!isPending) return false;
      return inRange;
    }

    const searchTerm = filter.toLowerCase();
    return (
      (l.letter_subject || "").toLowerCase().includes(searchTerm) ||
      (l.letter_number || "").toLowerCase().includes(searchTerm) ||
      (l.description || "").toLowerCase().includes(searchTerm) ||
      (l.assigned_to_names || []).some((name) =>
        name.toLowerCase().includes(searchTerm)
      ) ||
      (l.status || "").toLowerCase().includes(searchTerm)
    );
  });

  // Check if mobile view
  const isMobile = window.innerWidth <= 768;

  // Show loading/error states
  if (userLoading) {
    return (
      <div className="card">
        <div className="loading">Loading user session...</div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="card">
        <div className="error">
          <h3>Authentication Required</h3>
          <p>Please log in to access letter tracker features.</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="btn"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading letters...</div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <h1>Letter Tracker {showBin && " > Bin"}</h1>

        {/* Show active filter badge */}
        {filter && (
          <div className="filter-badge">
            <span>
              🔍 Filtering by: <strong>{filter}</strong>
              {filterToPage && filterToPage === filter && " (from dashboard)"}
            </span>
            <button onClick={() => setFilter("")} className="clear-filter-btn">
              Clear Filter
            </button>
          </div>
        )}

        {/* History Modal */}
        {historyOpen && history && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edit History</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => {
                    setHistory(null);
                    setHistoryOpen(false);
                  }}
                >
                  ×
                </button>
              </div>

              {history.length > 0 ? (
                <div className="history-content">
                  {history
                    .slice()
                    .reverse()
                    .map((update, index) => (
                      <div
                        key={update.update_id || index}
                        className="history-item"
                      >
                        <div className="history-meta">
                          <strong>
                            {new Date(update.updated_at).toLocaleString()}
                          </strong>
                          <span>•</span>
                          Updated by:{" "}
                          <strong>{update.updated_by || "System"}</strong>
                        </div>

                        {update.old_data &&
                          Object.keys(update.old_data).length > 0 && (
                            <div className="history-old-data">
                              <strong>Previous Data:</strong>
                              <div className="history-details">
                                {Object.entries(update.old_data)
                                  .filter(
                                    ([key]) =>
                                      ![
                                        "id",
                                        "temp_deleted",
                                        "LT_id",
                                        "created_at",
                                        "updated_at",
                                      ].includes(key)
                                  )
                                  .map(([key, value]) => (
                                    <div key={key}>
                                      <b>{key}:</b>{" "}
                                      {value !== null && value !== undefined
                                        ? value.toString()
                                        : "-"}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {update.changes &&
                          Object.keys(update.changes).length > 0 && (
                            <div className="history-changes">
                              <strong>Changes Made:</strong>
                              <ul>
                                {Object.entries(update.changes).map(
                                  ([field, change]) => (
                                    <li key={field}>
                                      <b>{field}:</b>
                                      <span className="change-old">
                                        {" "}
                                        {change?.old ?? "-"}
                                      </span>
                                      <span className="change-arrow"> → </span>
                                      <span className="change-new">
                                        {change?.new ?? "-"}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {(!update.old_data ||
                          Object.keys(update.old_data).length === 0) &&
                          (!update.changes ||
                            Object.keys(update.changes).length === 0) && (
                            <div className="no-changes">
                              No detailed change information available
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="no-history">
                  No history available for this letter
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls">
          <input
            placeholder={
              showBin
                ? "Filter deleted letters..."
                : "Filter by subject / assigned / status"
            }
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="ghost small" onClick={() => setFilter("")}>
            Clear
          </button>
          {!showBin && (
            <button
              className="small"
              onClick={(e) => {
                e.stopPropagation();
                setFormVisible(!formVisible);
                setFormData({ assigned_to: [] });
                setEditIndex(null);
              }}
            >
              {formVisible ? "Close form" : "Add new"}
            </button>
          )}
          <button className="small" onClick={() => setShowBin(!showBin)}>
            {showBin ? "Back to Letters" : "Bin"}
          </button>
        </div>

        {/* Enhanced Form with Labels and Multi-User Selection */}
        {formVisible && !showBin && (
          <div className="formWrap enhanced-form">
            <h3>{editIndex !== null ? "Edit Letter" : "Add New Letter"}</h3>

            <div className="form-grid">
              <div className="form-field">
                <label>
                  Date of Dispatch: <span className="required">*</span>
                </label>
                <DatePicker
                  selected={
                    formData.date_of_dispatch
                      ? new Date(formData.date_of_dispatch)
                      : null
                  }
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      date_of_dispatch: date.toISOString().split("T")[0],
                    })
                  }
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>
                  Letter Subject: <span className="required">*</span>
                </label>
                <input
                  placeholder="Enter letter subject"
                  value={formData.letter_subject || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, letter_subject: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>
                  Letter Number: <span className="required">*</span>
                </label>
                <input
                  placeholder="Enter letter number"
                  value={formData.letter_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, letter_number: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Current Stage:</label>
                <input
                  placeholder="Enter current stage"
                  value={formData.current_stage || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, current_stage: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>
                  Letter Date: <span className="required">*</span>
                </label>
                <DatePicker
                  selected={
                    formData.letter_date ? new Date(formData.letter_date) : null
                  }
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      letter_date: date.toISOString().split("T")[0],
                    })
                  }
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>
                  Status: <span className="required">*</span>
                </label>
                <select
                  value={formData.status || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="form-input"
                >
                  <option value="">Select status</option>
                  <option value="Important">Important</option>
                  <option value="Pending">Pending</option>
                  <option value="Critical">Critical</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Multi-User Assignment */}
            <div className="form-field full-width">
              <label>
                Assigned to: <span className="required">*</span>
              </label>
              <div className="user-selection-container">
                <div className="user-selection-grid">
                  {allUsers.map((user) => (
                    <div
                      key={user.cs_user_id}
                      className={`user-option ${
                        formData.assigned_to?.includes(user.cs_user_id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleUserSelection(user.cs_user_id)}
                    >
                      <div className="user-checkbox">
                        {formData.assigned_to?.includes(user.cs_user_id) && (
                          <div className="checkmark">✓</div>
                        )}
                      </div>
                      <span className="user-name">{user.cs_user_name}</span>
                    </div>
                  ))}
                </div>
                {formData.assigned_to && formData.assigned_to.length > 0 && (
                  <div className="selected-users">
                    <strong>Selected: </strong>
                    {getAssignedUserNames(formData.assigned_to).join(", ")}
                  </div>
                )}
                {(!formData.assigned_to ||
                  formData.assigned_to.length === 0) && (
                  <div className="selection-warning">
                    Please select at least one user
                  </div>
                )}
              </div>
            </div>

            <div className="form-field full-width">
              <label>Description:</label>
              <textarea
                placeholder="Enter letter description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="form-textarea"
                rows="3"
              />
            </div>

            {editIndex !== null && (
              <div className="form-field full-width">
                <label>Edit Comment / Note:</label>
                <textarea
                  placeholder="Add a comment about this edit"
                  value={formData.comment || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  className="form-textarea"
                  rows="2"
                />
              </div>
            )}

            <div className="formButtons">
              <button onClick={handleSave} className="save-btn">
                {editIndex !== null ? "Update Letter" : "Add Letter"}
              </button>
              <button
                className="ghost"
                onClick={() => {
                  setFormVisible(false);
                  setFormData({ assigned_to: [] });
                  setEditIndex(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Conditional Rendering (Active or Bin) */}
        {!showBin ? (
          <>
            {/* Active Letters Section */}
            <h3>Active Letters ({filteredLetters.length})</h3>
            {filteredLetters.length === 0 ? (
              <div className="no-data">
                {filter
                  ? `No letters found matching "${filter}"`
                  : "No letters found. Click 'Add new' to create your first letter."}
              </div>
            ) : isMobile ? (
              /* Mobile Card View */
              <div className="cards-container">
                {filteredLetters.map((l, index) => (
                  <div key={l.LT_id || index} className="letter-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <h4 className="letter-subject">
                          {l.letter_subject || "No Subject"}
                        </h4>
                        <span
                          className={`status-badge ${statusClass(l.status)}`}
                        >
                          {formatStatus(l.status)}
                        </span>
                      </div>
                      <div className="letter-number">
                        #{l.letter_number || "N/A"}
                      </div>
                    </div>

                    <div className="card-content">
                      <div className="card-row">
                        <span className="label">Dispatch Date:</span>
                        <span className="value">
                          {l.date_of_dispatch || "-"}
                        </span>
                      </div>
                      <div className="card-row">
                        <span className="label">Letter Date:</span>
                        <span className="value">{l.letter_date || "-"}</span>
                      </div>
                      <div className="card-row">
                        <span className="label">Assigned To:</span>
                        <div className="assigned-users">
                          {l.assigned_to_names &&
                          l.assigned_to_names.length > 0 ? (
                            l.assigned_to_names.map((name, i) => (
                              <span key={i} className="user-tag">
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="value">-</span>
                          )}
                        </div>
                      </div>
                      <div className="card-row">
                        <span className="label">Current Stage:</span>
                        <span className="value">{l.current_stage || "-"}</span>
                      </div>
                      {l.description && (
                        <div className="card-row">
                          <span className="label">Description:</span>
                          <span className="value description-text">
                            {l.description}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      <div className="card-actions">
                        {canUserEditLetter(l) ? (
                          <>
                            <button
                              className="iconcon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const originalIndex = letters.findIndex(
                                  (letter) => letter.LT_id === l.LT_id
                                );
                                handleEdit(originalIndex);
                              }}
                              title="Edit"
                            >
                              <Editic />
                            </button>
                            <button
                              className="iconcon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(l.LT_id);
                              }}
                              title="Move to Bin"
                            >
                              <Deleteic />
                            </button>
                          </>
                        ) : (
                          <span className="no-permission">Not authorized</span>
                        )}
                      </div>
                      <div className="card-meta">
                        <button
                          className={`history-btn-mobile ${
                            l.isEdited ? "has-history" : "no-history"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            l.isEdited && openHistory(l);
                          }}
                          disabled={!l.isEdited}
                        >
                          {l.isEdited ? "View History" : "No edits"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedRow === index && (
                      <div className="card-expanded">
                        <div className="expanded-section">
                          <strong>Assigned By:</strong>{" "}
                          {l.assigned_by_name || "-"}
                        </div>
                        <div className="expanded-section">
                          <strong>Comments:</strong>
                          <span
                            className={l.comment ? "has-comment" : "no-comment"}
                          >
                            {l.comment || "No comments"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>Date of Dispatch</th>
                      <th>Letter Subject</th>
                      <th>Letter No</th>
                      <th>Description</th>
                      <th>Assigned To</th>
                      <th>Letter Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLetters.map((l, index) => (
                      <React.Fragment key={l.LT_id || index}>
                        <tr
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleRow(index);
                          }}
                          className="letter-row"
                        >
                          <td>{index + 1}</td>
                          <td>{l.date_of_dispatch || "-"}</td>
                          <td className="subject-cell">
                            {l.letter_subject || "-"}
                          </td>
                          <td>{l.letter_number || "-"}</td>
                          <td className="muted description-cell">
                            {l.description || "-"}
                          </td>
                          <td>
                            <div className="assigned-users">
                              {l.assigned_to_names &&
                              l.assigned_to_names.length > 0
                                ? l.assigned_to_names.map((name, i) => (
                                    <span key={i} className="user-tag">
                                      {name}
                                    </span>
                                  ))
                                : "-"}
                            </div>
                          </td>
                          <td>{l.letter_date || "-"}</td>
                          <td>
                            <span
                              className={`status-badge ${statusClass(
                                l.status
                              )}`}
                            >
                              {formatStatus(l.status)}
                            </span>
                          </td>
                          <td className="actions">
                            {canUserEditLetter(l) ? (
                              <>
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const originalIndex = letters.findIndex(
                                      (letter) => letter.LT_id === l.LT_id
                                    );
                                    handleEdit(originalIndex);
                                  }}
                                  title="Edit"
                                >
                                  <Editic />
                                </button>
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(l.LT_id);
                                  }}
                                  title="Move to Bin"
                                >
                                  <Deleteic />
                                </button>
                              </>
                            ) : (
                              <span className="no-permission">
                                Not authorized
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className={`history-btn ${
                                l.isEdited ? "has-history" : "no-history"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                l.isEdited && openHistory(l);
                              }}
                              disabled={!l.isEdited}
                              title={
                                l.isEdited
                                  ? "Click to view edit history"
                                  : "No edits made"
                              }
                            >
                              {l.isEdited && l.updated_at
                                ? new Date(l.updated_at).toLocaleDateString() +
                                  " "
                                : // +
                                  // new Date(l.updated_at).toLocaleTimeString(
                                  //   [],
                                  //   {
                                  //     hour: "2-digit",
                                  //     minute: "2-digit",
                                  //   }
                                  // )
                                  "Never edited"}
                            </button>
                          </td>
                        </tr>

                        {expandedRow === index && (
                          <tr className="expanded-row">
                            <td colSpan="10">
                              <div className="expanded-details">
                                <div className="detail-section">
                                  <strong>Assigned By:</strong>{" "}
                                  {l.assigned_by_name || "-"}
                                </div>
                                <div className="detail-section">
                                  <strong>Current Stage:</strong>{" "}
                                  {l.current_stage || "-"}
                                </div>
                                <div className="detail-section">
                                  <strong>Comments:</strong>
                                  <span
                                    className={
                                      l.comment ? "has-comment" : "no-comment"
                                    }
                                  >
                                    {l.comment || "No comments"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Bin Section */}
            <h3>Bin ({filteredDeletedLetters.length})</h3>
            {filteredDeletedLetters.length === 0 ? (
              <div className="no-data">
                {filter
                  ? `No deleted letters found matching "${filter}"`
                  : "Bin is empty."}
              </div>
            ) : isMobile ? (
              /* Mobile Card View for Bin */
              <div className="cards-container">
                {filteredDeletedLetters.map((l, index) => (
                  <div
                    key={l.LT_id || index}
                    className="letter-card deleted-card"
                  >
                    <div className="card-header">
                      <div className="card-title-section">
                        <h4 className="letter-subject">
                          {l.letter_subject || "No Subject"}
                        </h4>
                        <span
                          className={`status-badge ${statusClass(l.status)}`}
                        >
                          {formatStatus(l.status)}
                        </span>
                      </div>
                      <div className="deleted-badge">Deleted</div>
                    </div>

                    <div className="card-content">
                      <div className="card-row">
                        <span className="label">Letter Number:</span>
                        <span className="value">
                          #{l.letter_number || "N/A"}
                        </span>
                      </div>
                      <div className="card-row">
                        <span className="label">Dispatch Date:</span>
                        <span className="value">
                          {l.date_of_dispatch || "-"}
                        </span>
                      </div>
                      <div className="card-row">
                        <span className="label">Letter Date:</span>
                        <span className="value">{l.letter_date || "-"}</span>
                      </div>
                      <div className="card-row">
                        <span className="label">Assigned To:</span>
                        <div className="assigned-users">
                          {l.assigned_to_names &&
                          l.assigned_to_names.length > 0 ? (
                            l.assigned_to_names.map((name, i) => (
                              <span key={i} className="user-tag">
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="value">-</span>
                          )}
                        </div>
                      </div>
                      <div className="card-row">
                        <span className="label">Assigned By:</span>
                        <span className="value">
                          {l.assigned_by_name || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button
                        className="danger-btn"
                        onClick={() => handlePermanentDelete(index, l)}
                        title="Permanently Delete"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View for Bin */
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>Date of Dispatch</th>
                      <th>Letter Subject</th>
                      <th>Letter No</th>
                      <th>Description</th>
                      <th>Assigned To</th>
                      <th>Assigned By</th>
                      <th>Letter Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeletedLetters.map((l, index) => (
                      <tr key={l.LT_id || index}>
                        <td>{index + 1}</td>
                        <td>{l.date_of_dispatch || "-"}</td>
                        <td>{l.letter_subject || "-"}</td>
                        <td>{l.letter_number || "-"}</td>
                        <td className="muted">{l.description || "-"}</td>
                        <td>
                          <div className="assigned-users">
                            {l.assigned_to_names &&
                            l.assigned_to_names.length > 0
                              ? l.assigned_to_names.map((name, i) => (
                                  <span key={i} className="user-tag">
                                    {name}
                                  </span>
                                ))
                              : "-"}
                          </div>
                        </td>
                        <td>{l.assigned_by_name || "-"}</td>
                        <td>{l.letter_date || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${statusClass(l.status)}`}
                          >
                            {formatStatus(l.status)}
                          </span>
                        </td>
                        <td className="actions">
                          <button
                            className="iconcon danger"
                            onClick={() => handlePermanentDelete(index, l)}
                            title="Permanently Delete"
                          >
                            <Deleteic />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default LetterTracker;

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
  const [formData, setFormData] = useState({});
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

  // Date range filter function - IMPROVED (same as PolicyTracker)
  const getDateRangeFilter = (filterText) => {
    if (!filterText) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const filterLower = filterText.toLowerCase().trim();

    if (filterLower.includes("due this week")) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999); // End of day

      console.log("Week filter - Start:", startOfWeek, "End:", endOfWeek);
      return { type: "week", start: startOfWeek, end: endOfWeek };
    }

    if (filterLower.includes("due this month")) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      console.log("Month filter - Start:", startOfMonth, "End:", endOfMonth);
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

  // Check if letter is pending - FIXED to handle different status formats
  const isLetterPending = (letter) => {
    const status = (letter.status || "").toLowerCase();
    return (
      status === "pending" || status === "in progress" || status === "open"
    );
  };

  // Check if deadline is within date range - IMPROVED for API date format
  const isDeadlineInRange = (deadline, start, end) => {
    if (!deadline || deadline === "N/A" || deadline === "") return false;

    try {
      // Handle API date format - extract just the date part if needed
      const datePart = deadline.split(" ")[0]; // Get "2025-10-31" from "2025-10-31 21:32:43"
      const deadlineDate = new Date(datePart);

      if (isNaN(deadlineDate.getTime())) {
        console.error("Invalid deadline date after parsing:", deadline);
        return false;
      }

      deadlineDate.setHours(0, 0, 0, 0); // Normalize to start of day

      console.log("Checking deadline:", {
        original: deadline,
        datePart: datePart,
        deadlineDate: deadlineDate,
        start: start,
        end: end,
        inRange: deadlineDate >= start && deadlineDate <= end,
      });

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

    // Iterate through all keys in levelUsers object
    Object.keys(valueuser).forEach((key) => {
      // Check if the value is an array (like level1, level2, etc.)
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

  // Update summary counts with proper filtering logic - UPDATED to use letter_date
  const updateSummaryCounts = (updatedLetters) => {
    if (!setSummaryInfo) return;

    const today = new Date();

    // Important count - Letters with "Important" status
    const importantCount = updatedLetters.filter(
      (l) => !l.deleted && l.status && l.status.toLowerCase() === "important"
    ).length;

    // Critical count - Letters with "Critical" status
    const criticalCount = updatedLetters.filter(
      (l) => !l.deleted && l.status && l.status.toLowerCase() === "critical"
    ).length;

    // Due This Week count - pending letters with letter_date this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const dueThisWeekCount = updatedLetters.filter((l) => {
      if (l.deleted || !isLetterPending(l)) return false;
      return isDeadlineInRange(l.letter_date, startOfWeek, endOfWeek);
    }).length;

    // Due This Month count - pending letters with letter_date this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dueThisMonthCount = updatedLetters.filter((l) => {
      if (l.deleted || !isLetterPending(l)) return false;
      return isDeadlineInRange(l.letter_date, startOfMonth, endOfMonth);
    }).length;

    // Total count - all non-deleted letters
    const totalCount = updatedLetters.filter((l) => !l.deleted).length;

    // Debug logging to see what's being counted
    console.log("📊 Letter summary counts debug:", {
      important: importantCount,
      critical: criticalCount,
      dueThisWeek: dueThisWeekCount,
      dueThisMonth: dueThisMonthCount,
      total: totalCount,
      totalLetters: updatedLetters.length,
      importantLetters: updatedLetters
        .filter(
          (l) =>
            !l.deleted && l.status && l.status.toLowerCase() === "important"
        )
        .map((l) => ({ subject: l.letter_subject, status: l.status })),
    });

    setSummaryInfo((prev) => ({
      ...prev,
      communications: [
        { label: "Important", value: importantCount },
        { label: "Critical", value: criticalCount },
        { label: "Due This Week", value: dueThisWeekCount },
        { label: "Due this month", value: dueThisMonthCount },
        // { label: "Total", value: totalCount },
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
        const mappedLetter = {
          LT_id: letter.LT_id,
          date_of_dispatch: letter.date_of_dispatch,
          letter_subject: letter.letter_subject,
          letter_number: letter.letter_number,
          description: letter.description,
          assigned_to: letter.assigned_to,
          assigned_to_name: getUserNameById(letter.assigned_to),
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

      setLetters(processedLetters);
      updateSummaryCounts(processedLetters);
    } catch (error) {
      console.error("❌ Error fetching letters:", error);
      console.error("Error details:", error.response?.data || error.message);
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
        const mappedLetter = {
          LT_id: letter.LT_id,
          date_of_dispatch: letter.date_of_dispatch,
          letter_subject: letter.letter_subject,
          letter_number: letter.letter_number,
          description: letter.description,
          assigned_to: letter.assigned_to,
          assigned_to_name: getUserNameById(letter.assigned_to),
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

      setDeletedLetters(processedLetters);
    } catch (error) {
      console.error("❌ Error fetching deleted letters:", error);
      console.error("Error details:", error.response?.data || error.message);
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

  // Handle Save (Add / Edit)
  const handleSave = async () => {
    if (!userData?.user?.user_id) {
      alert("User not authenticated. Please log in again.");
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
          assigned_to: formData.assigned_to,
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

        const updatedLetters = [...letters];
        updatedLetters[editIndex] = {
          ...formData,
          assigned_to_name: getUserNameById(formData.assigned_to),
          assigned_by: userData.user.user_id,
          assigned_by_name: getUserNameById(userData.user.user_id),
          deleted: false,
          isEdited: true,
          updated_at: new Date().toISOString(),
          user_id: userData.user.user_id,
          edit_changes: changes,
        };
        setLetters(updatedLetters);
        updateSummaryCounts(updatedLetters);
        alert("Letter updated successfully!");
      } else {
        console.log("🆕 Adding new letter:", formData);

        const newLetterData = {
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to,
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

        let newLetter = response.data;
        if (response.data.data) {
          newLetter = response.data.data;
        } else if (response.data.response) {
          newLetter = response.data.insertedId;
        }

        const mappedNewLetter = {
          LT_id: newLetter,
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to,
          assigned_to_name: getUserNameById(formData.assigned_to),
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

        const updatedLetters = [...letters, mappedNewLetter];
        setLetters(updatedLetters);
        updateSummaryCounts(updatedLetters);
      }

      setFormVisible(false);
      setFormData({});
      setEditIndex(null);

      // Refresh data after save
      fetchLetters();
      fetchDeletedLetters();
    } catch (error) {
      console.error("❌ Error saving letter:", error);
      console.error("Error response:", error.response?.data);
      alert("Could not save the letter!.");
    }
  };

  // Edit letter
  const handleEdit = (index) => {
    const letter = letters[index];
    console.log("✏️ Editing letter:", letter);
    setFormData(letter);
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

    console.log("herre checking for ltttid", LT_id);
    if (!LT_id) {
      alert("LC id invalid!");
      return;
    }

    const confirmDelete = window.confirm("Move this letter to Bin?");
    if (!confirmDelete) return;

    try {
      const deletion = await axios.delete(
        `${gapi}/LT?user_id=${userData.user.user_id}&LT_id=${LT_id}&permanent=false`
      );
      console.log("deletion response", deletion, LT_id);

      const updatedLetters = letters.map((l) =>
        l.LT_id === LT_id ? { ...l, deleted: true } : l
      );
      setLetters(updatedLetters);
      updateSummaryCounts(updatedLetters);

      // Refresh data after delete
      fetchLetters();
      fetchDeletedLetters();

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

      setDeletedLetters((prev) => prev.filter((_, i) => i !== index));
      alert("Letter permanently deleted!");
    } catch (error) {
      console.error("Error deleting letter:", error);
      alert("Could not delete the letter from database!");
    }
  };

  // Status color helper
  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "open";
    if (s === "in progress") return "inprogress";
    if (s === "completed") return "closed";
    if (s === "dispatched") return "dispatched";
    if (s === "open") return "open";
    if (s === "closed") return "closed";
    if (s === "important") return "important";
    if (s === "critical") return "critical";
    return "open";
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
    return (
      currentUserId === letter.user_id ||
      currentUserId === letter.assigned_to ||
      currentUserId === letter.assigned_by
    );
  };

  // Filtered data based on current filter - UPDATED to use letter_date
  const filteredLetters = letters
    .filter((l) => !l.deleted)
    .filter((l) => {
      if (!filter || filter.trim() === "") return true;

      const dateRangeFilter = getDateRangeFilter(filter);

      // Handle special date filters
      if (dateRangeFilter) {
        const isPending = isLetterPending(l);
        const inRange = isDeadlineInRange(
          l.letter_date, // Changed from date_of_dispatch to letter_date
          dateRangeFilter.start,
          dateRangeFilter.end
        );

        console.log("🔍 Letter filter debug:", {
          letter: l.letter_subject,
          status: l.status,
          isPending: isPending,
          letter_date: l.letter_date, // Changed from date_of_dispatch
          inRange: inRange,
          dateRange: dateRangeFilter.type,
          shouldShow: isPending && inRange,
        });

        // For date range filters, only show pending letters within the date range
        if (!isPending) {
          console.log(
            `❌ ${l.letter_subject} - Status is not pending (current: "${l.status}")`
          );
          return false;
        }
        if (!inRange) {
          console.log(
            `❌ ${l.letter_subject} - Letter date "${l.letter_date}" not in ${dateRangeFilter.type} range` // Updated message
          );
          return false;
        }
        console.log(
          `✅ ${l.letter_subject} - Matches filter (Status: pending, Letter date: "${l.letter_date}")` // Updated message
        );
        return true;
      }

      // Regular text search
      const searchTerm = filter.toLowerCase();
      return (
        (l.letter_subject || "").toLowerCase().includes(searchTerm) ||
        (l.letter_number || "").toLowerCase().includes(searchTerm) ||
        (l.description || "").toLowerCase().includes(searchTerm) ||
        (l.assigned_to_name || "").toLowerCase().includes(searchTerm) ||
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
        l.letter_date, // Changed from date_of_dispatch to letter_date
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
      (l.assigned_to_name || "").toLowerCase().includes(searchTerm) ||
      (l.status || "").toLowerCase().includes(searchTerm)
    );
  });

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
              onClick={() => setFilter("")}
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

        {/* History Modal */}
        {historyOpen && history && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: "90%",
                maxWidth: "800px",
                height: "80%",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                overflowY: "auto",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                <h2 style={{ margin: 0, color: "#333" }}>Edit History</h2>
                <button
                  style={{
                    background: "#ff4444",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  onClick={() => {
                    setHistory(null);
                    setHistoryOpen(false);
                  }}
                >
                  ×
                </button>
              </div>

              {history.length > 0 ? (
                <div
                  style={{ maxHeight: "calc(100% - 60px)", overflowY: "auto" }}
                >
                  {history
                    .slice()
                    .reverse()
                    .map((update, index) => (
                      <div
                        key={update.update_id || index}
                        style={{
                          marginBottom: "20px",
                          padding: "15px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "6px",
                          background: "#f9f9f9",
                        }}
                      >
                        <div style={{ marginBottom: "10px" }}>
                          <strong style={{ color: "#2196f3" }}>
                            {new Date(update.updated_at).toLocaleString()}
                          </strong>
                          <span style={{ margin: "0 10px" }}>•</span>
                          Updated by:{" "}
                          <strong>{update.updated_by || "System"}</strong>
                        </div>

                        {update.old_data &&
                          Object.keys(update.old_data).length > 0 && (
                            <div
                              style={{
                                margin: "10px 0",
                                padding: "10px",
                                background: "#fff3cd",
                                borderRadius: "4px",
                                border: "1px solid #ffeaa7",
                              }}
                            >
                              <strong style={{ color: "#856404" }}>
                                Previous Data:
                              </strong>
                              <div
                                style={{
                                  paddingLeft: "15px",
                                  marginTop: "8px",
                                  fontSize: "14px",
                                }}
                              >
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
                                    <div
                                      key={key}
                                      style={{ marginBottom: "4px" }}
                                    >
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
                            <div
                              style={{
                                margin: "10px 0",
                                padding: "10px",
                                background: "#d1ecf1",
                                borderRadius: "4px",
                                border: "1px solid #bee5eb",
                              }}
                            >
                              <strong style={{ color: "#0c5460" }}>
                                Changes Made:
                              </strong>
                              <ul
                                style={{
                                  paddingLeft: "20px",
                                  marginTop: "8px",
                                  marginBottom: 0,
                                }}
                              >
                                {Object.entries(update.changes).map(
                                  ([field, change]) => (
                                    <li
                                      key={field}
                                      style={{ marginBottom: "6px" }}
                                    >
                                      <b>{field}:</b>
                                      <span style={{ color: "#e74c3c" }}>
                                        {" "}
                                        {change?.old ?? "-"}
                                      </span>
                                      <span
                                        style={{
                                          margin: "0 8px",
                                          color: "#7f8c8d",
                                        }}
                                      >
                                        →
                                      </span>
                                      <span style={{ color: "#27ae60" }}>
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
                            <div
                              style={{
                                color: "#7f8c8d",
                                fontStyle: "italic",
                                textAlign: "center",
                              }}
                            >
                              No detailed change information available
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#7f8c8d",
                    fontStyle: "italic",
                  }}
                >
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
              }}
            >
              {formVisible ? "Close form" : "Add new"}
            </button>
          )}
          <button className="small" onClick={() => setShowBin(!showBin)}>
            {showBin ? "Back to Letters" : "Bin"}
          </button>
        </div>

        {/* Form */}
        {formVisible && !showBin && (
          <div className="formWrap">
            <div className="formRow">
              <div className="dateField">
                <label>Date of Dispatch: </label>
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
                  readOnly={editIndex !== null}
                  placeholderText="Select date"
                />
              </div>
              <input
                placeholder="Letter Subject"
                value={formData.letter_subject || ""}
                onChange={(e) =>
                  setFormData({ ...formData, letter_subject: e.target.value })
                }
              />
              <input
                placeholder="Letter No"
                value={formData.letter_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, letter_number: e.target.value })
                }
              />

              {/* Updated Assigned To Field - Dropdown with user names */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: "#666",
                  }}
                >
                  Assigned to: <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  value={formData.assigned_to || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_to: e.target.value })
                  }
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minWidth: "150px",
                    borderColor: !formData.assigned_to ? "red" : "#ccc",
                  }}
                  required
                >
                  <option value="">Select User</option>
                  {allUsers.map((user) => (
                    <option key={user.cs_user_id} value={user.cs_user_id}>
                      {user.cs_user_name}
                    </option>
                  ))}
                </select>
                {!formData.assigned_to && (
                  <small style={{ color: "red", marginTop: "4px" }}>
                    Please select an assignee
                  </small>
                )}
              </div>

              <input
                placeholder="Current Stage"
                value={formData.current_stage || ""}
                onChange={(e) =>
                  setFormData({ ...formData, current_stage: e.target.value })
                }
              />
              <div className="dateField">
                <label>Letter Date: </label>
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
                  readOnly={editIndex !== null}
                  placeholderText="Select date"
                />
              </div>

              <select
                value={formData.status || ""}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
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
            <textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              style={{ marginTop: 10 }}
            />
            {editIndex !== null && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: "12px", color: "#666" }}>
                  Edit Comment / Note:
                </label>
                <textarea
                  placeholder="Add a comment about this edit"
                  value={formData.comment || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minHeight: "60px",
                  }}
                />
              </div>
            )}

            <div className="formButtons">
              <button onClick={handleSave}>Save</button>
              <button
                className="ghost"
                onClick={() => {
                  setFormVisible(false);
                  setFormData({});
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
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                {filter
                  ? `No letters found matching "${filter}"`
                  : "No letters found. Click 'Add new' to create your first letter."}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Date of Dispatch</th>
                    <th>Letter Subject</th>
                    <th>Letter No</th>
                    <th>Description</th>
                    <th>Letter Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "start" }}>
                  {filteredLetters.map((l, index) => (
                    <React.Fragment key={l.LT_id || index}>
                      <tr
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleRow(index);
                        }}
                        className="letter-row"
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            expandedRow === index ? "#f9f9f9" : "white",
                          transition: "background 0.2s ease",
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>{l.date_of_dispatch || "-"}</td>
                        <td>{l.letter_subject || "-"}</td>
                        <td>{l.letter_number || "-"}</td>
                        <td className="muted">{l.description || "-"}</td>
                        <td>{l.letter_date || "-"}</td>
                        <td>
                          <span className={`status ${statusClass(l.status)}`}>
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
                              >
                                <Editic />
                              </button>
                              <button
                                className="iconcon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(l.LT_id);
                                }}
                              >
                                <Deleteic />
                              </button>
                            </>
                          ) : (
                            "Not the owner"
                          )}
                        </td>
                        <td>
                          <button
                            style={{
                              background: l.isEdited ? "#e3f2fd" : "#f5f5f5",
                              color: l.isEdited ? "#1976d2" : "#666",
                              border: l.isEdited
                                ? "1px solid #2196f3"
                                : "1px solid #ddd",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: l.isEdited ? "pointer" : "default",
                              fontSize: "12px",
                              fontWeight: l.isEdited ? "600" : "normal",
                              transition: "all 0.2s ease",
                              minWidth: "100px",
                            }}
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
                                " " +
                                new Date(l.updated_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never edited"}
                          </button>
                        </td>
                      </tr>

                      {expandedRow === index && (
                        <tr>
                          <td colSpan="10">
                            <div
                              style={{
                                border: "1px solid #dce3ed",
                                borderRadius: "6px",
                                marginTop: "6px",
                                padding: "12px 16px",
                                fontSize: "13px",
                                lineHeight: "1.6",
                                color: "#333",
                                width: "100%",
                              }}
                            >
                              <p>
                                <strong>Assigned By:</strong>{" "}
                                {l.assigned_by_name || "-"}
                              </p>
                              <p>
                                <strong>Assigned To:</strong>{" "}
                                {l.assigned_to_name || "-"}
                              </p>
                              <p
                                style={{
                                  fontStyle: "italic",
                                  color: l.comment ? "#555" : "#aaa",
                                }}
                              >
                                <strong
                                  style={{
                                    fontStyle: "normal",
                                    color: "#333",
                                  }}
                                >
                                  Comments:
                                </strong>{" "}
                                {l.comment || "No comments"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <>
            {/* Bin Section */}
            <h3>Bin ({filteredDeletedLetters.length})</h3>
            {filteredDeletedLetters.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                {filter
                  ? `No deleted letters found matching "${filter}"`
                  : "Bin is empty."}
              </div>
            ) : (
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
                      <td>{l.assigned_to_name || "-"}</td>
                      <td>{l.assigned_by_name || "-"}</td>
                      <td>{l.letter_date || "-"}</td>
                      <td>
                        <span className={`status ${statusClass(l.status)}`}>
                          {formatStatus(l.status)}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="iconcon"
                          onClick={() => handlePermanentDelete(index, l)}
                        >
                          <Deleteic />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default LetterTracker;

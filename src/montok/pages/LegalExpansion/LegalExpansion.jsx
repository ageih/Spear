import React, { useState, useEffect } from "react";
import "./Legal.css";
import axios from "axios";
import { gapi } from "../../component/GlobalAPI";
import { useUserSession } from "../../component/useUserSession";
import Toast from "../../component/Toast";
import { useUser } from "../../../LevelContext";
import History from "../../component/histry/Htory";
import { Binic, Deleteic, Editic } from "../../component/UseIcons";

const LegalExpansion = ({ filterToPage, setSummaryInfo }) => {
  const contextuser = useUser();
  const valueuser = contextuser?.levelUser;

  // Use the new user session hook
  const {
    userData,
    isLoading: userLoading,
    error: userError,
  } = useUserSession();

  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [toast, setToast] = useState(null);
  const [recycleBin, setRecycleBin] = useState(false);
  const [deleted, setDeleted] = useState([]);
  const [editing, setEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return { type: "week", start: startOfWeek, end: endOfWeek };
    }

    if (filterLower.includes("due this month")) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      return { type: "month", start: startOfMonth, end: endOfMonth };
    }

    return null;
  };

  const toggleHistory = (recordId, e) => {
    e.stopPropagation();
    setOpenHistoryId((prevId) => (prevId === recordId ? null : recordId));
  };

  // Flatten all users from ALL levels dynamically
  const allUsers = React.useMemo(() => {
    if (!valueuser) {
      return [];
    }

    const users = [];

    Object.keys(valueuser).forEach((key) => {
      if (Array.isArray(valueuser[key])) {
        users.push(...valueuser[key]);
      }
    });

    return users;
  }, [valueuser]);

  // Get single user name by ID
  const getUserNameById = (userId) => {
    if (!userId) return "Unassigned";
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId;
  };

  // Helper function to get user names by IDs (array)
  const getUserNamesByIds = (userIds) => {
    if (!userIds || !Array.isArray(userIds)) {
      return [];
    }

    return userIds.map((userId) => {
      const foundUser = allUsers.find((user) => user.cs_user_id === userId);
      return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
    });
  };

  // Helper function to get user names as string for display - FIXED
  const getUserNamesString = (userIds) => {
    if (!userIds || !Array.isArray(userIds)) return "Unassigned";
    const names = getUserNamesByIds(userIds);
    return names.length > 0 ? names.join(", ") : "Unassigned";
  };

  const [formData, setFormData] = useState({
    LCT_id: "",
    sno: "",
    court: "",
    priority: "Medium",
    submissionDate: "",
    hearingDate: "",
    description: "",
    department: "",
    status: "Under Review",
    activityNotes: "",
    assigned_to: [], // Changed to array
    assigned_by: "",
    user_id: "",
    assigned_id: "",
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Helper function to parse your date format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const datePart = dateString.split(" ")[0];
    const date = new Date(datePart);

    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return null;
    }

    return date;
  };

  // Format date for display
  const formatDateForDisplay = (apiDate) => {
    if (!apiDate || apiDate === "N/A") return "N/A";
    try {
      return apiDate.split(/[ T]/)[0];
    } catch (error) {
      console.error("Error formatting date:", apiDate, error);
      return apiDate;
    }
  };

  // Fetch cases function
  const fetchData = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/LCT?user_id=${userData.user.user_id}&&deleted=false&user_level=${userData.user.cs_user_level}`
      );

      const casedata = response.data.response.map((item, index) => {
        // Parse assigned_to - handle both string and array formats from API
        let assignedToArray = [];
        if (item.assigned_to) {
          if (Array.isArray(item.assigned_to)) {
            assignedToArray = item.assigned_to;
          } else if (typeof item.assigned_to === "string") {
            // Try to parse JSON string, otherwise treat as single value
            try {
              const parsed = JSON.parse(item.assigned_to);
              if (Array.isArray(parsed)) {
                assignedToArray = parsed;
              } else {
                assignedToArray = [item.assigned_to];
              }
            } catch {
              assignedToArray = [item.assigned_to];
            }
          }
        }

        return {
          id: item.id || item.LCT_id,
          user_id: item.user_id,
          LCT_id: item.LCT_id,
          sno: index + 1,
          court: item.court || "",
          priority: item.priority || "Medium",
          submissionDate: item.date_of_submission || "",
          hearingDate: item.date_of_hearing || "",
          description: item.description || "",
          department: item.department || "",
          status: item.status || "Under Review",
          activityNotes: item.activity_notes || "",
          assigned_to: assignedToArray, // Now an array
          assigned_to_names: getUserNamesByIds(assignedToArray), // Array of names
          assigned_by: item.assigned_by || "",
          assigned_id: item.assigned_id,
        };
      });
      setCases(casedata);
      return true;
    } catch (err) {
      console.error("Error fetching data:", err);
      return false;
    }
  };

  const fetchDatadeleted = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const ft = true;
      const response = await axios.get(
        `${gapi}/LCT?deleted=true&user_id=${userData.user.user_id}&user_fetch=${ft}&user_level=${userData.user.cs_user_level}`
      );

      const casedata = response.data.response.map((item, index) => {
        // Parse assigned_to - handle both string and array formats
        let assignedToArray = [];
        if (item.assigned_to) {
          if (Array.isArray(item.assigned_to)) {
            assignedToArray = item.assigned_to;
          } else if (typeof item.assigned_to === "string") {
            try {
              const parsed = JSON.parse(item.assigned_to);
              if (Array.isArray(parsed)) {
                assignedToArray = parsed;
              } else {
                assignedToArray = [item.assigned_to];
              }
            } catch {
              assignedToArray = [item.assigned_to];
            }
          }
        }

        return {
          id: item.id || item.LCT_id,
          user_id: item.user_id,
          LCT_id: item.LCT_id,
          sno: index + 1,
          court: item.court || "",
          priority: item.priority || "Medium",
          submissionDate: item.date_of_submission || "",
          hearingDate: item.date_of_hearing || "",
          description: item.description || "",
          department: item.department || "",
          status: item.status || "Under Review",
          activityNotes: item.activity_notes || "",
          assigned_to: assignedToArray,
          assigned_to_names: getUserNamesByIds(assignedToArray),
          assigned_by: item.assigned_by || "",
        };
      });
      setDeleted(casedata);
      return true;
    } catch (err) {
      console.error("Error fetching data:", err);
      return false;
    }
  };

  const isDueStatus = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === "pending";
  };

  const updateSummaryCounts = (updatedCases) => {
    if (!setSummaryInfo) {
      console.log("❌ setSummaryInfo not available");
      return;
    }

    if (!updatedCases || updatedCases.length === 0) {
      console.log("🔄 Skipping summary update - empty or invalid cases data");
      return;
    }

    console.log(
      "📊 Updating summary counts with",
      updatedCases.length,
      "cases"
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const importantCount = updatedCases.filter(
      (c) => !c.deleted && c.status && c.status.toLowerCase() === "important"
    ).length;

    const criticalCount = updatedCases.filter(
      (c) => !c.deleted && c.status && c.status.toLowerCase() === "critical"
    ).length;

    const dueThisWeekCount = updatedCases.filter((c) => {
      if (c.deleted || !c.hearingDate || !isDueStatus(c.status)) {
        return false;
      }

      const hearingDate = parseDate(c.hearingDate);
      if (!hearingDate) return false;

      return hearingDate >= startOfWeek && hearingDate <= endOfWeek;
    }).length;

    const dueThisMonthCount = updatedCases.filter((c) => {
      if (c.deleted || !c.hearingDate || !isDueStatus(c.status)) {
        return false;
      }

      const hearingDate = parseDate(c.hearingDate);
      if (!hearingDate) return false;

      return hearingDate >= startOfMonth && hearingDate <= endOfMonth;
    }).length;

    setSummaryInfo((prev) => ({
      ...prev,
      legal: [
        { label: "Important", value: importantCount },
        { label: "Critical", value: criticalCount },
        { label: "Due This Week", value: dueThisWeekCount },
        { label: "Due this month", value: dueThisMonthCount },
      ],
    }));
  };

  // Fetch data when user data is ready
  useEffect(() => {
    const fetchDataAsync = async () => {
      if (!userData?.user?.user_id) {
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([fetchData(), fetchDatadeleted()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      fetchDataAsync();
    }
  }, [userData, userLoading, allUsers]);

  // ✅ Update summary counts whenever cases change
  useEffect(() => {
    if (cases.length > 0) {
      console.log("🔄 Cases data updated, updating summary counts...");
      updateSummaryCounts(cases);
    }
  }, [cases]);

  // Update form data when editing a case
  useEffect(() => {
    if (editingCase && allUsers.length > 0) {
      setFormData((prev) => ({
        ...prev,
        assigned_id: editingCase.assigned_id,
        assigned_to: editingCase.assigned_to || [], // Ensure it's an array
      }));
    }
  }, [editingCase, allUsers]);

  // Filtered data based on current filter
  const filteredCases = cases.filter((legalCase) => {
    if (!filter || filter.trim() === "") return true;

    const dateRangeFilter = getDateRangeFilter(filter);

    if (dateRangeFilter) {
      const hearingDate = parseDate(legalCase.hearingDate);
      const isDue = isDueStatus(legalCase.status);

      if (!isDue) return false;
      if (!hearingDate) return false;

      return (
        hearingDate >= dateRangeFilter.start &&
        hearingDate <= dateRangeFilter.end
      );
    }

    const lowerFilter = filter.toLowerCase();
    return (
      legalCase.court.toLowerCase().includes(lowerFilter) ||
      legalCase.department.toLowerCase().includes(lowerFilter) ||
      legalCase.status.toLowerCase().includes(lowerFilter) ||
      legalCase.description.toLowerCase().includes(lowerFilter) ||
      getUserNamesString(legalCase.assigned_to)
        .toLowerCase()
        .includes(lowerFilter)
    );
  });

  const filteredDeleted = deleted.filter((legalCase) => {
    const lowerFilter = filter.toLowerCase();
    return (
      legalCase.court.toLowerCase().includes(lowerFilter) ||
      legalCase.department.toLowerCase().includes(lowerFilter) ||
      legalCase.status.toLowerCase().includes(lowerFilter) ||
      legalCase.description.toLowerCase().includes(lowerFilter) ||
      getUserNamesString(legalCase.assigned_to)
        .toLowerCase()
        .includes(lowerFilter)
    );
  });

  // Check if current user can edit/delete the case
  const canUserEditCase = (legalCase) => {
    if (!userData?.user?.user_id) return false;

    return (
      userData.user.user_id === legalCase.user_id ||
      (Array.isArray(legalCase.assigned_to) &&
        legalCase.assigned_to.includes(userData.user.user_id))
    );
  };

  // Check if current user is the owner of the case
  const isUserCaseOwner = (legalCase) => {
    if (!userData?.user?.user_id) return false;
    return userData.user.user_id === legalCase.user_id;
  };

  const handleAddNew = (e) => {
    e.stopPropagation();
    setShowForm(!showForm);
    setEditing(true);
    setEditingCase(null);
    setFormData({
      LCT_id: "",
      sno: cases.length + 1,
      court: "",
      priority: "Medium",
      submissionDate: "",
      hearingDate: "",
      description: "",
      department: "",
      status: "Under Review",
      activityNotes: "",
      assigned_to: [], // Empty array
      assigned_by: userData?.user?.user_id || "",
      assigned_id: "",
      user_id: userData?.user?.user_id || "",
    });
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setShowForm(false);
    setEditingCase(null);
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();

    if (!formData.assigned_to || formData.assigned_to.length === 0) {
      alert("Please assign to at least one user");
      return;
    }

    const apiData = {
      data: {
        court: formData.court,
        priority: (formData.priority || "Medium").toUpperCase(),
        description: formData.description,
        date_of_hearing: formData.hearingDate,
        department: formData.department,
        status: formData.status || "Under Review",
        activity_notes: formData.activityNotes,
        assigned_to: formData.assigned_to, // Send as array
        assigned_by: formData.assigned_by,
        user_id: userData?.user?.user_id,
        assigned_id: formData?.assigned_id,
      },
    };

    try {
      let response;
      let lcid;

      if (editingCase) {
        response = await axios.put(`${gapi}/LCT`, {
          data: apiData.data,
          LCT_id: formData.LCT_id,
        });
        lcid = formData.LCT_id;

        setToast({
          message: `Case updated successfully`,
          type: "success",
        });
      } else {
        response = await axios.post(
          `${gapi}/LCT?user_id=${userData?.user?.user_id}`,
          apiData
        );
        lcid = response.data.LCT_id;
        setToast({
          message: `Case inserted successfully`,
          type: "success",
        });
      }

      const newCase = {
        id: editingCase ? editingCase.id : Date.now(),
        LCT_id: lcid,
        sno: parseInt(formData.sno) || cases.length + 1,
        court: formData.court,
        priority: formData.priority || "Medium",
        submissionDate: formData.submissionDate,
        hearingDate: formData.hearingDate,
        description: formData.description,
        department: formData.department,
        status: formData.status || "Under Review",
        activityNotes: formData.activityNotes,
        assigned_to: formData.assigned_to, // Array
        assigned_to_names: getUserNamesByIds(formData.assigned_to), // Array of names
        assigned_by: formData.assigned_by,
        user_id: userData?.user?.user_id,
      };

      if (editingCase) {
        setCases(
          cases.map((c) => (c.LCT_id === editingCase.LCT_id ? newCase : c))
        );
      } else {
        setCases([...cases, newCase]);
      }

      setShowForm(false);
      setEditingCase(null);
      setEditing(false);
      setExpandedRow(null);
    } catch (error) {
      console.error("Error saving case:", error);
      setToast({
        message: `${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
      });
    }
  };

  const handleEdit = (legalCase) => {
    setEditing(true);
    setEditingCase(legalCase);
    setShowForm(true);
    setFormData({
      sno: legalCase.sno,
      LCT_id: legalCase.LCT_id,
      court: legalCase.court,
      priority: legalCase.priority,
      submissionDate: formatDateForDisplay(legalCase.submissionDate),
      hearingDate: formatDateForDisplay(legalCase.hearingDate),
      description: legalCase.description,
      department: legalCase.department,
      status: legalCase.status,
      activityNotes: legalCase.activityNotes,
      assigned_to: legalCase.assigned_to || [], // Ensure array
      assigned_by: userData?.user?.user_id,
      user_id: userData?.user?.user_id,
    });
  };

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    const permanent = recycleBin ? true : false;

    if (
      window.confirm(
        `${recycleBin ? "Delete Permanently" : "Delete into recycle bin"}`
      )
    ) {
      try {
        const response = await axios.delete(
          `${gapi}/LCT?user_id=${userData?.user?.user_id}&LCT_id=${id}&permanent=${permanent}`
        );

        if (recycleBin) {
          setDeleted(deleted.filter((p) => p.LCT_id !== id));
        } else {
          const caseToDelete = cases.find((p) => p.LCT_id === id);
          setCases(cases.filter((p) => p.LCT_id !== id));
          if (caseToDelete) {
            setDeleted([...deleted, caseToDelete]);
          }
        }
        if (expandedRow === id) {
          setExpandedRow(null);
        }

        setToast({
          message: `Case ${
            recycleBin ? "permanently deleted" : "moved to recycle bin"
          } successfully`,
          type: "success",
        });

        setEditing(false);
      } catch (error) {
        setToast({
          message: `${error.errorMessage || "Internal Server Error"}`,
          type: "error",
        });
      }
    }
  };

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle user selection for assigned_to (checkbox style)
  const handleUserSelect = (userId) => {
    const currentAssigned = formData.assigned_to || [];

    if (currentAssigned.includes(userId)) {
      // Remove user if already selected
      setFormData((prev) => ({
        ...prev,
        assigned_to: currentAssigned.filter((id) => id !== userId),
      }));
    } else {
      // Add user if not selected
      setFormData((prev) => ({
        ...prev,
        assigned_to: [...currentAssigned, userId],
      }));
    }
  };

  const getPriorityClass = (priority) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") return "legal-policy-priority-high";
    if (priorityLower === "medium") return "legal-policy-priority-medium";
    if (priorityLower === "low") return "legal-policy-priority-low";
    return "";
  };

  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("review")) return "legal-policy-status-review";
    if (statusLower.includes("scheduled"))
      return "legal-policy-status-scheduled";
    if (statusLower.includes("completed"))
      return "legal-policy-status-completed";
    if (statusLower.includes("pending")) return "legal-policy-status-pending";
    if (statusLower.includes("important"))
      return "legal-policy-status-important";
    if (statusLower.includes("critical")) return "legal-policy-status-critical";
    if (statusLower.includes("awaiting")) return "legal-policy-status-awaiting";
    return "legal-policy-status-default";
  };

  const getStatusColorClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("review")) return "status-border-review";
    if (statusLower.includes("scheduled")) return "status-border-scheduled";
    if (statusLower.includes("completed")) return "status-border-completed";
    if (statusLower.includes("pending")) return "status-border-pending";
    if (statusLower.includes("important")) return "status-border-important";
    if (statusLower.includes("critical")) return "status-border-critical";
    if (statusLower.includes("awaiting")) return "status-border-awaiting";
    return "status-border-default";
  };

  const clearFilter = () => {
    setFilter("");
  };

  // Mobile Card Component
  const MobileCaseCard = ({ legalCase, isDeleted }) => (
    <div
      className={`legal-mobile-card ${
        expandedRow === legalCase.id ? "expanded" : ""
      }`}
      onClick={() => handleRowClick(legalCase.id)}
    >
      <div className="legal-mobile-card-header">
        <div className="legal-mobile-card-title">
          <span className="legal-mobile-sno">{legalCase.sno}.</span>
          <span className="legal-mobile-court">{legalCase.court}</span>
        </div>
        <div className="legal-mobile-priority-status">
          <span
            className={`legal-mobile-priority ${getPriorityClass(
              legalCase.priority
            )}`}
          >
            {legalCase.priority}
          </span>
          <span
            className={`legal-mobile-status ${getStatusClass(
              legalCase.status
            )}`}
          >
            {legalCase.status}
          </span>
        </div>
      </div>

      <div className="legal-mobile-card-body">
        <div className="legal-mobile-field">
          <label>Department:</label>
          <span>{legalCase.department}</span>
        </div>
        <div className="legal-mobile-field">
          <label>Assigned To:</label>
          <div className="assigned-users-tags">
            {legalCase.assigned_to_names?.map((name, index) => (
              <span key={index} className="assigned-user-tag">
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="legal-mobile-field">
          <label>Submission Date:</label>
          <span>{formatDateForDisplay(legalCase.submissionDate)}</span>
        </div>
        <div className="legal-mobile-field">
          <label>Hearing Date:</label>
          <span>{formatDateForDisplay(legalCase.hearingDate)}</span>
        </div>
        <div className="legal-mobile-field">
          <label>Description:</label>
          <span className="legal-mobile-description">
            {legalCase.description}
          </span>
        </div>
      </div>

      {expandedRow === legalCase.id && (
        <div className="legal-mobile-card-details">
          <div className="legal-mobile-field">
            <label>Activity Notes:</label>
            <span className="legal-mobile-description">
              {legalCase.activityNotes || "-"}
            </span>
          </div>
          <div className="legal-mobile-field">
            <label>Assigned By:</label>
            <span className="legal-mobile-description">
              {getUserNameById(legalCase.assigned_by)}
            </span>
          </div>
        </div>
      )}

      <div className="legal-mobile-card-actions">
        <button
          onClick={(e) => toggleHistory(legalCase.LCT_id, e)}
          className="legal-policy-btn legal-policy-btn-small"
        >
          history
        </button>
        {openHistoryId === legalCase.LCT_id && (
          <History
            record_id={legalCase.LCT_id}
            setHistoryOpen={setOpenHistoryId}
          />
        )}
        {canUserEditCase(legalCase) && !isDeleted ? (
          <>
            <button
              className="legal-policy-btn legal-policy-btn-small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(legalCase);
              }}
            >
              <Editic />
            </button>

            <button
              className="legal-policy-btn legal-policy-btn-small delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(legalCase.LCT_id);
              }}
            >
              <Deleteic />
            </button>
          </>
        ) : isDeleted && isUserCaseOwner(legalCase) ? (
          <button
            className="legal-policy-btn legal-policy-btn-small delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(legalCase.LCT_id);
            }}
          >
            Permanent Delete
          </button>
        ) : (
          !isDeleted && (
            <span className="legal-mobile-not-owner">Not the owner</span>
          )
        )}
      </div>
    </div>
  );

  // Show loading/error states
  if (userLoading) {
    return (
      <div className="legal-policy-page-content">
        <div className="legal-policy-card">
          <div className="legal-policy-loading">Loading user session...</div>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="legal-policy-page-content">
        <div className="legal-policy-card">
          <div className="legal-policy-error">
            <h3>Authentication Required</h3>
            <p>Please log in to access legal case features.</p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="legal-policy-btn"
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
      <div className="legal-policy-page-content">
        <div className="legal-policy-card">
          <div className="legal-policy-loading">Loading legal cases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-policy-page-content">
      <div className="legal-policy-card">
        <div className="headlegal">
          <h1 className="legal-policy-title">
            Legal Case Tracker {recycleBin && "> recycle bin"}
          </h1>
        </div>

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

        <div className="legal-policy-controls">
          <div className={isMobile ? "filtercontain" : "filtercon"}>
            <input
              type="text"
              className="legal-policy-filter-input"
              placeholder="Filter by court / department / status / assigned to"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <button
              className="legal-policy-btn legal-policy-btn-ghost legal-policy-btn-small"
              onClick={clearFilter}
            >
              Clear
            </button>
          </div>
          {!recycleBin && !editing && (
            <button
              className="legal-policy-btn legal-policy-btn-small"
              onClick={handleAddNew}
            >
              Add new
            </button>
          )}
          <button
            className="legal-policy-btn legal-policy-btn-small"
            onClick={() => {
              setRecycleBin((prev) => !prev);
            }}
          >
            <Binic />
          </button>
        </div>

        {showForm && !recycleBin && (
          <div className="legal-policy-form-wrap">
            <h3 className="form-title">
              {editingCase ? "Edit Case" : "Add New Case"}
            </h3>

            {/* Row 1: S.No, Court, Priority */}
            <div className="legal-policy-form-row">
              <div className="form-field-group">
                <label className="form-label">S.No</label>
                <input
                  type="number"
                  className="legal-policy-input legal-policy-input-small"
                  placeholder="S.No"
                  value={formData.sno}
                  // onChange={(e) => handleInputChange("sno", e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Court</label>
                <input
                  type="text"
                  className="legal-policy-input"
                  placeholder="Court Name"
                  value={formData.court}
                  onChange={(e) => handleInputChange("court", e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Submission Date</label>
                <input
                  type="date"
                  className="legal-policy-input"
                  value={formData.submissionDate}
                  onChange={(e) =>
                    handleInputChange("submissionDate", e.target.value)
                  }
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Hearing Date</label>
                <input
                  type="date"
                  className="legal-policy-input"
                  value={formData.hearingDate}
                  onChange={(e) =>
                    handleInputChange("hearingDate", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 2: Department, Priority, Status */}
            <div className="legal-policy-form-row">
              <div className="form-field-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="legal-policy-input"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                />
              </div>
              <div className="form-field-group">
                <label className="form-label">Priority</label>
                <select
                  className="legal-policy-select"
                  value={formData.priority}
                  onChange={(e) =>
                    handleInputChange("priority", e.target.value)
                  }
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="form-label">Status</label>
                <select
                  className="legal-policy-select"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Hearing Scheduled">Hearing Scheduled</option>
                  <option value="Documents Submitted">
                    Documents Submitted
                  </option>
                  <option value="Awaiting Response">Awaiting Response</option>
                  <option value="Completed">Completed</option>
                  <option value="Important">Important</option>
                  <option value="Pending">Pending</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Row 3: Assign To - Full Width */}
            <div className="legal-policy-form-row full-width-row">
              <div className="form-field-group form-field-full">
                <label className="form-label">
                  Assign To: <span className="required">*</span>
                </label>
                <div className="user-selection-container">
                  <div className="user-selection-grid">
                    {allUsers
                      .filter((user) => {
                        // Filter out current user
                        if (
                          userData?.user?.user_id &&
                          user.cs_user_id === userData.user.user_id
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((user) => (
                        <div
                          key={user.cs_user_id}
                          className={`user-option ${
                            formData.assigned_to?.includes(user.cs_user_id)
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => handleUserSelect(user.cs_user_id)}
                        >
                          <div className="user-checkbox">
                            {formData.assigned_to?.includes(
                              user.cs_user_id
                            ) && <div className="checkmark">✓</div>}
                          </div>
                          <span className="user-name">{user.cs_user_name}</span>
                        </div>
                      ))}
                  </div>
                  {formData.assigned_to && formData.assigned_to.length > 0 ? (
                    <div className="selected-users">
                      <strong>Selected: </strong>
                      {getUserNamesString(formData.assigned_to)}
                    </div>
                  ) : (
                    <div className="selection-warning">
                      Please select at least one user
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Description */}
            <div className="legal-policy-form-row">
              <div className="form-field-group form-field-full">
                <label className="form-label">Case Description</label>
                <textarea
                  className="legal-policy-textarea"
                  rows="3"
                  placeholder="Enter case description..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Row 5: Activity Notes */}
            <div className="legal-policy-form-row">
              <div className="form-field-group form-field-full">
                <label className="form-label">Activity Notes</label>
                <textarea
                  className="legal-policy-textarea"
                  rows="3"
                  placeholder="Enter activity notes or status updates..."
                  value={formData.activityNotes}
                  onChange={(e) =>
                    handleInputChange("activityNotes", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="legal-policy-form-actions">
              <button className="legal-policy-btn" onClick={handleSave}>
                {editingCase ? "Update Case" : "Save Case"}
              </button>
              <button
                className="legal-policy-btn legal-policy-btn-ghost"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        {!isMobile && (
          <div className="tablecon">
            <table className="legal-policy-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Court</th>
                  <th>Priority</th>
                  <th>Date of Submission</th>
                  <th>Date of Hearing</th>
                  <th>Department</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                  {!recycleBin && <th>History</th>}
                </tr>
              </thead>
              <tbody>
                {!recycleBin ? (
                  filteredCases.length > 0 ? (
                    filteredCases.map((legalCase) => (
                      <React.Fragment key={legalCase.LCT_id || legalCase.id}>
                        <tr
                          className="legal-policy-table-row"
                          onClick={() => handleRowClick(legalCase.id)}
                        >
                          <td>{legalCase.sno}</td>
                          <td>{legalCase.court}</td>
                          <td className={getPriorityClass(legalCase.priority)}>
                            {legalCase.priority}
                          </td>
                          <td>
                            {formatDateForDisplay(legalCase.submissionDate)}
                          </td>
                          <td>{formatDateForDisplay(legalCase.hearingDate)}</td>
                          <td>{legalCase.department}</td>
                          <td>
                            <div className="assigned-users-tags">
                              {legalCase.assigned_to_names?.map(
                                (name, index) => (
                                  <span
                                    key={index}
                                    className="assigned-user-tag"
                                  >
                                    {name}
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${getStatusColorClass(
                                legalCase.status
                              )}`}
                            >
                              {legalCase.status}
                            </span>
                          </td>
                          <td className="legal-btncon">
                            {canUserEditCase(legalCase) ? (
                              <>
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(legalCase);
                                  }}
                                >
                                  <Editic />
                                </button>
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(legalCase.LCT_id);
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHistory(legalCase.LCT_id, e);
                              }}
                              className="bbtn"
                            >
                              click
                            </button>
                            {openHistoryId === legalCase.LCT_id && (
                              <History
                                record_id={legalCase.LCT_id}
                                setHistoryOpen={setOpenHistoryId}
                              />
                            )}
                          </td>
                        </tr>
                        {expandedRow === legalCase.id && (
                          <tr className="legal-policy-details-row">
                            <td colSpan="10">
                              <div className="legal-policy-details-content">
                                <div>
                                  <strong>Assigned To:</strong>{" "}
                                  {getUserNamesString(legalCase.assigned_to)}
                                </div>
                                <div>
                                  <strong>Assigned By:</strong>{" "}
                                  {getUserNameById(legalCase.assigned_by)}
                                </div>
                                <div>
                                  <strong>Activity Notes:</strong>{" "}
                                  {legalCase.activityNotes || "-"}
                                </div>
                                <div>
                                  <strong>Case Details:</strong>{" "}
                                  {legalCase.description}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="legal-policy-no-data">
                        {filter
                          ? `No cases match "${filter}"`
                          : "No cases added yet"}
                      </td>
                    </tr>
                  )
                ) : filteredDeleted.length > 0 ? (
                  filteredDeleted.map((legalCase) => (
                    <React.Fragment key={legalCase.LCT_id || legalCase.id}>
                      <tr
                        className="legal-policy-table-row"
                        onClick={() => handleRowClick(legalCase.id)}
                      >
                        <td>{legalCase.sno}</td>
                        <td>{legalCase.court}</td>
                        <td className={getPriorityClass(legalCase.priority)}>
                          {legalCase.priority}
                        </td>
                        <td>
                          {formatDateForDisplay(legalCase.submissionDate)}
                        </td>
                        <td>{formatDateForDisplay(legalCase.hearingDate)}</td>
                        <td>{legalCase.department}</td>
                        <td>
                          <div className="assigned-users-tags">
                            {legalCase.assigned_to_names?.map((name, index) => (
                              <span key={index} className="assigned-user-tag">
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getStatusColorClass(
                              legalCase.status
                            )}`}
                          >
                            {legalCase.status}
                          </span>
                        </td>
                        <td className="legal-btncon">
                          {isUserCaseOwner(legalCase) ? (
                            <button
                              className="iconcon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(legalCase.LCT_id);
                              }}
                            >
                              <Deleteic />
                            </button>
                          ) : (
                            "Not the owner"
                          )}
                        </td>
                        <td>-</td>
                      </tr>
                      {expandedRow === legalCase.id && (
                        <tr className="legal-policy-details-row">
                          <td colSpan="10">
                            <div className="legal-policy-details-content">
                              <div>
                                <strong>Assigned To:</strong>{" "}
                                {getUserNamesString(legalCase.assigned_to)}
                              </div>
                              <div>
                                <strong>Assigned By:</strong>{" "}
                                {getUserNameById(legalCase.assigned_by)}
                              </div>
                              <div>
                                <strong>Activity Notes:</strong>{" "}
                                {legalCase.activityNotes || "-"}
                              </div>
                              <div>
                                <strong>Case Details:</strong>{" "}
                                {legalCase.description}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="legal-policy-no-data">
                      {filter
                        ? `No deleted cases match "${filter}"`
                        : "No deleted cases found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card View */}
        {isMobile && (
          <div className="legal-mobile-container">
            {!recycleBin ? (
              filteredCases.length > 0 ? (
                filteredCases.map((legalCase) => (
                  <MobileCaseCard
                    key={legalCase.LCT_id || legalCase.id}
                    legalCase={legalCase}
                    isDeleted={false}
                  />
                ))
              ) : (
                <div className="legal-mobile-empty">
                  {filter ? `No cases match "${filter}"` : "No cases added yet"}
                </div>
              )
            ) : filteredDeleted.length > 0 ? (
              filteredDeleted.map((legalCase) => (
                <MobileCaseCard
                  key={legalCase.LCT_id || legalCase.id}
                  legalCase={legalCase}
                  isDeleted={true}
                />
              ))
            ) : (
              <div className="legal-mobile-empty">
                {filter
                  ? `No deleted cases match "${filter}"`
                  : "No deleted cases found"}
              </div>
            )}
          </div>
        )}

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
  );
};

export default LegalExpansion;

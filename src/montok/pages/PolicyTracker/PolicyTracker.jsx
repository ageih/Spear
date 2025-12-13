import React, { useState, useEffect } from "react";
import "./PolicyTracker.css";
import axios from "axios";
import { gapi } from "../../component/GlobalAPI";
import { useUserSession } from "../../component/useUserSession";
import Toast from "../../component/Toast";
import { useUser } from "../../../LevelContext";
import History from "../../component/histry/Htory";
import { Deleteic, Editic } from "../../component/UseIcons";

const PolicyTracker = ({ filterToPage, setSummaryInfo }) => {
  const contextuser = useUser();
  const valueuser = contextuser?.levelUser;

  // Use the new user session hook
  const {
    userData,
    isLoading: userLoading,
    error: userError,
  } = useUserSession();

  const [policies, setPolicies] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [deleted, setDeleted] = useState([]);
  const [recycleBin, setRecycleBin] = useState(false);
  const [toast, setToast] = useState(null);
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

  // Date range filter function - IMPROVED
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

    return null;
  };

  // Check if policy is pending - FIXED to handle "Pending" with capital P
  const isPolicyPending = (policy) => {
    const status = (policy.status || "").toLowerCase();
    return status === "pending"; // Exact match for "pending"
  };

  // Check if deadline is within date range - IMPROVED for API date format
  const isDeadlineInRange = (deadline, start, end) => {
    if (!deadline || deadline === "N/A" || deadline === "") return false;

    try {
      // Handle API date format "2025-10-31 21:32:43" - extract just the date part
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

  const toggleHistory = (recordId, e) => {
    if (e) {
      e.stopPropagation(); // Stop event propagation
    }
    setOpenHistoryId((prevId) => (prevId === recordId ? null : recordId));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const allUsers = React.useMemo(() => {
    if (!valueuser) return [];

    const users = [];
    Object.keys(valueuser).forEach((key) => {
      if (Array.isArray(valueuser[key])) {
        users.push(...valueuser[key]);
      }
    });

    return users;
  }, [valueuser]);

  const [formData, setFormData] = useState({
    id: "",
    sl: "",
    PT_id: "",
    user_id: "",
    policy: "",
    department: "",
    officer: "",
    priority: "Medium",
    status: "Drafted",
    remarks: "",
    deadline: "",
    review: "",
    nudge: "",
    assigned_to: [], // Changed to array
    assigned_by: "",
  });

  const getUserNameById = (userId) => {
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
  };

  // Helper to get multiple user names (FIXED: returns array)
  const getAssignedToNames = (assignedTo) => {
    // Handle both array and string
    let ids = assignedTo;
    if (!ids) return []; // Return empty array

    if (typeof ids === "string") {
      if (ids.includes(",")) {
        ids = ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id !== "");
      } else if (ids.trim() !== "") {
        ids = [ids.trim()];
      } else {
        ids = [];
      }
    } else if (!Array.isArray(ids)) {
      ids = [];
    }

    const names = ids.map((userId) => getUserNameById(userId));
    return names; // Return as array
  };

  // Helper to get names as string for display
  const getAssignedToNamesString = (assignedTo) => {
    const names = getAssignedToNames(assignedTo);
    if (names.length === 0) return "Unassigned";
    return names.join(", ");
  };

  // Get assigned user badges for table display
  const getAssignedUserBadges = (assignedTo) => {
    const names = getAssignedToNames(assignedTo);
    if (names.length === 0) return null;

    return names.map((name, index) => (
      <span key={index} className="assigned-user-badge">
        {name}
      </span>
    ));
  };

  // Handle user selection (like LetterTracker)
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

  // Format date for display - extracts date part from API format
  const formatDateForDisplay = (apiDate) => {
    if (!apiDate || apiDate === "N/A") return "N/A";
    try {
      // Extract just the date part from "2025-10-31 21:32:43"
      return apiDate.split(" ")[0];
    } catch (error) {
      console.error("Error formatting date:", apiDate, error);
      return apiDate;
    }
  };

  // Fetch policies function - UPDATED to handle arrays
  const fetchPolicies = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/PT?user_id=${userData.user.user_id}`
      );
      const ptdata = response.data.response;

      const mappedData = ptdata.map((item, index) => {
        // Convert assigned_to to array if it's a comma-separated string
        let assignedToArray = [];
        if (item.assigned_to) {
          if (typeof item.assigned_to === "string") {
            if (item.assigned_to.includes(",")) {
              assignedToArray = item.assigned_to
                .split(",")
                .map((id) => id.trim())
                .filter((id) => id !== "");
            } else if (item.assigned_to.trim() !== "") {
              assignedToArray = [item.assigned_to.trim()];
            }
          } else if (Array.isArray(item.assigned_to)) {
            assignedToArray = item.assigned_to;
          }
        }

        return {
          id: item.id,
          PT_id: item.PT_id,
          user_id: item.user_id,
          sl: index + 1,
          policy: item.policy_name || "Unnamed Policy",
          department: item.department_in_charge || "No Department",
          officer: item.nodal_officer || "No Officer",
          priority: item.priority || "Medium",
          status: item.current_status || "Drafted",
          deadline: item.tentative_deadline || "N/A",
          remarks: item.activity_status || "",
          review: item.last_review_date || "N/A",
          nudge: item.nudge || "No next steps",
          assigned_to: assignedToArray, // Now an array
          assigned_to_name: getAssignedToNamesString(assignedToArray), // For display (string)
          assigned_by: item.assigned_by || "",
        };
      });
      setPolicies(mappedData);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const fetchDeletedPolicies = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/PT?user_id=${userData.user.user_id}&deleted=true`
      );
      const ptdata = response.data.response;

      const mappedData = ptdata.map((item, index) => {
        // Convert assigned_to to array if it's a comma-separated string
        let assignedToArray = [];
        if (item.assigned_to) {
          if (typeof item.assigned_to === "string") {
            if (item.assigned_to.includes(",")) {
              assignedToArray = item.assigned_to
                .split(",")
                .map((id) => id.trim())
                .filter((id) => id !== "");
            } else if (item.assigned_to.trim() !== "") {
              assignedToArray = [item.assigned_to.trim()];
            }
          } else if (Array.isArray(item.assigned_to)) {
            assignedToArray = item.assigned_to;
          }
        }

        return {
          id: item.id,
          PT_id: item.PT_id,
          user_id: item.user_id,
          sl: index + 1,
          policy: item.policy_name || "Unnamed Policy",
          department: item.department_in_charge || "No Department",
          officer: item.nodal_officer || "No Officer",
          priority: item.priority || "Medium",
          status: item.current_status || "Drafted",
          deadline: item.tentative_deadline || "N/A",
          remarks: item.activity_status || "",
          review: item.last_review_date || "N/A",
          nudge: item.nudge || "No next steps",
          assigned_to: assignedToArray, // Now an array
          assigned_to_name: getAssignedToNamesString(assignedToArray), // For display (string)
          assigned_by: item.assigned_by || "",
        };
      });
      setDeleted(mappedData);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // Update summary counts with proper filtering logic - FIXED
  const updateSummaryCounts = (updatedPolicies) => {
    if (!setSummaryInfo) return;

    const today = new Date();

    // Important count - Policies with "Important" status
    const importantCount = updatedPolicies.filter(
      (p) => !p.deleted && p.status && p.status.toLowerCase() === "important"
    ).length;

    // Pending count - policies with pending status
    const pendingCount = updatedPolicies.filter(
      (p) => !p.deleted && isPolicyPending(p)
    ).length;

    // Due This Week count - pending policies with deadline this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const dueThisWeekCount = updatedPolicies.filter((p) => {
      if (p.deleted || !isPolicyPending(p)) return false;
      return isDeadlineInRange(p.deadline, startOfWeek, endOfWeek);
    }).length;

    // Due This Month count - pending policies with deadline this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dueThisMonthCount = updatedPolicies.filter((p) => {
      if (p.deleted || !isPolicyPending(p)) return false;
      return isDeadlineInRange(p.deadline, startOfMonth, endOfMonth);
    }).length;

    setSummaryInfo((prev) => ({
      ...prev,
      policies: [
        { label: "Important", value: importantCount },
        { label: "Pending", value: pendingCount },
        { label: "Due This Week", value: dueThisWeekCount },
        { label: "Due this month", value: dueThisMonthCount },
      ],
    }));
  };

  // Fetch data when user data is ready
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.user?.user_id) {
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([fetchPolicies(), fetchDeletedPolicies()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      fetchData();
    }
  }, [userData, userLoading, allUsers]);

  // Update summary counts whenever policies change
  useEffect(() => {
    updateSummaryCounts(policies);
  }, [policies]);

  useEffect(() => {
    if (editingPolicy && allUsers.length > 0) {
      setFormData((prev) => ({
        ...prev,
        assigned_to: editingPolicy.assigned_to || [],
      }));
    }
  }, [editingPolicy, allUsers]);

  // Filtered data based on current filter
  const filteredPolicies = policies.filter((policy) => {
    if (!filter || filter.trim() === "") return true;

    const dateRangeFilter = getDateRangeFilter(filter);

    // Handle special date filters
    if (dateRangeFilter) {
      const isPending = isPolicyPending(policy);
      const inRange = isDeadlineInRange(
        policy.deadline,
        dateRangeFilter.start,
        dateRangeFilter.end
      );

      if (!isPending) return false;
      return inRange;
    }

    // Regular text search
    const policyName = policy.policy || "";
    const department = policy.department || "";
    const status = policy.status || "";
    const officer = policy.officer || "";
    const assignedTo = policy.assigned_to_name || "";

    return (
      policyName.toLowerCase().includes(filter.toLowerCase()) ||
      department.toLowerCase().includes(filter.toLowerCase()) ||
      status.toLowerCase().includes(filter.toLowerCase()) ||
      officer.toLowerCase().includes(filter.toLowerCase()) ||
      assignedTo.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const filteredDeleted = deleted.filter((deletedPolicy) => {
    if (!filter || filter.trim() === "") return true;

    const dateRangeFilter = getDateRangeFilter(filter);

    if (dateRangeFilter) {
      const isPending = isPolicyPending(deletedPolicy);
      const inRange = isDeadlineInRange(
        deletedPolicy.deadline,
        dateRangeFilter.start,
        dateRangeFilter.end
      );

      if (!isPending) return false;
      return inRange;
    }

    const policyName = deletedPolicy.policy || "";
    const department = deletedPolicy.department || "";
    const status = deletedPolicy.status || "";
    const officer = deletedPolicy.officer || "";
    const assignedTo = deletedPolicy.assigned_to_name || "";

    return (
      policyName.toLowerCase().includes(filter.toLowerCase()) ||
      department.toLowerCase().includes(filter.toLowerCase()) ||
      status.toLowerCase().includes(filter.toLowerCase()) ||
      officer.toLowerCase().includes(filter.toLowerCase()) ||
      assignedTo.toLowerCase().includes(filter.toLowerCase())
    );
  });

  // Check if current user can edit/delete the policy (updated for array)
  const canUserEditPolicy = (policy) => {
    if (!userData?.user?.user_id) return false;

    return (
      userData.user.user_id === policy.user_id ||
      (Array.isArray(policy.assigned_to) &&
        policy.assigned_to.includes(userData.user.user_id))
    );
  };

  // Check if current user is the owner of the policy (for permanent delete)
  const isUserPolicyOwner = (policy) => {
    if (!userData?.user?.user_id) return false;

    return userData.user.user_id === policy.user_id;
  };

  const handleAddNew = () => {
    setShowForm(true);
    setEditingPolicy(null);
    setFormData({
      sl: policies.length + 1,
      policy: "",
      department: "",
      officer: "",
      priority: "Medium",
      status: "Drafted",
      remarks: "",
      deadline: "",
      review: "",
      nudge: "",
      assigned_to: [],
      assigned_by: userData?.user?.user_id || "",
      user_id: userData?.user?.user_id || "",
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPolicy(null);
  };

  const handleSave = async () => {
    console.log("click register", formData);
    if (!formData.policy?.trim()) {
      setToast({
        message: `Please enter Policy Name`,
        type: "error",
      });
      return;
    }
    if (!formData.department?.trim()) {
      setToast({
        message: `Please enter Department in Charge`,
        type: "error",
      });
      return;
    }
    if (!formData.officer?.trim()) {
      setToast({
        message: `Please enter Nodal Officer`,
        type: "error",
      });
      return;
    }
    if (!formData.priority) {
      setToast({
        message: `Please select Priority`,
        type: "error",
      });
      return;
    }
    if (!formData.status) {
      setToast({
        message: `Please select Status`,
        type: "error",
      });
      return;
    }
    if (!formData.deadline) {
      setToast({
        message: `Please select Tentative Deadline`,
        type: "error",
      });
      return;
    }
    if (!formData.review) {
      setToast({
        message: `Please select Last Review Date`,
        type: "error",
      });
      return;
    }
    if (!formData.nudge?.trim()) {
      setToast({
        message: `Please enter Next Action / Nudge`,
        type: "error",
      });
      return;
    }
    if (!formData.remarks?.trim()) {
      setToast({
        message: `Please enter Activity Status / Remarks`,
        type: "error",
      });
      return;
    }
    if (!formData.assigned_to || formData.assigned_to.length === 0) {
      setToast({
        message: `Please select at least one assignee`,
        type: "error",
      });
      return;
    }

    // Ensure we're only sending the selected users
    const assignedToIds = formData.assigned_to || [];

    const apiData = {
      data: {
        policy_name: formData.policy,
        department_in_charge: formData.department,
        nodal_officer: formData.officer,
        priority: formData.priority || "Medium",
        current_status: formData.status || "Drafted",
        tentative_deadline: formData.deadline,
        activity_status: formData.remarks,
        last_review_date: formData.review,
        nudge: formData.nudge,
        assigned_to: assignedToIds.join(","), // Convert array to comma-separated string
        assigned_by: formData.assigned_by,
        user_id: userData?.user?.user_id,
      },
    };

    console.log("Sending API data:", apiData);
    console.log("Assigned users IDs:", assignedToIds);

    try {
      let response;
      let ptid;
      if (editingPolicy) {
        response = await axios.put(
          `${gapi}/PT?PT_id=${editingPolicy.PT_id}?user_id=${userData?.user?.user_id}`,
          {
            PT_id: editingPolicy.PT_id,
            updates: apiData.data,
          }
        );
        setToast({
          message: `${formData.policy} updated successfully`,
          type: "success",
        });
        ptid = editingPolicy.PT_id;
      } else {
        response = await axios.post(
          `${gapi}/PT?user_id=${userData?.user?.user_id}`,
          apiData
        );
        setToast({
          message: `${formData.policy} created successfully`,
          type: "success",
        });
        ptid = response.data.inserted_id;
      }

      const nextSl =
        policies.length > 0 ? Math.max(...policies.map((p) => p.sl)) + 1 : 1;

      const newPolicy = {
        id: editingPolicy ? editingPolicy.id : Date.now(),
        PT_id: ptid,
        sl: editingPolicy ? formData.sl : nextSl,
        policy: formData.policy,
        department: formData.department,
        officer: formData.officer,
        priority: formData.priority || "Medium",
        status: formData.status,
        deadline: formData.deadline,
        remarks: formData.remarks,
        review: formData.review,
        nudge: formData.nudge,
        assigned_to: assignedToIds, // Use the selected users array
        assigned_to_name: getAssignedToNamesString(assignedToIds), // Use string version
        assigned_by: formData.assigned_by,
        user_id: userData?.user?.user_id,
      };

      let updatedPolicies;
      if (editingPolicy) {
        updatedPolicies = policies.map((p) =>
          p.PT_id === editingPolicy.PT_id ? newPolicy : p
        );
        setPolicies(updatedPolicies);
      } else {
        updatedPolicies = [...policies, newPolicy];
        setPolicies(updatedPolicies);
      }

      setShowForm(false);
      setEditingPolicy(null);
      setExpandedRow(null);
    } catch (error) {
      console.error("Error saving policy:", error);
      setToast({
        message: `${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
      });
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
    // Ensure assigned_to is an array
    let assignedToArray = policy.assigned_to;
    if (!assignedToArray) {
      assignedToArray = [];
    } else if (typeof assignedToArray === "string") {
      if (assignedToArray.includes(",")) {
        assignedToArray = assignedToArray
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id !== "");
      } else if (assignedToArray.trim() !== "") {
        assignedToArray = [assignedToArray.trim()];
      } else {
        assignedToArray = [];
      }
    }

    setFormData({
      ...policy,
      assigned_to: assignedToArray,
    });
  };

  const handleDelete = async (id) => {
    if (!id) {
      setToast({
        message: "Invalid policy ID",
        type: "error",
      });
      return;
    }
    const permanent = recycleBin ? true : false;
    if (
      window.confirm(
        `${
          recycleBin
            ? "Delete this policy permanently"
            : "Delete this policy into recycle bin"
        }`
      )
    ) {
      try {
        const response = await axios.delete(
          `${gapi}/PT?user_id=${userData?.user?.user_id}&PT_id=${id}&permanent=${permanent}`
        );

        let updatedPolicies;
        if (recycleBin) {
          setDeleted(deleted.filter((p) => p.PT_id !== id));
          updatedPolicies = policies;
        } else {
          const policyToDelete = policies.find((p) => p.PT_id === id);

          if (policyToDelete) {
            updatedPolicies = policies.filter((p) => p.PT_id !== id);
            setPolicies(updatedPolicies);
            setDeleted((prevDeleted) => [...prevDeleted, policyToDelete]);
          } else {
            updatedPolicies = policies;
          }
        }

        if (expandedRow === id) {
          setExpandedRow(null);
        }

        setToast({
          message: `Policy ${
            recycleBin ? "permanently deleted" : "moved to recycle bin"
          } successfully`,
          type: "success",
        });
      } catch (error) {
        setToast({
          message: `${error.errorMessage || "Internal Server Error"} `,
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

  const getPriorityBadgeClass = (priority) => {
    if (!priority) return "priority-badge priority-badge-medium";
    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") return "priority-badge priority-badge-high";
    if (priorityLower === "medium")
      return "priority-badge priority-badge-medium";
    if (priorityLower === "low") return "priority-badge priority-badge-low";
    return "priority-badge priority-badge-medium";
  };

  // Enhanced status class with different colors for each status
  const getStatusBadgeClass = (status) => {
    if (!status) return "status-badge status-badge-drafted";
    const statusLower = status.toLowerCase();

    if (statusLower === "completed")
      return "status-badge status-badge-completed";
    if (statusLower === "under implementation")
      return "status-badge status-badge-implementation";
    if (statusLower === "approved") return "status-badge status-badge-approved";
    if (statusLower === "drafted") return "status-badge status-badge-drafted";
    if (statusLower === "pending") return "status-badge status-badge-pending";
    if (statusLower === "important")
      return "status-badge status-badge-important";
    if (statusLower === "critical") return "status-badge status-badge-critical";

    return "status-badge status-badge-drafted";
  };

  const clearFilter = () => {
    setFilter("");
  };

  const toggleRecycleBin = () => {
    setRecycleBin((prev) => !prev);
    setShowForm(false);
    setEditingPolicy(null);
    setExpandedRow(null);
  };

  // Show loading/error states
  if (userLoading) {
    return (
      <div className="policy-page-content">
        <div className="policy-card">
          <div className="policy-loading">Loading user session...</div>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="policy-page-content">
        <div className="policy-card">
          <div className="policy-error">
            <h3>Authentication Required</h3>
            <p>Please log in to access policy features.</p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="policy-btn"
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
      <div className="policy-page-content">
        <div className="policy-card">
          <div className="policy-loading">Loading policies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-page-content">
      <div className="policy-card">
        <h1 className="policy-title">
          Policy Tracker {recycleBin && " > recycle bin"}
        </h1>

        {/* Show active filter badge */}
        {filter && (
          <div className="active-filter-badge">
            <span>
              🔍 Filtering by: <strong>{filter}</strong>
              {filterToPage && filterToPage === filter && " (from dashboard)"}
            </span>
            <button onClick={() => setFilter("")} className="clear-filter-btn">
              Clear Filter
            </button>
          </div>
        )}

        <div className="policy-controls">
          <input
            type="text"
            className="policy-filter-input"
            placeholder={
              recycleBin
                ? "Filter deleted policies..."
                : "Filter by policy / department / status / assigned to"
            }
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            className="policy-btn policy-btn-ghost policy-btn-small"
            onClick={clearFilter}
          >
            Clear
          </button>
          {!showForm && (
            <>
              {recycleBin === false && (
                <button
                  className="policy-btn policy-btn-small"
                  onClick={handleAddNew}
                >
                  Add new
                </button>
              )}
              <button
                className="policy-btn policy-btn-small"
                onClick={toggleRecycleBin}
              >
                {recycleBin ? "Back to Policies" : "Recycle Bin"}
              </button>
            </>
          )}
        </div>

        {showForm && !recycleBin && (
          <div className="policy-form-wrap">
            <div className="form-header">
              <h3 className="form-title">
                {editingPolicy ? "Edit Policy" : "Add New Policy"}
              </h3>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">Basic Information</h4>
              <div className="policy-form-row">
                <div className="form-group">
                  <label htmlFor="sl-no" className="form-label">
                    Sl No <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="sl-no"
                    className="policy-input"
                    placeholder="Sl No"
                    value={formData.sl}
                    onChange={(e) =>
                      handleInputChange("sl", parseInt(e.target.value) || "")
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="policy-name" className="form-label">
                    Policy Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="policy-name"
                    className="policy-input"
                    placeholder="Policy Name"
                    value={formData.policy}
                    onChange={(e) =>
                      handleInputChange("policy", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department" className="form-label">
                    Department in Charge <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="department"
                    className="policy-input"
                    placeholder="Department in Charge"
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="policy-form-row">
                <div className="form-group">
                  <label htmlFor="officer" className="form-label">
                    Nodal Officer <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="officer"
                    className="policy-input"
                    placeholder="Nodal Officer"
                    value={formData.officer}
                    onChange={(e) =>
                      handleInputChange("officer", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="priority" className="form-label">
                    Priority <span className="required">*</span>
                  </label>
                  <select
                    id="priority"
                    className="policy-select"
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
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Current Status <span className="required">*</span>
                  </label>
                  <select
                    id="status"
                    className="policy-select"
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                  >
                    <option value="Drafted">Drafted</option>
                    <option value="Approved">Approved</option>
                    <option value="Under Implementation">
                      Under Implementation
                    </option>
                    <option value="Important">Important</option>
                    <option value="Pending">Pending</option>
                    <option value="Critical">Critical</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">Dates</h4>
              <div className="policy-form-row">
                <div className="form-group">
                  <label htmlFor="deadline" className="form-label">
                    Tentative Deadline <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    className="policy-input"
                    placeholder="Tentative Deadline"
                    value={formData.deadline}
                    onChange={(e) =>
                      handleInputChange("deadline", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="review" className="form-label">
                    Last Review Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="review"
                    className="policy-input"
                    placeholder="Last Review Date"
                    value={formData.review}
                    onChange={(e) =>
                      handleInputChange("review", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">Assignment</h4>
              <div className="policy-form-row-full">
                <div className="user-selection-container">
                  <label className="form-label">
                    Assigned To: <span className="required">*</span>
                  </label>
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
                      {getAssignedToNames(formData.assigned_to).join(", ")}
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
            </div>

            <div className="form-section">
              <h4 className="form-section-title">Details</h4>
              <div className="policy-form-row">
                <div className="form-group">
                  <label htmlFor="nudge" className="form-label">
                    Next Action / Nudge <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="nudge"
                    className="policy-input"
                    placeholder="Next Action / Nudge"
                    value={formData.nudge}
                    onChange={(e) => handleInputChange("nudge", e.target.value)}
                  />
                </div>
              </div>

              <div className="policy-form-row">
                <div className="form-group full-width">
                  <label htmlFor="remarks" className="form-label">
                    Activity Status / Remarks{" "}
                    <span className="required">*</span>
                  </label>
                  <textarea
                    id="remarks"
                    className="policy-textarea"
                    rows="4"
                    placeholder="Activity Status / Remarks"
                    value={formData.remarks}
                    onChange={(e) =>
                      handleInputChange("remarks", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="policy-form-actions">
              <button
                className="policy-btn policy-btn-primary"
                onClick={handleSave}
              >
                {editingPolicy ? "Update Policy" : "Save Policy"}
              </button>
              <button
                className="policy-btn policy-btn-ghost"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isMobile && (
          <div className="policy-table-container">
            <div className="table-scroll-wrapper">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th className="col-sl">Sl No</th>
                    <th className="col-policy">Policy Name</th>
                    <th className="col-dept">Department</th>
                    <th className="col-officer">Nodal Officer</th>
                    <th className="col-priority">Priority</th>
                    <th className="col-status">Status</th>
                    <th className="col-deadline">Deadline</th>
                    <th className="col-assigned">Assigned To</th>
                    <th className="col-nudge">Nudge</th>
                    <th className="col-remarks">Remarks</th>
                    <th className="col-actions">Actions</th>
                    {!recycleBin && <th className="col-history">History</th>}
                  </tr>
                </thead>
                <tbody>
                  {recycleBin ? (
                    filteredDeleted.length > 0 ? (
                      filteredDeleted.map((policy) => (
                        <React.Fragment key={policy.PT_id}>
                          <tr
                            className={`policy-table-row ${
                              expandedRow === policy.PT_id
                                ? "policy-row-expanded"
                                : ""
                            }`}
                            onClick={() => handleRowClick(policy.PT_id)}
                          >
                            <td className="col-sl">{policy.sl}</td>
                            <td className="col-policy">
                              <div className="full-content-cell">
                                {policy.policy}
                              </div>
                            </td>
                            <td className="col-dept">
                              <div className="full-content-cell">
                                {policy.department}
                              </div>
                            </td>
                            <td className="col-officer">
                              <div className="full-content-cell">
                                {policy.officer}
                              </div>
                            </td>
                            <td className="col-priority">
                              <div className="full-content-cell">
                                <span
                                  className={getPriorityBadgeClass(
                                    policy.priority
                                  )}
                                >
                                  {policy.priority}
                                </span>
                              </div>
                            </td>
                            <td className="col-status">
                              <div className="full-content-cell">
                                <span
                                  className={getStatusBadgeClass(policy.status)}
                                >
                                  {policy.status}
                                </span>
                              </div>
                            </td>
                            <td className="col-deadline">
                              <div className="full-content-cell">
                                {formatDateForDisplay(policy.deadline)}
                              </div>
                            </td>
                            <td className="col-assigned">
                              <div className="assigned-users-container">
                                {getAssignedUserBadges(policy.assigned_to) ||
                                  "Unassigned"}
                              </div>
                            </td>
                            <td className="col-nudge">
                              <div className="full-content-cell">
                                {policy.nudge || "-"}
                              </div>
                            </td>
                            <td className="col-remarks">
                              <div className="full-content-cell">
                                {policy.remarks || "-"}
                              </div>
                            </td>
                            <td className="col-actions">
                              <div className="full-content-cell">
                                {isUserPolicyOwner(policy) ? (
                                  <button
                                    className="iconcon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(policy.PT_id);
                                    }}
                                  >
                                    <Deleteic />
                                  </button>
                                ) : (
                                  <span className="not-owner-text">
                                    Not the owner
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedRow === policy.PT_id && (
                            <tr className="policy-details-row">
                              <td colSpan="12">
                                <div className="policy-details-content">
                                  <div>
                                    <strong>Assigned To:</strong>{" "}
                                    {policy.assigned_to_name}
                                  </div>
                                  <div>
                                    <strong>Assigned By:</strong>{" "}
                                    {getUserNameById(policy.assigned_by)}
                                  </div>
                                  <div>
                                    <strong>Tentative Date:</strong>{" "}
                                    {formatDateForDisplay(policy.deadline) ||
                                      "No review date"}
                                  </div>
                                  <div>
                                    <strong>Full Remarks:</strong>{" "}
                                    {policy.remarks || "No remarks"}
                                  </div>
                                  <div>
                                    <strong>Detailed Next Actions:</strong>{" "}
                                    {policy.nudge || "No next actions"}
                                  </div>
                                  <div>
                                    <strong>Review Notes:</strong> Last reviewed
                                    on{" "}
                                    {formatDateForDisplay(policy.review) ||
                                      "No review date"}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="policy-no-data">
                          {filter
                            ? `No deleted policies match "${filter}"`
                            : "No deleted policies found"}
                        </td>
                      </tr>
                    )
                  ) : filteredPolicies.length > 0 ? (
                    filteredPolicies.map((policy) => (
                      <React.Fragment key={policy.PT_id}>
                        <tr
                          className={`policy-table-row ${
                            expandedRow === policy.PT_id
                              ? "policy-row-expanded"
                              : ""
                          }`}
                          onClick={() => handleRowClick(policy.PT_id)}
                        >
                          <td className="col-sl">{policy.sl}</td>
                          <td className="col-policy">
                            <div className="full-content-cell">
                              {policy.policy}
                            </div>
                          </td>
                          <td className="col-dept">
                            <div className="full-content-cell">
                              {policy.department}
                            </div>
                          </td>
                          <td className="col-officer">
                            <div className="full-content-cell">
                              {policy.officer}
                            </div>
                          </td>
                          <td className="col-priority">
                            <div className="full-content-cell">
                              <span
                                className={getPriorityBadgeClass(
                                  policy.priority
                                )}
                              >
                                {policy.priority}
                              </span>
                            </div>
                          </td>
                          <td className="col-status">
                            <div className="full-content-cell">
                              <span
                                className={getStatusBadgeClass(policy.status)}
                              >
                                {policy.status}
                              </span>
                            </div>
                          </td>
                          <td className="col-deadline">
                            <div className="full-content-cell">
                              {formatDateForDisplay(policy.deadline)}
                            </div>
                          </td>
                          <td className="col-assigned">
                            <div className="assigned-users-container">
                              {getAssignedUserBadges(policy.assigned_to) ||
                                "Unassigned"}
                            </div>
                          </td>
                          <td className="col-nudge">
                            <div className="full-content-cell">
                              {policy.nudge || "-"}
                            </div>
                          </td>
                          <td className="col-remarks">
                            <div className="full-content-cell">
                              {policy.remarks || "-"}
                            </div>
                          </td>
                          {canUserEditPolicy(policy) ? (
                            <td className="col-actions">
                              <div className="full-content-cell">
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(policy);
                                  }}
                                >
                                  <Editic />
                                </button>
                                <button
                                  className="iconcon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(policy.PT_id);
                                  }}
                                >
                                  <Deleteic />
                                </button>
                              </div>
                            </td>
                          ) : (
                            <td className="col-actions">
                              <div className="full-content-cell">
                                <span className="not-authorized-text">
                                  Not authorized
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="col-history">
                            <div className="full-content-cell">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHistory(policy.PT_id, e);
                                }}
                                className="policy-btn policy-btn-small"
                              >
                                click
                              </button>
                              {openHistoryId === policy.PT_id && (
                                <History
                                  record_id={policy.PT_id}
                                  setHistoryOpen={setOpenHistoryId}
                                />
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedRow === policy.PT_id && (
                          <tr className="policy-details-row">
                            <td colSpan="12">
                              <div className="policy-details-content">
                                <div>
                                  <strong>Assigned To:</strong>{" "}
                                  {policy.assigned_to_name}
                                </div>
                                <div>
                                  <strong>Assigned By:</strong>{" "}
                                  {getUserNameById(policy.assigned_by)}
                                </div>
                                <div>
                                  <strong>Tentative Date:</strong>{" "}
                                  {formatDateForDisplay(policy.deadline) ||
                                    "No review date"}
                                </div>
                                <div>
                                  <strong>Full Remarks:</strong>{" "}
                                  {policy.remarks || "No remarks"}
                                </div>
                                <div>
                                  <strong>Detailed Next Actions:</strong>{" "}
                                  {policy.nudge || "No next actions"}
                                </div>
                                <div>
                                  <strong>Review Notes:</strong> Last reviewed
                                  on{" "}
                                  {formatDateForDisplay(policy.review) ||
                                    "No review date"}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="policy-no-data">
                        {filter
                          ? `No policies match "${filter}"`
                          : "No policies added yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isMobile && (
          <div className="policy-cards-container">
            {recycleBin ? (
              filteredDeleted.length > 0 ? (
                filteredDeleted.map((policy) => (
                  <div
                    key={policy.PT_id}
                    className={`policy-card-item ${
                      expandedRow === policy.PT_id ? "expanded" : ""
                    }`}
                    onClick={() => handleRowClick(policy.PT_id)}
                  >
                    <div className="policy-card-header">
                      <div className="policy-card-sl">{policy.sl}.</div>
                      <div className="policy-card-policy">{policy.policy}</div>
                      <div className={getPriorityBadgeClass(policy.priority)}>
                        {policy.priority}
                      </div>
                    </div>

                    <div className="policy-card-details">
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Department:</span>
                        <span className="policy-card-value">
                          {policy.department}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Officer:</span>
                        <span className="policy-card-value">
                          {policy.officer}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Status:</span>
                        <span className={getStatusBadgeClass(policy.status)}>
                          {policy.status}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Deadline:</span>
                        <span className="policy-card-value">
                          {formatDateForDisplay(policy.deadline)}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Assigned To:</span>
                        <div className="assigned-users-container-mobile">
                          {getAssignedUserBadges(policy.assigned_to) ||
                            "Unassigned"}
                        </div>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Nudge:</span>
                        <span className="policy-card-value">
                          {policy.nudge || "-"}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Remarks:</span>
                        <span className="policy-card-value">
                          {policy.remarks || "-"}
                        </span>
                      </div>
                    </div>

                    {expandedRow === policy.PT_id && (
                      <div className="policy-card-expanded-content">
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Assigned To:
                          </span>
                          <span className="policy-card-expanded-value">
                            {policy.assigned_to_name}
                          </span>
                        </div>
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Assigned By:
                          </span>
                          <span className="policy-card-expanded-value">
                            {getUserNameById(policy.assigned_by)}
                          </span>
                        </div>
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Tentative Date:
                          </span>
                          <span className="policy-card-expanded-value">
                            {formatDateForDisplay(policy.deadline) ||
                              "No review date"}
                          </span>
                        </div>
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Full Remarks:
                          </span>
                          <span className="policy-card-expanded-value">
                            {policy.remarks || "No remarks"}
                          </span>
                        </div>
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Next Actions:
                          </span>
                          <span className="policy-card-expanded-value">
                            {policy.nudge || "No next actions"}
                          </span>
                        </div>
                        <div className="policy-card-expanded-item">
                          <span className="policy-card-expanded-label">
                            Review Notes:
                          </span>
                          <span className="policy-card-expanded-value">
                            Last reviewed on{" "}
                            {formatDateForDisplay(policy.review) ||
                              "No review date"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="policy-card-actions">
                      {isUserPolicyOwner(policy) ? (
                        <button
                          className="iconcon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.PT_id);
                          }}
                        >
                          <Deleteic />
                        </button>
                      ) : (
                        <span className="not-owner-text">Not the owner</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="policy-mobile-empty">
                  {filter
                    ? `No deleted policies match "${filter}"`
                    : "No deleted policies found"}
                </div>
              )
            ) : filteredPolicies.length > 0 ? (
              filteredPolicies.map((policy) => (
                <div
                  key={policy.PT_id}
                  className={`policy-card-item ${
                    expandedRow === policy.PT_id ? "expanded" : ""
                  }`}
                  onClick={() => handleRowClick(policy.PT_id)}
                >
                  <div className="policy-card-header">
                    <div className="policy-card-sl">{policy.sl}.</div>
                    <div className="policy-card-policy">{policy.policy}</div>
                    <div className={getPriorityBadgeClass(policy.priority)}>
                      {policy.priority}
                    </div>
                  </div>

                  <div className="policy-card-details">
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Department:</span>
                      <span className="policy-card-value">
                        {policy.department}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Officer:</span>
                      <span className="policy-card-value">
                        {policy.officer}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Status:</span>
                      <span className={getStatusBadgeClass(policy.status)}>
                        {policy.status}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Deadline:</span>
                      <span className="policy-card-value">
                        {formatDateForDisplay(policy.deadline)}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Assigned To:</span>
                      <div className="assigned-users-container-mobile">
                        {getAssignedUserBadges(policy.assigned_to) ||
                          "Unassigned"}
                      </div>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Nudge:</span>
                      <span className="policy-card-value">
                        {policy.nudge || "-"}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Remarks:</span>
                      <span className="policy-card-value">
                        {policy.remarks || "-"}
                      </span>
                    </div>
                  </div>

                  {expandedRow === policy.PT_id && (
                    <div className="policy-card-expanded-content">
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Assigned To:
                        </span>
                        <span className="policy-card-expanded-value">
                          {policy.assigned_to_name}
                        </span>
                      </div>
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Assigned By:
                        </span>
                        <span className="policy-card-expanded-value">
                          {getUserNameById(policy.assigned_by)}
                        </span>
                      </div>
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Tentative Date:
                        </span>
                        <span className="policy-card-expanded-value">
                          {formatDateForDisplay(policy.deadline) ||
                            "No review date"}
                        </span>
                      </div>
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Full Remarks:
                        </span>
                        <span className="policy-card-expanded-value">
                          {policy.remarks || "No remarks"}
                        </span>
                      </div>
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Next Actions:
                        </span>
                        <span className="policy-card-expanded-value">
                          {policy.nudge || "No next actions"}
                        </span>
                      </div>
                      <div className="policy-card-expanded-item">
                        <span className="policy-card-expanded-label">
                          Review Notes:
                        </span>
                        <span className="policy-card-expanded-value">
                          Last reviewed on{" "}
                          {formatDateForDisplay(policy.review) ||
                            "No review date"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="policy-card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHistory(policy.PT_id, e);
                      }}
                      className="policy-btn policy-btn-small"
                    >
                      History
                    </button>
                    {openHistoryId === policy.PT_id && (
                      <History
                        record_id={policy.PT_id}
                        setHistoryOpen={setOpenHistoryId}
                      />
                    )}
                    {canUserEditPolicy(policy) && !recycleBin ? (
                      <>
                        <button
                          className="iconcon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(policy);
                          }}
                        >
                          <Editic />
                        </button>
                        <button
                          className="iconcon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.PT_id);
                          }}
                        >
                          <Deleteic />
                        </button>
                      </>
                    ) : recycleBin && isUserPolicyOwner(policy) ? (
                      <button
                        className="iconcon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(policy.PT_id);
                        }}
                      >
                        <Deleteic />
                      </button>
                    ) : (
                      !recycleBin && (
                        <span className="not-authorized-text">
                          Not authorized
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="policy-mobile-empty">
                {filter
                  ? `No policies match "${filter}"`
                  : "No policies added yet"}
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

export default PolicyTracker;

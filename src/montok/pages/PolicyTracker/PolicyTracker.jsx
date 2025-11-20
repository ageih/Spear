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
    assigned_to: "",
    assigned_by: "",
  });

  const getUserNameById = (userId) => {
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
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

  // Fetch policies function
  const fetchPolicies = async () => {
    try {
      if (!userData?.user?.user_id) {
        return false;
      }

      const response = await axios.get(
        `${gapi}/PT?user_id=${userData.user.user_id}`
      );
      const ptdata = response.data.response;

      const mappedData = ptdata.map((item, index) => ({
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
        assigned_to: item.assigned_to || "",
        assigned_to_name: getUserNameById(item.assigned_to),
        assigned_by: item.assigned_by || "",
      }));
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

      const mappedData = ptdata.map((item, index) => ({
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
        assigned_to: item.assigned_to || "",
        assigned_to_name: getUserNameById(item.assigned_to),
        assigned_by: item.assigned_by || "",
      }));
      setDeleted(mappedData);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // Update summary counts with proper filtering logic - UPDATED
  // const updateSummaryCounts = (updatedPolicies) => {
  //   if (!setSummaryInfo) return;

  //   const today = new Date();

  //   // Important count - High priority policies
  //   const importantCount = updatedPolicies.filter(
  //     (p) => !p.deleted && (p.priority === "High" || p.priority === "high")
  //   ).length;

  //   // Pending count - policies with pending status
  //   const pendingCount = updatedPolicies.filter(
  //     (p) => !p.deleted && isPolicyPending(p)
  //   ).length;

  //   // Due This Week count - pending policies with deadline this week
  //   const startOfWeek = new Date(today);
  //   startOfWeek.setDate(today.getDate() - today.getDay());
  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6);

  //   const dueThisWeekCount = updatedPolicies.filter((p) => {
  //     if (p.deleted || !isPolicyPending(p)) return false;
  //     return isDeadlineInRange(p.deadline, startOfWeek, endOfWeek);
  //   }).length;

  //   // Due This Month count - pending policies with deadline this month
  //   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  //   const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  //   const dueThisMonthCount = updatedPolicies.filter((p) => {
  //     if (p.deleted || !isPolicyPending(p)) return false;
  //     return isDeadlineInRange(p.deadline, startOfMonth, endOfMonth);
  //   }).length;

  //   setSummaryInfo((prev) => ({
  //     ...prev,
  //     policies: [
  //       { label: "Important", value: importantCount },
  //       { label: "Pending", value: pendingCount },
  //       { label: "Due This Week", value: dueThisWeekCount },
  //       { label: "Due this month", value: dueThisMonthCount },
  //     ],
  //   }));
  // };

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

    // Debug logging to see what's being counted
    console.log("📊 Summary counts debug:", {
      important: importantCount,
      pending: pendingCount,
      dueThisWeek: dueThisWeekCount,
      dueThisMonth: dueThisMonthCount,
      totalPolicies: updatedPolicies.length,
      importantPolicies: updatedPolicies
        .filter(
          (p) =>
            !p.deleted && p.status && p.status.toLowerCase() === "important"
        )
        .map((p) => ({ policy: p.policy, status: p.status })),
    });

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
        assigned_to: editingPolicy.assigned_to,
        assigned_to_name: getUserNameById(editingPolicy.assigned_to),
      }));
    }
  }, [editingPolicy, allUsers]);

  // Filtered data based on current filter - WITH DEBUGGING
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

      console.log("🔍 Policy filter debug:", {
        policy: policy.policy,
        status: policy.status,
        isPending: isPending,
        deadline: policy.deadline,
        inRange: inRange,
        dateRange: dateRangeFilter.type,
        shouldShow: isPending && inRange,
      });

      // For date range filters, only show pending policies within the date range
      if (!isPending) {
        console.log(
          `❌ ${policy.policy} - Status is not "Pending" (current: "${policy.status}")`
        );
        return false;
      }
      if (!inRange) {
        console.log(
          `❌ ${policy.policy} - Deadline "${policy.deadline}" not in ${dateRangeFilter.type} range`
        );
        return false;
      }
      console.log(
        `✅ ${policy.policy} - Matches filter (Status: "Pending", Deadline: "${policy.deadline}")`
      );
      return true;
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

  // Check if current user can edit/delete the policy
  const canUserEditPolicy = (policy) => {
    if (!userData?.user?.user_id) return false;

    return (
      userData.user.user_id === policy.user_id ||
      userData.user.user_id === policy.assigned_to
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
      assigned_to: "",
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
      alert("Please select Status");
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
    if (!formData.assigned_to) {
      setToast({
        message: `assigned_to is missing`,
        type: "error",
      });
      return;
    }

    console.log("111111111", editingPolicy);

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
        assigned_to: formData.assigned_to,
        assigned_by: formData.assigned_by,
        user_id: userData?.user?.user_id,
      },
    };

    try {
      let response;
      let ptid;
      if (editingPolicy) {
        console.log("here trying update", apiData);
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
        console.log(response.data);
        ptid = editingPolicy.PT_id;
      } else {
        console.log(apiData, "b4 sending");
        response = await axios.post(
          `${gapi}/PT?user_id=${userData?.user?.user_id}`,
          apiData
        );
        setToast({
          message: `${formData.policy} created successfully`,
          type: "success",
        });
        console.log(response.data);
        ptid = response.data.inserted_id;
      }

      console.log(response, "Policy saved successfully:", response.data);

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
        assigned_to: formData.assigned_to,
        assigned_to_name: getUserNameById(formData.assigned_to),
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
    setFormData({
      ...policy,
      assigned_to: policy.assigned_to,
    });
  };

  const handleDelete = async (id) => {
    console.log("🔍 === DELETE DEBUG START ===");
    console.log("Delete clicked with ID:", id);
    console.log("ID type:", typeof id);
    console.log("ID value:", id);

    if (!id) {
      console.log("❌ ID is invalid:", id);
      console.log("=== DELETE DEBUG END ===");
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
        console.log(response);

        let updatedPolicies;
        if (recycleBin) {
          setDeleted(deleted.filter((p) => p.PT_id !== id));
          updatedPolicies = policies; // Policies remain unchanged for summary counts
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

  const getPriorityClass = (priority) => {
    if (!priority) return "policy-priority-medium";
    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") return "policy-priority-high";
    if (priorityLower === "medium") return "policy-priority-medium";
    if (priorityLower === "low") return "policy-priority-low";
    return "policy-priority-medium";
  };

  // Enhanced status class with different colors for each status
  const getStatusClass = (status) => {
    if (!status) return "policy-status-drafted";
    const statusLower = status.toLowerCase();

    if (statusLower === "completed") return "policy-status-completed";
    if (statusLower === "under implementation")
      return "policy-status-implementation";
    if (statusLower === "approved") return "policy-status-approved";
    if (statusLower === "drafted") return "policy-status-drafted";
    if (statusLower === "pending") return "policy-status-pending";
    if (statusLower === "important") return "policy-status-important";
    if (statusLower === "critical") return "policy-status-critical";

    return "policy-status-drafted";
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
            <div className="policy-form-row">
              <input
                type="number"
                className="policy-input policy-input-small"
                placeholder="Sl No"
                value={formData.sl}
                onChange={(e) =>
                  handleInputChange("sl", parseInt(e.target.value) || "")
                }
              />
              <input
                type="text"
                className="policy-input policy-input-flex"
                placeholder="Policy Name"
                value={formData.policy}
                onChange={(e) => handleInputChange("policy", e.target.value)}
              />
              <input
                type="text"
                className="policy-input policy-input-flex"
                placeholder="Department in Charge"
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
              />
            </div>

            <div className="policy-form-row">
              <input
                type="text"
                className="policy-input policy-input-flex"
                placeholder="Nodal Officer"
                value={formData.officer}
                onChange={(e) => handleInputChange("officer", e.target.value)}
              />
              <select
                className="policy-select policy-input-flex"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                className="policy-select policy-input-flex"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
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

            <div className="policy-form-row">
              <input
                type="date"
                className="policy-input policy-input-flex"
                placeholder="Tentative Deadline"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
              />
              <input
                type="date"
                className="policy-input policy-input-flex"
                placeholder="Last Review Date"
                value={formData.review}
                onChange={(e) => handleInputChange("review", e.target.value)}
              />
              <select
                className="policy-select policy-input-flex"
                value={formData.assigned_to}
                onChange={(e) =>
                  handleInputChange("assigned_to", e.target.value)
                }
              >
                <option value="">Select Assignee</option>
                {allUsers.map((user) => (
                  <option key={user.cs_user_id} value={user.cs_user_id}>
                    {user.cs_user_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="policy-form-row">
              <input
                type="text"
                className="policy-input"
                placeholder="Next Action / Nudge"
                value={formData.nudge}
                onChange={(e) => handleInputChange("nudge", e.target.value)}
              />
            </div>

            <div className="policy-form-row">
              <textarea
                className="policy-textarea"
                rows="3"
                placeholder="Activity Status / Remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
              />
            </div>

            <div className="policy-form-actions">
              <button className="policy-btn" onClick={handleSave}>
                Save
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
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Policy Name</th>
                  <th>Department in Charge</th>
                  <th>Nodal Officer</th>
                  <th>Priority</th>
                  <th>Current Status</th>
                  <th>Tentative Deadline</th>
                  <th>Assigned To</th>
                  <th>Nudge</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                  {!recycleBin && <th>History</th>}
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
                          <td>{policy.sl}</td>
                          <td>{policy.policy}</td>
                          <td>{policy.department}</td>
                          <td>{policy.officer}</td>
                          <td className={getPriorityClass(policy.priority)}>
                            {policy.priority}
                          </td>
                          <td className={getStatusClass(policy.status)}>
                            {policy.status}
                          </td>
                          <td>{formatDateForDisplay(policy.deadline)}</td>
                          <td>{policy.assigned_to_name}</td>
                          <td>{policy.nudge || "-"}</td>
                          <td className="policy-remarks-cell">
                            {policy.remarks ? (
                              <div className="policy-remarks-truncate">
                                {policy.remarks}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="policy-table-button">
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
                              "Not the owner"
                            )}
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
                                  <strong>Tenative Date:</strong>{" "}
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
                        <td>{policy.sl}</td>
                        <td>{policy.policy}</td>
                        <td>{policy.department}</td>
                        <td>{policy.officer}</td>
                        <td className={getPriorityClass(policy.priority)}>
                          {policy.priority}
                        </td>
                        <td className={getStatusClass(policy.status)}>
                          {policy.status}
                        </td>
                        <td>{formatDateForDisplay(policy.deadline)}</td>
                        <td>{policy.assigned_to_name}</td>
                        <td>{policy.nudge || "-"}</td>
                        <td className="policy-remarks-cell">
                          {policy.remarks ? (
                            <div className="policy-remarks-truncate">
                              {policy.remarks}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        {canUserEditPolicy(policy) ? (
                          <td className="policy-table-button">
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
                                console.log("here working???????????????????/");
                                e.stopPropagation();
                                handleDelete(policy.PT_id);
                              }}
                            >
                              <Deleteic />
                            </button>
                          </td>
                        ) : (
                          <td>Not the owner</td>
                        )}
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop propagation here
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
                                <strong>Tenative Date:</strong>{" "}
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
                                <strong>Review Notes:</strong> Last reviewed on{" "}
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
                      <div
                        className={`policy-card-priority ${getPriorityClass(
                          policy.priority
                        )}`}
                      >
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
                        <span
                          className={`policy-card-value ${getStatusClass(
                            policy.status
                          )}`}
                        >
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
                        <span className="policy-card-value">
                          {policy.assigned_to_name}
                        </span>
                      </div>
                      <div className="policy-card-detail-item">
                        <span className="policy-card-label">Nudge:</span>
                        <span className="policy-card-value">
                          {policy.nudge || "-"}
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
                        <span style={{ color: "#6b7280", fontSize: "12px" }}>
                          Not the owner
                        </span>
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
                    <div
                      className={`policy-card-priority ${getPriorityClass(
                        policy.priority
                      )}`}
                    >
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
                      <span
                        className={`policy-card-value ${getStatusClass(
                          policy.status
                        )}`}
                      >
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
                      <span className="policy-card-value">
                        {policy.assigned_to_name}
                      </span>
                    </div>
                    <div className="policy-card-detail-item">
                      <span className="policy-card-label">Nudge:</span>
                      <span className="policy-card-value">
                        {policy.nudge || "-"}
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
                        e.stopPropagation(); // Stop propagation here
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
                        <span style={{ color: "#6b7280", fontSize: "12px" }}>
                          Not the owner
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

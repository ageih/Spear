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
  // Date range filter function - FIXED
  const getDateRangeFilter = (filterText) => {
    if (!filterText) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const filterLower = filterText.toLowerCase().trim();

    if (filterLower.includes("due this week")) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log("📅 Week filter range:", {
        start: startOfWeek,
        end: endOfWeek,
        filter: filterText,
      });

      return { type: "week", start: startOfWeek, end: endOfWeek };
    }

    if (filterLower.includes("due this month")) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      console.log("📅 Month filter range:", {
        start: startOfMonth,
        end: endOfMonth,
        filter: filterText,
      });

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

    // Iterate through all keys in levelUsers object
    Object.keys(valueuser).forEach((key) => {
      // Check if the value is an array (like level1, level2, etc.)
      if (Array.isArray(valueuser[key])) {
        users.push(...valueuser[key]);
      }
    });

    return users;
  }, [valueuser]);

  const getUserNameById = (userId) => {
    const foundUser = allUsers.find((user) => user.cs_user_id === userId);
    return foundUser ? foundUser.cs_user_name : userId || "Unassigned";
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
    assigned_to: "",
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

    // Handle "2025-11-03 00:00:00" format - extract just the date part
    const datePart = dateString.split(" ")[0]; // Gets "2025-11-03"
    const date = new Date(datePart);

    // Validate the date
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return null;
    }

    return date;
  };

  // Format date for display - extracts date part from API format
  const formatDateForDisplay = (apiDate) => {
    if (!apiDate || apiDate === "N/A") return "N/A";
    try {
      // Extract just the date part from "2025-11-03 00:00:00" or "2025-11-03"
      // return apiDate.split(" ")[0];
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
        `${gapi}/LCT?user_id=${userData.user.user_id}&&deleted=false`
      );

      const casedata = response.data.response.map((item, index) => ({
        id: item.id || item.LCT_id,
        user_id: item.user_id,
        LCT_id: item.LCT_id,
        sno: index + 1,
        court: item.court || "",
        priority: item.priority || "Medium",
        submissionDate: item.date_of_submission || "", // Keep full date string
        hearingDate: item.date_of_hearing || "", // Keep full date string
        description: item.description || "",
        department: item.department || "",
        status: item.status || "Under Review",
        activityNotes: item.activity_notes || "",
        assigned_to: item.assigned_to || "",
        assigned_to_name: getUserNameById(item.assigned_to),
        assigned_by: item.assigned_by || "",
        assigned_id: item.assigned_id,
      }));
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
        `${gapi}/LCT?deleted=true&user_id=${userData.user.user_id}&user_fetch=${ft}`
      );

      const casedata = response.data.response.map((item, index) => ({
        id: item.id || item.LCT_id,
        user_id: item.user_id,
        LCT_id: item.LCT_id,
        sno: index + 1,
        court: item.court || "",
        priority: item.priority || "Medium",
        submissionDate: item.date_of_submission || "", // Keep full date string
        hearingDate: item.date_of_hearing || "", // Keep full date string
        description: item.description || "",
        department: item.department || "",
        status: item.status || "Under Review",
        activityNotes: item.activity_notes || "",
        assigned_to: item.assigned_to || "",
        assigned_to_name: getUserNameById(item.assigned_to),
        assigned_by: item.assigned_by || "",
      }));
      setDeleted(casedata);
      return true;
    } catch (err) {
      console.error("Error fetching data:", err);
      return false;
    }
  };

  // Update summary counts function
  // const updateSummaryCounts = (updatedCases) => {
  //   if (!setSummaryInfo) {
  //     console.log("❌ setSummaryInfo not available");
  //     return;
  //   }

  //   // Safety check - don't process empty arrays (initial state)
  //   if (!updatedCases || updatedCases.length === 0) {
  //     console.log("🔄 Skipping summary update - empty or invalid cases data");
  //     return;
  //   }

  //   console.log("📊 Updating summary counts with", updatedCases.length, "cases");

  //   const today = new Date();

  //   // Calculate date ranges
  //   const startOfWeek = new Date(today);
  //   startOfWeek.setDate(today.getDate() - today.getDay());
  //   startOfWeek.setHours(0, 0, 0, 0);

  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6);
  //   endOfWeek.setHours(23, 59, 59, 999);

  //   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  //   startOfMonth.setHours(0, 0, 0, 0);

  //   const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  //   endOfMonth.setHours(23, 59, 59, 999);

  //   // Important count - Cases with "Important" status
  //   const importantCount = updatedCases.filter(
  //     (c) => !c.deleted && c.status && c.status.toLowerCase() === "important"
  //   ).length;

  //   // Critical count - Cases with "Critical" status
  //   const criticalCount = updatedCases.filter(
  //     (c) => !c.deleted && c.status && c.status.toLowerCase() === "critical"
  //   ).length;

  //   // Due This Week count - Cases with hearing date this week AND status is Pending
  //   const dueThisWeekCount = updatedCases.filter((c) => {
  //     if (c.deleted || !c.hearingDate || c.status !== "Pending") return false;

  //     const hearingDate = parseDate(c.hearingDate);
  //     if (!hearingDate) return false;

  //     console.log("🔍 Due This Week Check:", {
  //       case: c.court,
  //       hearingDate: c.hearingDate,
  //       parsedDate: hearingDate,
  //       startOfWeek: startOfWeek,
  //       endOfWeek: endOfWeek,
  //       inRange: hearingDate >= startOfWeek && hearingDate <= endOfWeek,
  //     });

  //     return hearingDate >= startOfWeek && hearingDate <= endOfWeek;
  //   }).length;

  //   // Due This Month count - Cases with hearing date this month AND status is Pending
  //   const dueThisMonthCount = updatedCases.filter((c) => {
  //     if (c.deleted || !c.hearingDate || c.status !== "Pending") return false;

  //     const hearingDate = parseDate(c.hearingDate);
  //     if (!hearingDate) return false;

  //     console.log("🔍 Due This Month Check:", {
  //       case: c.court,
  //       hearingDate: c.hearingDate,
  //       parsedDate: hearingDate,
  //       startOfMonth: startOfMonth,
  //       endOfMonth: endOfMonth,
  //       inRange: hearingDate >= startOfMonth && hearingDate <= endOfMonth,
  //     });
  //     return hearingDate >= startOfMonth && hearingDate <= endOfMonth;
  //   }).length;

  //   // Debug logging to see what's being counted
  //   console.log("📊 Legal Summary counts debug:", {
  //     important: importantCount,
  //     critical: criticalCount,
  //     dueThisWeek: dueThisWeekCount,
  //     dueThisMonth: dueThisMonthCount,
  //     totalCases: updatedCases.length,
  //     pendingCases: updatedCases
  //       .filter((c) => c.status === "Pending")
  //       .map((c) => ({
  //         case: c.court,
  //         status: c.status,
  //         hearingDate: c.hearingDate,
  //       })),
  //   });

  //   setSummaryInfo((prev) => ({
  //     ...prev,
  //     legal: [
  //       { label: "Important", value: importantCount },
  //       { label: "Critical", value: criticalCount },
  //       { label: "Due This Week", value: dueThisWeekCount },
  //       { label: "Due this month", value: dueThisMonthCount },
  //     ],
  //   }));
  // };

  // Update summary counts function - WITH ENHANCED DEBUGGING
  // const updateSummaryCounts = (updatedCases) => {
  //   if (!setSummaryInfo) {
  //     console.log("❌ setSummaryInfo not available");
  //     return;
  //   }

  //   // Safety check - don't process empty arrays (initial state)
  //   if (!updatedCases || updatedCases.length === 0) {
  //     console.log("🔄 Skipping summary update - empty or invalid cases data");
  //     return;
  //   }

  //   console.log(
  //     "📊 Updating summary counts with",
  //     updatedCases.length,
  //     "cases"
  //   );

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   // Calculate date ranges
  //   const startOfWeek = new Date(today);
  //   startOfWeek.setDate(today.getDate() - today.getDay());
  //   startOfWeek.setHours(0, 0, 0, 0);

  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6);
  //   endOfWeek.setHours(23, 59, 59, 999);

  //   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  //   startOfMonth.setHours(0, 0, 0, 0);

  //   const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  //   endOfMonth.setHours(23, 59, 59, 999);

  //   console.log("📅 Date ranges for calculation:", {
  //     today: today,
  //     startOfWeek: startOfWeek,
  //     endOfWeek: endOfWeek,
  //     startOfMonth: startOfMonth,
  //     endOfMonth: endOfMonth,
  //   });

  //   // Important count - Cases with "Important" status
  //   const importantCount = updatedCases.filter(
  //     (c) => !c.deleted && c.status && c.status.toLowerCase() === "important"
  //   ).length;

  //   // Critical count - Cases with "Critical" status
  //   const criticalCount = updatedCases.filter(
  //     (c) => !c.deleted && c.status && c.status.toLowerCase() === "critical"
  //   ).length;

  //   // Due This Week count - Cases with hearing date this week AND status is Pending
  //   const dueThisWeekCount = updatedCases.filter((c) => {
  //     if (c.deleted || !c.hearingDate || c.status !== "Pending") {
  //       if (c.status === "Pending" && c.hearingDate) {
  //         console.log("❌ Due This Week - Failed basic checks:", {
  //           case: c.court,
  //           deleted: c.deleted,
  //           hearingDate: c.hearingDate,
  //           status: c.status,
  //         });
  //       }
  //       return false;
  //     }

  //     const hearingDate = parseDate(c.hearingDate);
  //     if (!hearingDate) {
  //       console.log("❌ Due This Week - Invalid date:", {
  //         case: c.court,
  //         hearingDate: c.hearingDate,
  //       });
  //       return false;
  //     }

  //     const isInRange = hearingDate >= startOfWeek && hearingDate <= endOfWeek;

  //     console.log("🔍 Due This Week Check:", {
  //       case: c.court,
  //       hearingDate: c.hearingDate,
  //       parsedDate: hearingDate,
  //       startOfWeek: startOfWeek,
  //       endOfWeek: endOfWeek,
  //       inRange: isInRange,
  //     });

  //     return isInRange;
  //   }).length;

  //   // Due This Month count - Cases with hearing date this month AND status is Pending
  //   const dueThisMonthCount = updatedCases.filter((c) => {
  //     if (c.deleted || !c.hearingDate || c.status !== "Pending") {
  //       if (c.status === "Pending" && c.hearingDate) {
  //         console.log("❌ Due This Month - Failed basic checks:", {
  //           case: c.court,
  //           deleted: c.deleted,
  //           hearingDate: c.hearingDate,
  //           status: c.status,
  //         });
  //       }
  //       return false;
  //     }

  //     const hearingDate = parseDate(c.hearingDate);
  //     if (!hearingDate) {
  //       console.log("❌ Due This Month - Invalid date:", {
  //         case: c.court,
  //         hearingDate: c.hearingDate,
  //       });
  //       return false;
  //     }

  //     const isInRange =
  //       hearingDate >= startOfMonth && hearingDate <= endOfMonth;

  //     console.log("🔍 Due This Month Check:", {
  //       case: c.court,
  //       hearingDate: c.hearingDate,
  //       parsedDate: hearingDate,
  //       startOfMonth: startOfMonth,
  //       endOfMonth: endOfMonth,
  //       inRange: isInRange,
  //     });

  //     return isInRange;
  //   }).length;

  //   // Debug logging to see what's being counted
  //   const pendingCases = updatedCases.filter(
  //     (c) => c.status === "Pending" && c.hearingDate
  //   );

  //   console.log("📊 Legal Summary FULL DEBUG:", {
  //     important: importantCount,
  //     critical: criticalCount,
  //     dueThisWeek: dueThisWeekCount,
  //     dueThisMonth: dueThisMonthCount,
  //     totalCases: updatedCases.length,
  //     pendingCasesCount: pendingCases.length,
  //     pendingCases: pendingCases.map((c) => ({
  //       case: c.court,
  //       status: c.status,
  //       hearingDate: c.hearingDate,
  //       parsedDate: parseDate(c.hearingDate),
  //       isThisWeek:
  //         parseDate(c.hearingDate) >= startOfWeek &&
  //         parseDate(c.hearingDate) <= endOfWeek,
  //       isThisMonth:
  //         parseDate(c.hearingDate) >= startOfMonth &&
  //         parseDate(c.hearingDate) <= endOfMonth,
  //     })),
  //   });

  //   setSummaryInfo((prev) => ({
  //     ...prev,
  //     legal: [
  //       { label: "Important", value: importantCount },
  //       { label: "Critical", value: criticalCount },
  //       { label: "Due This Week", value: dueThisWeekCount },
  //       { label: "Due this month", value: dueThisMonthCount },
  //     ],
  //   }));
  // };
  // Update the status check to include more statuses
  const isDueStatus = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();

    // Include all statuses that should be considered "due" for legal cases
    return statusLower === "pending";
  };

  // Update summary counts function - FIXED STATUS CHECK
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

    // Calculate date ranges
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

    // Important count - Cases with "Important" status
    const importantCount = updatedCases.filter(
      (c) => !c.deleted && c.status && c.status.toLowerCase() === "important"
    ).length;

    // Critical count - Cases with "Critical" status
    const criticalCount = updatedCases.filter(
      (c) => !c.deleted && c.status && c.status.toLowerCase() === "critical"
    ).length;

    // Due This Week count - Cases with hearing date this week AND status is due status
    const dueThisWeekCount = updatedCases.filter((c) => {
      if (c.deleted || !c.hearingDate || !isDueStatus(c.status)) {
        return false;
      }

      const hearingDate = parseDate(c.hearingDate);
      if (!hearingDate) return false;

      const isInRange = hearingDate >= startOfWeek && hearingDate <= endOfWeek;

      console.log("🔍 Due This Week Check:", {
        case: c.court,
        status: c.status,
        hearingDate: c.hearingDate,
        parsedDate: hearingDate,
        startOfWeek: startOfWeek,
        endOfWeek: endOfWeek,
        inRange: isInRange,
      });

      return isInRange;
    }).length;

    // Due This Month count - Cases with hearing date this month AND status is due status
    const dueThisMonthCount = updatedCases.filter((c) => {
      if (c.deleted || !c.hearingDate || !isDueStatus(c.status)) {
        return false;
      }

      const hearingDate = parseDate(c.hearingDate);
      if (!hearingDate) return false;

      const isInRange =
        hearingDate >= startOfMonth && hearingDate <= endOfMonth;

      console.log("🔍 Due This Month Check:", {
        case: c.court,
        status: c.status,
        hearingDate: c.hearingDate,
        parsedDate: hearingDate,
        startOfMonth: startOfMonth,
        endOfMonth: endOfMonth,
        inRange: isInRange,
      });

      return isInRange;
    }).length;

    // Debug logging
    const dueCases = updatedCases.filter(
      (c) => isDueStatus(c.status) && c.hearingDate
    );

    console.log("📊 Legal Summary FULL DEBUG:", {
      important: importantCount,
      critical: criticalCount,
      dueThisWeek: dueThisWeekCount,
      dueThisMonth: dueThisMonthCount,
      totalCases: updatedCases.length,
      dueCasesCount: dueCases.length,
      dueCases: dueCases.map((c) => ({
        case: c.court,
        status: c.status,
        hearingDate: c.hearingDate,
        parsedDate: parseDate(c.hearingDate),
        isThisWeek:
          parseDate(c.hearingDate) >= startOfWeek &&
          parseDate(c.hearingDate) <= endOfWeek,
        isThisMonth:
          parseDate(c.hearingDate) >= startOfMonth &&
          parseDate(c.hearingDate) <= endOfMonth,
      })),
    });

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

  // Debug effect to check date parsing
  useEffect(() => {
    if (cases.length > 0) {
      console.log("🔍 Date format debug - First case:", {
        hearingDate: cases[0].hearingDate,
        parsedHearingDate: parseDate(cases[0].hearingDate),
        submissionDate: cases[0].submissionDate,
        parsedSubmissionDate: parseDate(cases[0].submissionDate),
      });

      // Check all pending cases with hearing dates
      const pendingCasesWithHearingDates = cases.filter(
        (c) => c.status === "Pending" && c.hearingDate
      );

      console.log(
        "🔍 Pending cases with hearing dates:",
        pendingCasesWithHearingDates.map((c) => ({
          court: c.court,
          status: c.status,
          hearingDate: c.hearingDate,
          parsed: parseDate(c.hearingDate),
        }))
      );
    }
  }, [cases]);

  // ✅ Update summary counts whenever cases change
  useEffect(() => {
    // Only update if we have actual cases data (not initial empty state)
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
        assigned_to: editingCase.assigned_to,
        assigned_to_name: getUserNameById(editingCase.assigned_to),
      }));
    }
  }, [editingCase, allUsers]);

  // Filtered data based on current filter
  // const filteredCases = cases.filter((legalCase) => {
  //   if (!filter || filter.trim() === "") return true;

  //   const dateRangeFilter = getDateRangeFilter(filter);

  //   // Handle special date filters
  //   if (dateRangeFilter) {
  //     const hearingDate = parseDate(legalCase.hearingDate);
  //     const isPending = legalCase.status === "Pending";

  //     if (!isPending) return false;
  //     if (!hearingDate) return false;

  //     return (
  //       hearingDate >= dateRangeFilter.start &&
  //       hearingDate <= dateRangeFilter.end
  //     );
  //   }

  //   // Regular text search
  //   const lowerFilter = filter.toLowerCase();
  //   return (
  //     legalCase.court.toLowerCase().includes(lowerFilter) ||
  //     legalCase.department.toLowerCase().includes(lowerFilter) ||
  //     legalCase.status.toLowerCase().includes(lowerFilter) ||
  //     legalCase.description.toLowerCase().includes(lowerFilter) ||
  //     legalCase.assigned_to_name.toLowerCase().includes(lowerFilter)
  //   );
  // });
  // Filtered data based on current filter - UPDATED
  const filteredCases = cases.filter((legalCase) => {
    if (!filter || filter.trim() === "") return true;

    const dateRangeFilter = getDateRangeFilter(filter);

    // Handle special date filters
    if (dateRangeFilter) {
      const hearingDate = parseDate(legalCase.hearingDate);
      const isDue = isDueStatus(legalCase.status); // Use the same due status logic

      if (!isDue) return false;
      if (!hearingDate) return false;

      return (
        hearingDate >= dateRangeFilter.start &&
        hearingDate <= dateRangeFilter.end
      );
    }

    // Regular text search
    const lowerFilter = filter.toLowerCase();
    return (
      legalCase.court.toLowerCase().includes(lowerFilter) ||
      legalCase.department.toLowerCase().includes(lowerFilter) ||
      legalCase.status.toLowerCase().includes(lowerFilter) ||
      legalCase.description.toLowerCase().includes(lowerFilter) ||
      legalCase.assigned_to_name.toLowerCase().includes(lowerFilter)
    );
  });

  const filteredDeleted = deleted.filter((legalCase) => {
    const lowerFilter = filter.toLowerCase();
    return (
      legalCase.court.toLowerCase().includes(lowerFilter) ||
      legalCase.department.toLowerCase().includes(lowerFilter) ||
      legalCase.status.toLowerCase().includes(lowerFilter) ||
      legalCase.description.toLowerCase().includes(lowerFilter) ||
      legalCase.assigned_to_name.toLowerCase().includes(lowerFilter)
    );
  });

  // Check if current user can edit/delete the case
  const canUserEditCase = (legalCase) => {
    if (!userData?.user?.user_id) return false;

    return (
      userData.user.user_id === legalCase.user_id ||
      userData.user.user_id === legalCase.assigned_to
    );
  };

  // Check if current user is the owner of the case (for permanent delete)
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
      assigned_to: "",
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

    if (!formData.assigned_to) {
      alert("Please assign to a user");
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
        assigned_to: formData.assigned_to,
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
        assigned_to: formData.assigned_to,
        assigned_to_name: getUserNameById(formData.assigned_to),
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
      assigned_to: legalCase.assigned_to,
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
    return "legal-policy-status-default";
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
          <span>{legalCase.assigned_to_name}</span>
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
              {/* </div> */}

              {/* Row 2: Date Fields */}
              {/* <div className="legal-policy-form-row"> */}
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

            {/* Row 3: Department, Status, Assignee */}
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

              <div className="form-field-group">
                <label className="form-label">Assign To</label>
                <select
                  className="legal-policy-input"
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
                          <td>{legalCase.assigned_to_name}</td>
                          <td className={getStatusClass(legalCase.status)}>
                            {legalCase.status}
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
                                  {legalCase.assigned_to_name}
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
                        <td>{legalCase.assigned_to_name}</td>
                        <td className={getStatusClass(legalCase.status)}>
                          {legalCase.status}
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
                        {/* <td>-</td> */}
                      </tr>
                      {expandedRow === legalCase.id && (
                        <tr className="legal-policy-details-row">
                          <td colSpan="10">
                            <div className="legal-policy-details-content">
                              <div>
                                <strong>Assigned To:</strong>{" "}
                                {legalCase.assigned_to_name}
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

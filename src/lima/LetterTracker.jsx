import React, { useState, useEffect, useRef } from "react";
import "./LetterTracker.css";
import axios from "axios";
import { gapi } from "./GlobalAPI";
import { useUserSession } from "../montok/component/useUserSession";
import { useUser } from "../LevelContext";
import { Deleteic, Editic } from "../montok/component/UseIcons";
import Toast from "../montok/component/Toast";

const LetterTracker = ({ filterToPage, setSummaryInfo }) => {
  const contextuser = useUser();
  const valueuser = contextuser?.levelUser;

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // Use the new user session hook
  const {
    userData,
    isLoading: userLoading,
    error: userError,
  } = useUserSession();

  console.log("🚀 LetterTracker userData:", userData, "=================");

  const [letters, setLetters] = useState([]);
  const [deletedLetters, setDeletedLetters] = useState([]);
  const [filter, setFilter] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    assigned_to: [], // Changed to array for multiple users
    document: null, // Add document field
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

  // New state for chat functionality inside edit form
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Create ref for file input
  const fileInputRef = useRef(null);

  // Close toast function
  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

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

  // File handling functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, document: file }));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFormData((prev) => ({ ...prev, document: null }));
    setFileInputKey(Date.now());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      // For blob URLs (local files), use the existing method
      if (fileUrl.startsWith("blob:")) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // For external URLs, use fetch to get the file as blob
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || getFileNameFromUrl(fileUrl) || "document";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Download failed:", error);
      setToast({
        message: `Download failed: ${
          error.message || "Unable to download file"
        }. Opening in new tab instead.`,
        type: "warning",
        show: true,
      });
      // Fallback: open in new tab if download fails
      window.open(fileUrl, "_blank");
    }
  };

  // Helper function to extract filename from URL
  const getFileNameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.substring(pathname.lastIndexOf("/") + 1);
    } catch {
      return "document";
    }
  };

  const viewFile = (fileUrl) => {
    const newWindow = window.open("", "_blank");
    newWindow.location.href = fileUrl;
  };

  // Initialize form with user data when available
  useEffect(() => {
    if (userData?.user?.user_id) {
      setFormData((prev) => ({
        ...prev,
        assigned_by: userData.user.user_id,
        user_id: userData.user.user_id,
        assigned_to: [], // Initialize as empty array
        document: null,
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

  // Fetch chat messages for a letter
  const fetchChatMessages = async (letterId) => {
    try {
      if (!userData?.user?.user_id) return;

      const response = await axios.get(
        `${gapi}/letter-chat?letter_id=${letterId}&user_id=${userData.user.user_id}`
      );

      let messages = [];
      if (Array.isArray(response.data)) {
        messages = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        messages = response.data.data;
      } else if (
        response.data.response &&
        Array.isArray(response.data.response)
      ) {
        messages = response.data.response;
      }

      setChatMessages(messages);
    } catch (error) {
      console.error("❌ Error fetching chat messages:", error);
      setChatMessages([]);
      setToast({
        message: `Error loading chat messages: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
    }
  };

  // Send a new message
  const sendMessage = async () => {
    console.log("✉️ Sending message:", newMessage);
    if (!newMessage.trim()) {
      setToast({
        message: "Please enter a message",
        type: "warning",
        show: true,
      });
      return;
    }

    if (!formData.LT_id || !userData?.user?.user_id) {
      setToast({
        message: "Unable to send message. Missing required data.",
        type: "error",
        show: true,
      });
      return;
    }

    try {
      const messageData = {
        letter_id: formData.LT_id,
        user_id: userData.user.user_id,
        user_name: getUserNameById(userData.user.user_id),
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(`${gapi}/letter-chat`, messageData);

      if (response.data.success) {
        // Add the new message to the chat
        const newMessageObj = {
          ...messageData,
          message_id: response.data.message_id || Date.now(),
        };

        setChatMessages((prev) => [...prev, newMessageObj]);
        setNewMessage("");

        setToast({
          message: "Message sent successfully",
          type: "success",
          show: true,
        });

        // Update the letter's last activity
        setLetters((prev) =>
          prev.map((letter) =>
            letter.LT_id === formData.LT_id
              ? { ...letter, updated_at: new Date().toISOString() }
              : letter
          )
        );
      } else {
        setToast({
          message: `Failed to send message: ${
            response.data.error || "Unknown error"
          }`,
          type: "error",
          show: true,
        });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setToast({
        message: `Error sending message: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
    }
  };

  // Separate function for fetching letters
  const fetchLetters = async () => {
    try {
      if (!userData?.user?.user_id) {
        setToast({
          message: "User not authenticated. Please log in again.",
          type: "error",
          show: true,
        });
        return;
      }

      setLoading(true);
      const apiUrl = `${gapi}/LT?user_id=${userData.user.user_id}&deleted=false&user_level=${userData.user.cs_user_level}`;

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
          // REMOVED: current_stage from display
          created_at: letter.created_at,
          updated_at: letter.updated_at,
          comment: letter.comment,
          user_id: letter.user_id,
          deleted: letter.deleted || false,
          isEdited:
            !!letter.updated_at && letter.updated_at !== letter.created_at,
          document_url: letter.document_url || letter.document || null,
          document_name: letter.document_name || null,
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

      setToast({
        message: `Loaded ${processedLetters.length} letters successfully`,
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("❌ Error fetching letters:", error);
      setToast({
        message: `Error loading letters: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
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
          // REMOVED: current_stage from display
          created_at: letter.created_at,
          updated_at: letter.updated_at,
          user_id: letter.user_id,
          deleted: letter.deleted || false,
          isEdited:
            !!letter.updated_at && letter.updated_at !== letter.created_at,
          document_url: letter.document_url || letter.document || null,
          document_name: letter.document_name || null,
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
      setToast({
        message: `Error loading deleted letters: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
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
      setToast({
        message: "History loaded successfully",
        type: "info",
        show: true,
      });
    } catch (e) {
      console.error("❌ Error fetching history:", e);
      setToast({
        message: `Error loading history: ${
          e.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
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
      setToast({
        message: "User not authenticated. Please log in again.",
        type: "error",
        show: true,
      });
      return;
    }

    // Validate required fields
    const fieldValidations = [
      {
        field: "date_of_dispatch",
        label: "Date of Dispatch",
        value: formData.date_of_dispatch,
      },
      {
        field: "letter_subject",
        label: "Letter Subject",
        value: formData.letter_subject?.trim(),
      },
      {
        field: "letter_number",
        label: "Letter Number",
        value: formData.letter_number?.trim(),
      },
      {
        field: "letter_date",
        label: "Letter Date",
        value: formData.letter_date,
      },
      { field: "status", label: "Status", value: formData.status },
    ];

    for (const validation of fieldValidations) {
      if (!validation.value) {
        setToast({
          message: `Please enter ${validation.label}`,
          type: "warning",
          show: true,
        });
        return;
      }
    }

    // Validate assigned_to
    if (!formData.assigned_to || formData.assigned_to.length === 0) {
      setToast({
        message: "Please assign at least one user",
        type: "warning",
        show: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add file if exists
      if (formData.document) {
        submitData.append("document", formData.document);
      }

      console.log("📄 Submitting form data:", formData);
      if (editIndex !== null) {
        // Compute changes
        const changes = {};
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== previousFormData[key] && key !== "document") {
            changes[key] = {
              old: previousFormData[key] || "",
              new: formData[key] || "",
            };
          }
        });

        // Handle file change in edits
        if (formData.document !== previousFormData.document) {
          changes.document = {
            old: previousFormData.document
              ? previousFormData.document.name
              : "No file",
            new: formData.document ? formData.document.name : "No file",
          };
        }

        const structuredData = {
          date_of_dispatch: formData.date_of_dispatch,
          letter_subject: formData.letter_subject,
          letter_number: formData.letter_number,
          description: formData.description,
          assigned_to: formData.assigned_to,
          letter_date: formData.letter_date,
          status: formData.status,
          assigned_by: userData.user.user_id,
          current_stage: "pending", // ALWAYS submit "pending" as current_stage
          user_id: userData.user.user_id,
          comment: formData.comment || "",
        };

        submitData.append("updates", JSON.stringify(structuredData));
        submitData.append("LT_id", formData.LT_id);
        submitData.append("edit_changes", JSON.stringify(changes));
        submitData.append("edit_comment", formData.comment || "");

        console.log("💾 Updating letter:", structuredData);

        const response = await axios.put(`${gapi}/LT`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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
                  document_url: formData.document
                    ? URL.createObjectURL(formData.document)
                    : formData.document_url,
                  document_name: formData.document
                    ? formData.document.name
                    : formData.document_name,
                }
              : letter
          )
        );

        setToast({
          message: "Letter updated successfully!",
          type: "success",
          show: true,
        });
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
          current_stage: "pending", // ALWAYS submit "pending" as current_stage
          user_id: userData.user.user_id,
        };

        submitData.append("data", JSON.stringify(newLetterData));
        submitData.append("user_id", userData.user.user_id);

        const response = await axios.post(`${gapi}/LT`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("✅ New letter response:", response.data);

        let newLetterId;
        if (response.data.insertedId) {
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
          // Note: current_stage not included in display object
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userData.user.user_id,
          deleted: false,
          isEdited: false,
          document_url: formData.document
            ? URL.createObjectURL(formData.document)
            : null,
          document_name: formData.document ? formData.document.name : null,
        };

        // Add new letter to the top without fetching again
        setLetters((prev) => [mappedNewLetter, ...prev]);
        updateSummaryCounts([mappedNewLetter, ...letters]);

        setToast({
          message: "Letter added successfully!",
          type: "success",
          show: true,
        });
      }

      setFormVisible(false);
      setFormData({ assigned_to: [], document: null });
      setSelectedFile(null);
      setFilePreview(null);
      setFileInputKey(Date.now());
      setEditIndex(null);
      setChatMessages([]);
      setNewMessage("");
    } catch (error) {
      console.error("❌ Error saving letter:", error);
      setToast({
        message: `Error saving letter: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit letter - Only allowed for assigner
  const handleEdit = async (index) => {
    const letter = letters[index];
    const currentUserId = userData?.user?.user_id;

    // Check if current user is the assigner or assigned user
    const assignedTo = Array.isArray(letter.assigned_to)
      ? letter.assigned_to
      : [letter.assigned_to];

    const canAccess =
      currentUserId === letter.assigned_by ||
      assignedTo.includes(currentUserId);

    if (!canAccess) {
      setToast({
        message: "You don't have permission to access this letter.",
        type: "error",
        show: true,
      });
      return;
    }

    console.log("✏️ Editing letter:", letter);
    setFormData({
      ...letter,
      assigned_to: letter.assigned_to || [],
      document: null, // Reset file on edit
    });
    setPreviousFormData(letter);
    setFormVisible(true);
    setEditIndex(index);
    setSelectedFile(null);
    setFilePreview(null);
    setFileInputKey(Date.now());

    // Fetch chat messages when opening edit
    await fetchChatMessages(letter.LT_id);
  };

  // Soft Delete
  const handleDelete = async (LT_id) => {
    console.log("🗑️ Deleting letter with LT_id:", LT_id);
    if (!userData?.user?.user_id) {
      setToast({
        message: "User not authenticated. Please log in again.",
        type: "error",
        show: true,
      });
      return;
    }

    if (!LT_id) {
      setToast({
        message: "Letter ID is invalid!",
        type: "error",
        show: true,
      });
      return;
    }

    const confirmDelete = window.confirm("Move this letter to Bin?");
    if (!confirmDelete) return;

    try {
      console.log("🚨 Proceeding with deletion...");

      const response = await axios.delete(
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

      setToast({
        message: "Letter moved to Bin successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Error while moving letter to Bin:", error);
      setToast({
        message: `Error moving letter to Bin: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (index, letterData) => {
    console.log("🗑️ Permanently deleting letter with LT_id:", letterData.LT_id);
    if (!userData?.user?.user_id) {
      setToast({
        message: "User not authenticated. Please log in again.",
        type: "error",
        show: true,
      });
      return;
    }

    const confirmPermanent = window.confirm(
      "This will permanently delete the letter. Are you sure?"
    );
    if (!confirmPermanent) return;

    try {
      console.log("🚨 Proceeding with permanent deletion...");
      const response = await axios.delete(
        `${gapi}/LT?user_id=${userData.user.user_id}&LT_id=${letterData.LT_id}&permanent=true`
      );

      // Update local state without fetching again
      setDeletedLetters((prev) => prev.filter((_, i) => i !== index));

      setToast({
        message: "Letter permanently deleted successfully!",
        type: "success",
        show: true,
      });
    } catch (error) {
      console.error("Error deleting letter:", error);
      setToast({
        message: `Error deleting letter: ${
          error.response?.data?.errorMessage || "Internal Server Error"
        }`,
        type: "error",
        show: true,
      });
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

  // Check if user can edit details (only assigner)
  const canUserEditDetails = (letter) => {
    if (!letter || !userData?.user?.user_id) return false;
    return userData.user.user_id === letter.assigned_by;
  };

  // Check if user can comment (assigner or assigned users)
  const canUserComment = (letter) => {
    if (!letter || !userData?.user?.user_id) return false;

    const currentUserId = userData.user.user_id;
    const assignedTo = Array.isArray(letter.assigned_to)
      ? letter.assigned_to
      : [letter.assigned_to];

    return (
      currentUserId === letter.assigned_by || assignedTo.includes(currentUserId)
    );
  };

  // Check if user is the creator
  const isUserCreator = (letter) => {
    if (!letter || !userData?.user?.user_id) return false;
    return userData.user.user_id === letter.assigned_by;
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
        (l.status || "").toLowerCase().includes(searchTerm)
        // REMOVED: current_stage from filter
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
      {/* Toast Component */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={closeToast}
        />
      )}

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
          {!showBin && !formVisible && (
            <button
              className="small"
              onClick={(e) => {
                e.stopPropagation();
                setFormVisible(true);
                setFormData({ assigned_to: [], document: null });
                setEditIndex(null);
                setChatMessages([]);
                setNewMessage("");
                setSelectedFile(null);
                setFilePreview(null);
                setFileInputKey(Date.now());
              }}
            >
              Add new
            </button>
          )}
          <button className="small" onClick={() => setShowBin(!showBin)}>
            {showBin ? "Back to Letters" : "Bin"}
          </button>
        </div>

        {/* Enhanced Form with Conditional Layout */}
        {formVisible && !showBin && (
          <div
            className={`formWrap enhanced-form ${
              editIndex === null ? "full-width-form" : "split-form"
            }`}
          >
            <div className="form-header">
              <h3>
                {editIndex !== null
                  ? `📋 ${formData.letter_subject || "Untitled"}`
                  : "➕ Add New Letter"}
                <button
                  className="close-form-btn"
                  onClick={() => {
                    setFormVisible(false);
                    setFormData({ assigned_to: [], document: null });
                    setEditIndex(null);
                    setChatMessages([]);
                    setNewMessage("");
                    setSelectedFile(null);
                    setFilePreview(null);
                    setFileInputKey(Date.now());
                  }}
                  title="Close form"
                >
                  ×
                </button>
              </h3>
            </div>

            <div className="form-layout">
              {/* Letter Details Section - Always visible */}
              <div className="details-section">
                <div className="form-grid">
                  <div className="form-field">
                    <label>
                      Letter Number:<span className="required">*</span>
                    </label>
                    <input
                      placeholder="Enter letter number"
                      value={formData.letter_number || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          letter_number: e.target.value,
                        })
                      }
                      className="form-input"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
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
                        setFormData({
                          ...formData,
                          letter_subject: e.target.value,
                        })
                      }
                      className="form-input"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Date of Dispatch: <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_dispatch || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_dispatch: e.target.value,
                        })
                      }
                      className="form-input"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
                    />
                  </div>

                  {/* REMOVED: Current Stage field from form */}

                  <div className="form-field">
                    <label>
                      Letter Date: <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.letter_date || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          letter_date: e.target.value,
                        })
                      }
                      className="form-input"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
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
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
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
                </div>

                {/* File Upload Section */}
                <div className="form-field full-width">
                  <label>Document:</label>
                  <div className="file-upload-container">
                    {/* Hidden file input */}
                    <input
                      key={fileInputKey}
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept="*/*"
                      className="file-input-hidden"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
                    />

                    {/* Custom file upload button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="file-upload-btn"
                      disabled={
                        editIndex !== null && !canUserEditDetails(formData)
                      }
                    >
                      <span className="file-upload-icon">📎</span>
                      {selectedFile ? "Change File" : "Choose File"}
                    </button>

                    {selectedFile && (
                      <div className="file-preview">
                        <div className="file-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">
                            ({(selectedFile.size / 1024).toFixed(2)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={clearFile}
                            className="clear-file-btn"
                          >
                            ×
                          </button>
                        </div>

                        {filePreview && (
                          <div className="image-preview">
                            <img
                              src={filePreview}
                              alt="Preview"
                              onClick={() => viewFile(filePreview)}
                              className="preview-image"
                            />
                            <span className="preview-text">Click to view</span>
                          </div>
                        )}

                        {!filePreview && (
                          <div className="document-preview">
                            <button
                              type="button"
                              onClick={() => {
                                const url = URL.createObjectURL(selectedFile);
                                viewFile(url);
                              }}
                              className="view-document-btn"
                            >
                              📄 View Document
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show existing document in edit mode */}
                    {editIndex !== null &&
                      formData.document_url &&
                      !selectedFile && (
                        <div className="existing-file">
                          <div className="file-info">
                            <span className="file-name">
                              {formData.document_name || "Existing Document"}
                            </span>
                            <div className="file-actions">
                              <button
                                type="button"
                                onClick={() => viewFile(formData.document_url)}
                                className="view-file-btn"
                              >
                                👁️ View
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadFile(
                                    formData.document_url,
                                    formData.document_name
                                  )
                                }
                                className="download-file-btn"
                              >
                                📥 Download
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Multi-User Assignment */}
                <div className="form-field full-width">
                  <label>
                    Assigned to: <span className="required">*</span>
                  </label>
                  <div className="user-selection-container">
                    <div className="user-selection-grid">
                      {allUsers
                        .filter((user) => {
                          // Get current user ID from userData
                          const currentUserId = userData?.user?.user_id;

                          // Filter out current user (don't show them in selection)
                          if (
                            currentUserId &&
                            user.cs_user_id === currentUserId
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
                            onClick={() => {
                              if (
                                editIndex !== null &&
                                !canUserEditDetails(formData)
                              )
                                return;
                              handleUserSelection(user.cs_user_id);
                            }}
                          >
                            <div className="user-checkbox">
                              {formData.assigned_to?.includes(
                                user.cs_user_id
                              ) && <div className="checkmark">✓</div>}
                            </div>
                            <span className="user-name">
                              {user.cs_user_name}
                            </span>
                          </div>
                        ))}
                    </div>
                    {formData.assigned_to &&
                      formData.assigned_to.length > 0 && (
                        <div className="selected-users">
                          <strong>Selected: </strong>
                          {getAssignedUserNames(formData.assigned_to).join(
                            ", "
                          )}
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
                    disabled={
                      editIndex !== null && !canUserEditDetails(formData)
                    }
                  />
                </div>

                {editIndex !== null && !canUserEditDetails(formData) && (
                  <div className="permission-notice">
                    <span>
                      📋 You can view details but only the assigner can edit
                      them
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Section - Only in Edit Mode */}
              {editIndex !== null && (
                <div className="chat-section">
                  <h4>💬 Discussion ({chatMessages.length})</h4>
                  <div className="chat-container-inline">
                    <div className="chat-messages-inline">
                      {chatMessages.length === 0 ? (
                        <div className="no-messages">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.message_id || message.timestamp}
                            className={`message ${
                              message.user_id === userData.user.user_id
                                ? "own-message"
                                : "other-message"
                            }`}
                          >
                            <div className="message-header">
                              <strong>{message.user_name}</strong>
                              <span className="message-time">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="message-content">
                              {message.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {canUserComment(formData) && (
                      <div className="chat-input-container-inline">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="chat-input-inline"
                          rows="3"
                        />
                        <button
                          onClick={sendMessage}
                          className="send-message-btn-inline"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="formButtons">
              {/* Show Save/Update button only for creator or when adding new */}
              {(editIndex === null || canUserEditDetails(formData)) && (
                <button
                  onClick={handleSave}
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner33"></div>
                      {editIndex !== null ? "Updating..." : "Adding..."}
                    </>
                  ) : editIndex !== null ? (
                    "Update Letter"
                  ) : (
                    "Add Letter"
                  )}
                </button>
              )}
              <button
                className="ghost"
                onClick={() => {
                  setFormVisible(false);
                  setFormData({ assigned_to: [], document: null });
                  setEditIndex(null);
                  setChatMessages([]);
                  setNewMessage("");
                  setSelectedFile(null);
                  setFilePreview(null);
                  setFileInputKey(Date.now());
                }}
                disabled={isSubmitting}
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
                      {/* REMOVED: Current Stage from card view */}
                      {l.document_url && (
                        <div className="card-row">
                          <span className="label">Document:</span>
                          <div className="document-actions-mobile">
                            <button
                              onClick={() => viewFile(l.document_url)}
                              className="view-doc-btn-mobile"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() =>
                                downloadFile(l.document_url, l.document_name)
                              }
                              className="download-doc-btn-mobile"
                            >
                              📥 Download
                            </button>
                          </div>
                        </div>
                      )}
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
                            {/* Show comment icon for assigned users who are not creators */}
                            {!isUserCreator(l) ? (
                              <button
                                className="iconcon comment-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const originalIndex = letters.findIndex(
                                    (letter) => letter.LT_id === l.LT_id
                                  );
                                  handleEdit(originalIndex);
                                }}
                                title="Add Comment"
                              >
                                💬
                              </button>
                            ) : (
                              /* Show edit icon for creator */
                              <button
                                className="iconcon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const originalIndex = letters.findIndex(
                                    (letter) => letter.LT_id === l.LT_id
                                  );
                                  handleEdit(originalIndex);
                                }}
                                title="Edit & Chat"
                              >
                                <Editic />
                              </button>
                            )}
                            {isUserCreator(l) && (
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
                            )}
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
                        {/* REMOVED: Current Stage from expanded details */}
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
                      <th>Document</th>
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
                          <td className="document-cell">
                            {l.document_url ? (
                              <div className="document-actions">
                                <button
                                  onClick={() => viewFile(l.document_url)}
                                  className="view-doc-btn"
                                  title="View Document"
                                >
                                  👁️
                                </button>
                                <button
                                  onClick={() =>
                                    downloadFile(
                                      l.document_url,
                                      l.document_name
                                    )
                                  }
                                  className="download-doc-btn"
                                  title="Download Document"
                                >
                                  📥
                                </button>
                              </div>
                            ) : (
                              <span className="no-document">-</span>
                            )}
                          </td>
                          <td className="actions">
                            {canUserEditLetter(l) ? (
                              <>
                                {/* Show comment icon for assigned users who are not creators */}
                                {!isUserCreator(l) ? (
                                  <button
                                    className="iconcon comment-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const originalIndex = letters.findIndex(
                                        (letter) => letter.LT_id === l.LT_id
                                      );
                                      handleEdit(originalIndex);
                                    }}
                                    title="Add Comment"
                                  >
                                    💬
                                  </button>
                                ) : (
                                  /* Show edit icon for creator */
                                  <button
                                    className="iconcon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const originalIndex = letters.findIndex(
                                        (letter) => letter.LT_id === l.LT_id
                                      );
                                      handleEdit(originalIndex);
                                    }}
                                    title="Edit & Chat"
                                  >
                                    <Editic />
                                  </button>
                                )}
                                {isUserCreator(l) && (
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
                                )}
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
                                : "Never edited"}
                            </button>
                          </td>
                        </tr>

                        {expandedRow === index && (
                          <tr className="expanded-row">
                            <td colSpan="11">
                              <div className="expanded-details">
                                <div className="detail-section">
                                  <strong>Assigned By:</strong>{" "}
                                  {l.assigned_by_name || "-"}
                                </div>
                                {/* REMOVED: Current Stage from expanded details */}
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
                      {l.document_url && (
                        <div className="card-row">
                          <span className="label">Document:</span>
                          <div className="document-actions-mobile">
                            <button
                              onClick={() => viewFile(l.document_url)}
                              className="view-doc-btn-mobile"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() =>
                                downloadFile(l.document_url, l.document_name)
                              }
                              className="download-doc-btn-mobile"
                            >
                              📥 Download
                            </button>
                          </div>
                        </div>
                      )}
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
                      <th>Document</th>
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
                        <td className="document-cell">
                          {l.document_url ? (
                            <div className="document-actions">
                              <button
                                onClick={() => viewFile(l.document_url)}
                                className="view-doc-btn"
                                title="View Document"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() =>
                                  downloadFile(l.document_url, l.document_name)
                                }
                                className="download-doc-btn"
                                title="Download Document"
                              >
                                📥
                              </button>
                            </div>
                          ) : (
                            <span className="no-document">-</span>
                          )}
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

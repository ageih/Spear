import React, { useEffect, useState } from "react";
import axios from "axios";
import { gapi } from "./GlobalAPI.js";

export default function Summary({ activeDetail, currentUser }) {
  const [data, setData] = useState([]);

  // Helper: readable date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Extract user info safely
  const getUserInfo = () => {
    if (!currentUser) return null;

    if (currentUser.cs_user_id !== undefined) {
      return {
        userType: "main",
        userId: currentUser.cs_user_id,
        userName: currentUser.cs_user_name,
      };
    }

    if (currentUser.owner_user_id !== undefined || currentUser.is_staff) {
      return {
        userType: "staff",
        userId: currentUser.owner_user_id || currentUser.id,
        userName: currentUser.staff_username || currentUser.cs_user_name,
      };
    }

    if (currentUser.id !== undefined) {
      return {
        userType: currentUser.is_staff ? "staff" : "main",
        userId: currentUser.id,
        userName: currentUser.cs_user_name || currentUser.staff_username,
      };
    }

    return null;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = getUserInfo();
        if (!userInfo) return;

        let endpoint = "";
        switch (activeDetail) {
          case "communications-summary":
          case "communications-tracker":
            endpoint = "LT";
            break;
          case "meetings-summary":
          case "meetings-tracker":
            endpoint = "meetings";
            break;
          case "policies-summary":
          case "policies-tracker":
            endpoint = "PT";
            break;
          case "legal-summary":
          case "legal-tracker":
            endpoint = "LCT";
            break;
          default:
            return;
        }

        const apiUrl = `${gapi}/${endpoint}?user_id=${userInfo.userId}&user_type=${userInfo.userType}`;
        const response = await axios.get(apiUrl);

        let dataFromAPI = [];
        if (Array.isArray(response.data)) dataFromAPI = response.data;
        else if (
          response.data.response &&
          Array.isArray(response.data.response)
        )
          dataFromAPI = response.data.response;
        else if (response.data.data && Array.isArray(response.data.data))
          dataFromAPI = response.data.data;

        // Map and normalize data

        console.log(dataFromAPI, "kopppp");
        const processedData = dataFromAPI.map((item) => {
          switch (activeDetail) {
            case "communications-summary":
            case "communications-tracker":
              console.log(item, "itemmmm");
              return {
                id: item.LT_id,
                title: item.letter_subject,
                description: item.description,
                status: item.status,
                assign_by: item.assign_by,
                assign_to: item.assign_to,
                letter_number: item.letter_number,
                date_of_dispatch: item.date_of_dispatch,
                letter_date: item.letter_date,
                current_stage: item.current_stage,
                created_at: item.created_at,
                updated_at: item.updated_at,
                comment: item.comment,
                type: "letter",
              };

            case "meetings-summary":
            case "meetings-tracker":
              console.log(item, "meetingngngngngng");

              return {
                id: item.meeting_actions_id,
                title: item.subject,
                description: item.ajenda,
                status: item.status,
                department: item.department,
                date: item.parent_deadline,
                mode: item.mode,
                decisions: item.decisions,
                type: "meeting",
              };

            case "policies-summary":
            case "policies-tracker":
              console.log(item, "policyopispgosid");
              return {
                id: item.PT_id,
                title: item.policy_name,
                description: item.activity_status,
                status: item.current_status,
                department: item.department_in_charge,
                nodal_officer: item.nodal_officer,
                priority: item.priority,
                tentative_deadline: item.tentative_deadline,
                nudge: item.nudge,
                last_review_date: item.last_review_date,
                created_at: item.created_at,
                type: "policy",
              };

            case "legal-summary":
            case "legal-tracker":
              return {
                id: item.LCT_id,
                title: item.description,
                description: item.activity_notes,
                status: item.status,
                priority: item.priority,
                court: item.court,
                date_of_submission: item.date_of_submission,
                date_of_hearing: item.date_of_hearing,
                department: item.department,
                created_at: item.created_at,
                type: "legal",
              };

            default:
              return { id: item.id || Math.random(), type: "unknown" };
          }
        });

        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (currentUser && activeDetail) fetchData();
  }, [currentUser, activeDetail]);

  const titles = {
    "communications-summary": "Letter Tracker Summary",
    "communications-tracker": "Communications Tracker",
    "meetings-summary": "Meetings Summary",
    "meetings-tracker": "Meetings Tracker",
    "policies-summary": "Policies Summary",
    "policies-tracker": "Policies Tracker",
    "legal-summary": "Legal Summary",
    "legal-tracker": "Legal Tracker",
  };

  const formatStatus = (status) => {
    const map = {
      pending: "Pending",
      "in progress": "In Progress",
      completed: "Completed",
      dispatched: "Dispatched",
      open: "Open",
      closed: "Closed",
      scheduled: "Scheduled",
      cancelled: "Cancelled",
      active: "Active",
      expired: "Expired",
      draft: "Draft",
    };
    return map[status?.toLowerCase()] || status || "N/A";
  };

  // Render field details per type
  const renderItemFields = (item) => {
    switch (item.type) {
      case "letter":
        return (
          <>
            <p>
              <b>Status:</b> {formatStatus(item.status)}
            </p>
            <p>
              <b>Assigned By:</b> {item.assign_by || "N/A"}
            </p>
            <p>
              <b>Assigned To:</b> {item.assign_to || "N/A"}
            </p>
            <p>
              <b>Letter No.:</b> {item.letter_number || "N/A"}
            </p>
            <p>
              <b>Letter Date:</b> {formatDateTime(item.letter_date)}
            </p>
            <p>
              <b>Date of Dispatch:</b> {formatDateTime(item.date_of_dispatch)}
            </p>
            <p>
              <b>Current Stage:</b> {item.current_stage || "N/A"}
            </p>
            <p>
              <b>Description:</b>{" "}
              {item.description || "No description available"}
            </p>
            <p>
              <b>Comments:</b> {item.comment || "No comments"}
            </p>
          </>
        );

      case "meeting":
        return (
          <div style={{ fontSize: "13px", color: "#444", lineHeight: "1.6" }}>
            <p>
              <b>Department:</b> {item.department || "N/A"}
            </p>
            <p>
              <b>Date:</b> {formatDateTime(item.date)}
            </p>
            <p>
              <b>Agenda:</b> {item.description || "No agenda available"}
            </p>
          </div>
        );

      case "policy":
        return (
          <>
            <p>
              <b>Policy Name:</b> {item.title}
            </p>
            <p>
              <b>Dept. In-Charge:</b> {item.department || "N/A"}
            </p>
            <p>
              <b>Nodal Officer:</b> {item.nodal_officer || "N/A"}
            </p>
            <p>
              <b>Priority:</b> {item.priority || "N/A"}
            </p>
            <p>
              <b>Current Status:</b> {formatStatus(item.status)}
            </p>
            <p>
              <b>Last Review Date:</b> {formatDateTime(item.last_review_date)}
            </p>
            <p>
              <b>Tentative Deadline:</b>{" "}
              {formatDateTime(item.tentative_deadline)}
            </p>
            <p>
              <b>Nudge:</b> {item.nudge || "N/A"}
            </p>
          </>
        );

      case "legal":
        return (
          <>
            <p>
              <b>Court:</b> {item.court || "N/A"}
            </p>
            <p>
              <b>Status:</b> {formatStatus(item.status)}
            </p>
            <p>
              <b>Priority:</b> {item.priority || "N/A"}
            </p>
            <p>
              <b>Date of Submission:</b>{" "}
              {formatDateTime(item.date_of_submission)}
            </p>
            <p>
              <b>Date of Hearing:</b> {formatDateTime(item.date_of_hearing)}
            </p>
            <p>
              <b>Description:</b> {item.title || "No description available"}
            </p>
          </>
        );

      default:
        return null;
    }
  };

  const userInfo = getUserInfo();

  if (!activeDetail) {
    return (
      <div style={{ textAlign: "center", color: "#777", padding: "30px" }}>
        Select a card to view details...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        padding: "24px 15px",
        // width: "100%",
        margin: "10px 0px",
        // backgroundColor: "red",
      }}
    >
      <h3
        style={{
          borderBottom: "2px solid #1976d2",
          paddingBottom: "8px",
          marginBottom: "16px",
          color: "#1976d2",
          fontWeight: "600",
        }}
      >
        {titles[activeDetail] || "Details"}
      </h3>

      {userInfo && (
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
          👤 {userInfo.userName} ({userInfo.userType}) — ID: {userInfo.userId}
        </p>
      )}

      <div>
        {data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                background: "#fafafa",
                border: "1px solid #eee",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: "0 0 6px", color: "#333" }}>
                {item.title || "Untitled"}
              </h4>
              <div
                style={{ fontSize: "13px", color: "#444", lineHeight: "1.6" }}
              >
                {renderItemFields(item)}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
            No records found for this user.
          </p>
        )}
      </div>

      {data.length > 0 && (
        <p style={{ fontSize: "13px", color: "#666", marginTop: "14px" }}>
          📊 Total records: <b>{data.length}</b>
        </p>
      )}
    </div>
  );
}

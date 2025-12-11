// import React, { useState, useEffect } from "react";
// import LetterTracker from "../../lima/LetterTracker";
// import LegalExpansion from "../../montok/pages/LegalExpansion/LegalExpansion.jsx";
// import Summary from "../../lima/Summary.jsx";
// import PolicyTracker from "../../montok/pages/PolicyTracker/PolicyTracker.jsx";
// import MeetingMode from "../../montok/pages/MeetingMode/MeetingMode.jsx";
// import "../../styles/Dashboard.css";
// import "../../styles/Level1.css";
// import { gapi } from "../../montok/component/GlobalAPI";

// function Level1({ currentUser }) {
//   const [activeDetail, setActiveDetail] = useState(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [summaryInfo, setSummaryInfo] = useState({
//     communications: [],
//     meetings: [],
//     policies: [],
//     legal: [],
//   });
//   const [filterhe, setFilterhe] = useState("");
//   const [activated, setActivated] = useState({});

//   useEffect(() => {
//     console.log(filterhe, "checkingfor filterhe changes");
//   }, [filterhe]);

//   // Detect screen width
//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth <= 768);
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Fetch summary values from backend
//   useEffect(() => {
//     const fetchSummary = async () => {
//       try {
//         const response = await fetch(`${gapi}/dashboard`);
//         const data = await response.json();

//         console.log(data.data, "summaryyydataaa");

//         setSummaryInfo(data.data);
//       } catch (error) {
//         console.error("Error fetching summary info:", error);
//       }
//     };

//     fetchSummary();
//   }, []);

//   // Render tracker/summary view
//   const renderDetail = () => {
//     switch (activeDetail) {
//       case "communications-tracker":
//         return (
//           <LetterTracker
//             filterToPage={filterhe}
//             setSummaryInfo={setSummaryInfo}
//           />
//         );
//       case "legal-tracker":
//         return (
//           <LegalExpansion
//             filterToPage={filterhe}
//             setSummaryInfo={setSummaryInfo}
//           />
//         );
//       case "policies-tracker":
//         return (
//           <PolicyTracker
//             filterToPage={filterhe}
//             setSummaryInfo={setSummaryInfo}
//           />
//         );
//       case "meetings-tracker":
//         return (
//           <MeetingMode
//             filterToPage={filterhe}
//             setSummaryInfo={setSummaryInfo}
//           />
//         );
//       case "communications-summary":
//       case "meetings-summary":
//       case "policies-summary":
//       case "legal-summary":
//         return (
//           <Summary activeDetail={activeDetail} currentUser={currentUser} />
//         );
//       default:
//         return (
//           <div className="placeholder-text">
//             Select a card to view details...
//           </div>
//         );
//     }
//   };

//   // Render each dashboard card
//   const renderCard = (
//     title,
//     summaryKey,
//     trackerKey,
//     summaryType,
//     setFilterhe,
//     setActivated
//   ) => {
//     const isActive = activeDetail === summaryKey || activeDetail === trackerKey;

//     return (
//       <div className={`chart-card ${isActive && isMobile ? "expanded" : ""}`}>
//         {/* Only this header area triggers summary view */}
//         <div
//           className="chart-title-header"
//           onClick={(e) => {
//             e.stopPropagation();
//             setActiveDetail(summaryKey);
//           }}
//         >
//           <div className="chart-heading">{title}</div>
//         </div>

//         {/* The rest of the card content doesn't trigger summary view */}
//         <div className="chart-content">
//           <div className="summary-grid">
//             {summaryInfo[summaryType].map((item, index) => (
//               <div
//                 key={index}
//                 className={`summary-item ${
//                   activated.label === item.label && activated.title === title
//                     ? "activatedclass"
//                     : ""
//                 }`}
//                 data-label={item.label}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (trackerKey) {
//                     setFilterhe(item.label);
//                     setActivated({ label: item.label, title });
//                   }
//                   setActiveDetail(trackerKey);
//                 }}
//               >
//                 <p className="summary-value">{item.value}</p>
//                 <span className="summary-label">{item.label}</span>
//               </div>
//             ))}
//           </div>

//           <button
//             className="tracker-btn"
//             onClick={(e) => {
//               e.stopPropagation();
//               setActivated({});
//               setFilterhe("");
//               setActiveDetail(trackerKey);
//             }}
//           >
//             Open {title === "Communications" ? "Letter" : title} Tracker
//           </button>
//         </div>

//         {isMobile && isActive && (
//           <div className="mobile-summary">
//             <div className="mobile-summary-header">
//               <span className="summary-title">
//                 {activeDetail.includes("tracker")
//                   ? `${title} Tracker`
//                   : `${title} Summary`}
//               </span>
//               <button
//                 className="collapse-btn"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setActiveDetail(null);
//                 }}
//               >
//                 ×
//               </button>
//             </div>
//             {renderDetail()}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="dashboard-container">
//       <div className="executive-dashboard">
//         <div className="dashboard-header executive-header">
//           <div>
//             <h1>Executive Command Center</h1>
//             <p>Welcome, {currentUser.cs_user_name}.</p>
//           </div>
//           <div className="executive-badge">
//             Level {currentUser.cs_user_level} • Executive •{" "}
//             {currentUser.cs_user_department}
//           </div>
//         </div>

//         <div className="dashboard-grid">
//           <h2 className="h2ing">Performance Dashboard</h2>

//           <div className="chart-grid">
//             {renderCard(
//               "Meetings",
//               "meetings-summary",
//               "meetings-tracker",
//               "meetings",
//               setFilterhe,
//               setActivated
//             )}
//             {renderCard(
//               "Policies",
//               "policies-summary",
//               "policies-tracker",
//               "policies",
//               setFilterhe,
//               setActivated
//             )}
//             {renderCard(
//               "Communications",
//               "communications-summary",
//               "communications-tracker",
//               "communications",
//               setFilterhe,
//               setActivated
//             )}
//             {renderCard(
//               "Legal Cases",
//               "legal-summary",
//               "legal-tracker",
//               "legal",
//               setFilterhe,
//               setActivated
//             )}
//           </div>
//         </div>
//         {!isMobile && <div className="detail-view">{renderDetail()}</div>}
//       </div>
//     </div>
//   );
// }

// export default Level1;

// src/pages/Level1.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LetterTracker from "../../lima/LetterTracker";
import LegalExpansion from "../../montok/pages/LegalExpansion/LegalExpansion.jsx";
import Summary from "../../lima/Summary.jsx";
import PolicyTracker from "../../montok/pages/PolicyTracker/PolicyTracker.jsx";
import MeetingMode from "../../montok/pages/MeetingMode/MeetingMode.jsx";
import "../../styles/Dashboard.css";
import "../../styles/Level1.css";
import { gapi } from "../../montok/component/GlobalAPI";

function Level1({ currentUser, userPermissions }) {
  const [activeDetail, setActiveDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [summaryInfo, setSummaryInfo] = useState({
    communications: [],
    meetings: [],
    policies: [],
    legal: [],
  });
  const [filterhe, setFilterhe] = useState("");
  const [activated, setActivated] = useState({});
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const navigate = useNavigate();

  // Check if user has access to Level 1 dashboard
  useEffect(() => {
    const checkAccess = async () => {
      // Debug info
      console.log("🔍 Checking Level 1 access for:", {
        userName: currentUser?.cs_user_name,
        level: currentUser?.cs_user_level,
        isStaff: currentUser?.is_staff,
        permissions: userPermissions,
      });

      // Level 1 users always have access
      if (currentUser?.cs_user_level === 1) {
        console.log("✅ Level 1 user granted access");
        setLoading(false);
        return;
      }

      // Staff with Level 1 permissions
      if (currentUser?.is_staff) {
        // Check userPermissions object
        if (userPermissions) {
          const hasLevel1Access =
            userPermissions.userLevel === 1 ||
            userPermissions.name?.includes("Level 1") ||
            userPermissions.canEdit?.includes("system-settings") ||
            userPermissions.canView?.includes("dashboard");

          if (hasLevel1Access) {
            console.log("✅ Staff granted Level 1 access via permissions");
            setLoading(false);
            return;
          }
        }

        // Check staff permissions directly
        const staffPermissions =
          currentUser.staff_permissions || currentUser.permissions || [];
        const hasAdminAccess =
          staffPermissions.includes("admin_access") ||
          staffPermissions.includes("system_admin") ||
          staffPermissions.includes("manage_letters") ||
          staffPermissions.includes("track_cases");

        if (hasAdminAccess) {
          console.log("✅ Staff granted Level 1 access via staff permissions");
          setLoading(false);
          return;
        }
      }

      // No access
      console.log("❌ Access denied for Level 1");
      setAccessError(
        "You do not have permission to access the Executive Dashboard"
      );
      setLoading(false);
    };

    checkAccess();
  }, [currentUser, userPermissions]);

  // Detect screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (loading || accessError) return;

    const fetchSummary = async () => {
      try {
        const ticketSession = localStorage.getItem("ticketSession");

        if (!ticketSession) {
          console.error("❌ No ticketSession found!");
          navigate("/login");
          return;
        }

        const parsedTicket = JSON.parse(ticketSession);
        const sessionId = parsedTicket.sessionId;

        console.log("📊 Fetching dashboard data with session:", sessionId);

        const response = await fetch(`${gapi}/dashboard`, {
          headers: {
            Authorization: sessionId,
            "Content-Type": "application/json",
          },
        });

        console.log("📊 Response status:", response.status);

        if (response.status === 401) {
          localStorage.removeItem("ticketSession");
          navigate("/login");
          return;
        }

        if (response.status === 403) {
          console.log("🛑 Dashboard access denied for staff");
          // Staff might not have dashboard permission but can still use trackers
          setSummaryInfo({
            communications: [],
            meetings: [],
            policies: [],
            legal: [],
          });
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Dashboard data:", data);

        if (data.success && data.data) {
          setSummaryInfo(data.data);
        } else if (data.data) {
          setSummaryInfo(data.data);
        } else {
          setSummaryInfo(data);
        }
      } catch (error) {
        console.error("❌ Error fetching summary:", error);
        // Even if dashboard fails, staff can still access trackers
        setSummaryInfo({
          communications: [],
          meetings: [],
          policies: [],
          legal: [],
        });
      }
    };

    fetchSummary();
  }, [loading, accessError, navigate]);

  // Render tracker/summary view
  const renderDetail = () => {
    switch (activeDetail) {
      case "communications-tracker":
        return (
          <LetterTracker
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
            currentUser={currentUser}
          />
        );
      case "legal-tracker":
        return (
          <LegalExpansion
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
            currentUser={currentUser}
          />
        );
      case "policies-tracker":
        return (
          <PolicyTracker
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
            currentUser={currentUser}
          />
        );
      case "meetings-tracker":
        return (
          <MeetingMode
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
            currentUser={currentUser}
          />
        );
      case "communications-summary":
      case "meetings-summary":
      case "policies-summary":
      case "legal-summary":
        return (
          <Summary
            activeDetail={activeDetail}
            currentUser={currentUser}
            summaryInfo={summaryInfo}
          />
        );
      default:
        return (
          <div className="placeholder-text">
            <div className="placeholder-icon">📊</div>
            <h3>Executive Command Center</h3>
            <p>Select a card to view detailed information</p>
            <div className="placeholder-tips">
              <p>
                <strong>Tips:</strong>
              </p>
              <ul>
                <li>Click on card headers for summary view</li>
                <li>Click on summary items to filter trackers</li>
                <li>Use "Open Tracker" buttons for full management</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  // Render each dashboard card
  const renderCard = (title, summaryKey, trackerKey, summaryType) => {
    const isActive = activeDetail === summaryKey || activeDetail === trackerKey;
    const cardData = summaryInfo[summaryType] || [];

    return (
      <div className={`chart-card ${isActive && isMobile ? "expanded" : ""}`}>
        {/* Card Header - Click for Summary */}
        <div
          className="chart-title-header"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDetail(summaryKey);
          }}
        >
          <div className="chart-heading">{title}</div>
          {/* <div className="card-stats">
            <span className="total-count">
              {cardData.reduce((sum, item) => sum + (item.value || 0), 0)} Total
            </span>
          </div> */}
        </div>

        {/* Card Content */}
        <div className="chart-content">
          <div className="summary-grid">
            {cardData.length > 0 ? (
              cardData.map((item, index) => (
                <div
                  key={index}
                  className={`summary-item ${
                    activated.label === item.label && activated.title === title
                      ? "activatedclass"
                      : ""
                  }`}
                  data-label={item.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (trackerKey) {
                      setFilterhe(item.label);
                      setActivated({ label: item.label, title });
                    }
                    setActiveDetail(trackerKey);
                  }}
                >
                  <p className="summary-value">{item.value}</p>
                  <span className="summary-label">{item.label}</span>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <p>No data available</p>
                {currentUser?.is_staff && (
                  <small>Staff may need specific permissions</small>
                )}
              </div>
            )}
          </div>

          <button
            className="tracker-btn"
            onClick={(e) => {
              e.stopPropagation();
              setActivated({});
              setFilterhe("");
              setActiveDetail(trackerKey);
            }}
          >
            {title === "Communications"
              ? "Letter Tracker"
              : title === "Legal Cases"
              ? " Case Tracker"
              : title === "Policies"
              ? " Policy Tracker"
              : " Meeting Tracker"}
          </button>
        </div>

        {isMobile && isActive && (
          <div className="mobile-summary">
            <div className="mobile-summary-header">
              <span className="summary-title">
                {activeDetail.includes("tracker")
                  ? `${title} Tracker`
                  : `${title} Summary`}
              </span>
              <button
                className="collapse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDetail(null);
                }}
              >
                ×
              </button>
            </div>
            {renderDetail()}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessError) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <div className="denied-icon">🚫</div>
          <h2>Access Restricted</h2>
          <p>{accessError}</p>
          <div className="user-info-card">
            <h4>Your Account Information:</h4>
            <ul>
              <li>
                <strong>Username:</strong> {currentUser?.cs_user_name || "N/A"}
              </li>
              <li>
                <strong>Level:</strong> {currentUser?.cs_user_level || "N/A"}
              </li>
              <li>
                <strong>Staff Account:</strong>{" "}
                {currentUser?.is_staff ? "Yes" : "No"}
              </li>
              <li>
                <strong>Designation:</strong>{" "}
                {currentUser?.staff_designation || "N/A"}
              </li>
            </ul>
            <div className="action-buttons">
              <button
                className="primary-button"
                onClick={() => navigate("/dashboard")}
              >
                Go to My Dashboard
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate("/staff-tasks")}
              >
                Go to Staff Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="dashboard-container">
      <div className="executive-dashboard">
        {/* Dashboard Header */}
        <div className="dashboard-header executive-header">
          <div className="header-left">
            <h1>Executive Command Center</h1>
            <div className="user-welcome">
              <p>
                Welcome, <strong>{currentUser?.cs_user_name}</strong>
              </p>
              {currentUser?.is_staff && (
                <span className="staff-badge"> Staff Account</span>
              )}
            </div>
          </div>
          <div className="executive-badge">
            {currentUser?.is_staff ? (
              <>
                <span className="badge-icon"></span>
                Staff • {currentUser.staff_designation} • Level 1 Access
              </>
            ) : (
              <>
                <span className="badge-icon"></span>
                Level {currentUser?.cs_user_level} • Executive •{" "}
                {currentUser?.cs_user_department}
              </>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <h2 className="h2ing">Performance Dashboard</h2>

          {/* Info Banner for Staff */}
          {currentUser?.is_staff && (
            <div className="info-banner">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <strong>Staff Access Mode:</strong> You have Level 1 Executive
                permissions. All tracker actions will be logged under your staff
                account.
              </div>
            </div>
          )}

          <div className="chart-grid">
            {renderCard(
              "Meetings",
              "meetings-summary",
              "meetings-tracker",
              "meetings"
            )}
            {renderCard(
              "Policies",
              "policies-summary",
              "policies-tracker",
              "policies"
            )}
            {renderCard(
              "Communications",
              "communications-summary",
              "communications-tracker",
              "communications"
            )}
            {renderCard(
              "Legal Cases",
              "legal-summary",
              "legal-tracker",
              "legal"
            )}
          </div>
        </div>

        {/* Detail View (Desktop only) */}
        {!isMobile && (
          <div className="detail-view">
            <div className="detail-view-header">
              <h3>
                {activeDetail?.includes("tracker")
                  ? "Tracker View"
                  : "Summary View"}
                {activated.label && ` - Filter: ${activated.label}`}
              </h3>
              {activeDetail && (
                <button
                  className="close-detail-btn"
                  onClick={() => {
                    setActiveDetail(null);
                    setActivated({});
                    setFilterhe("");
                  }}
                >
                  Close View
                </button>
              )}
            </div>
            <div className="detail-content">{renderDetail()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Level1;

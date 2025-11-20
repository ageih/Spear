import React, { useState, useEffect } from "react";
import LetterTracker from "../../lima/LetterTracker";
import LegalExpansion from "../../montok/pages/LegalExpansion/LegalExpansion.jsx";
import Summary from "../../lima/Summary.jsx";
import PolicyTracker from "../../montok/pages/PolicyTracker/PolicyTracker.jsx";
import MeetingMode from "../../montok/pages/MeetingMode/MeetingMode.jsx";
import "../../styles/Dashboard.css";
import "../../styles/Level1.css";
import { gapi } from "../../montok/component/GlobalAPI";

function Level1({ currentUser }) {
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

  useEffect(() => {
    console.log(filterhe, "checkingfor filterhe changes");
  }, [filterhe]);

  // Detect screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch summary values from backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${gapi}/dashboard`);
        const data = await response.json();

        console.log(data.data, "summaryyydataaa");

        setSummaryInfo(data.data);
      } catch (error) {
        console.error("Error fetching summary info:", error);
      }
    };

    fetchSummary();
  }, []);

  // Render tracker/summary view
  const renderDetail = () => {
    switch (activeDetail) {
      case "communications-tracker":
        return (
          <LetterTracker
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
          />
        );
      case "legal-tracker":
        return (
          <LegalExpansion
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
          />
        );
      case "policies-tracker":
        return (
          <PolicyTracker
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
          />
        );
      case "meetings-tracker":
        return (
          <MeetingMode
            filterToPage={filterhe}
            setSummaryInfo={setSummaryInfo}
          />
        );
      case "communications-summary":
      case "meetings-summary":
      case "policies-summary":
      case "legal-summary":
        return (
          <Summary activeDetail={activeDetail} currentUser={currentUser} />
        );
      default:
        return (
          <div className="placeholder-text">
            Select a card to view details...
          </div>
        );
    }
  };

  // Render each dashboard card
  const renderCard = (
    title,
    summaryKey,
    trackerKey,
    summaryType,
    setFilterhe,
    setActivated
  ) => {
    const isActive = activeDetail === summaryKey || activeDetail === trackerKey;

    return (
      <div className={`chart-card ${isActive && isMobile ? "expanded" : ""}`}>
        {/* Only this header area triggers summary view */}
        <div
          className="chart-title-header"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDetail(summaryKey);
          }}
        >
          <div className="chart-heading">{title}</div>
        </div>

        {/* The rest of the card content doesn't trigger summary view */}
        <div className="chart-content">
          <div className="summary-grid">
            {summaryInfo[summaryType].map((item, index) => (
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
            ))}
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
            Open {title === "Communications" ? "Letter" : title} Tracker
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

  return (
    <div className="dashboard-container">
      <div className="executive-dashboard">
        <div className="dashboard-header executive-header">
          <div>
            <h1>Executive Command Center</h1>
            <p>Welcome, {currentUser.cs_user_name}.</p>
          </div>
          <div className="executive-badge">
            Level {currentUser.cs_user_level} • Executive •{" "}
            {currentUser.cs_user_department}
          </div>
        </div>

        <div className="dashboard-grid">
          <h2 className="h2ing">Performance Dashboard</h2>

          <div className="chart-grid">
            {renderCard(
              "Meetings",
              "meetings-summary",
              "meetings-tracker",
              "meetings",
              setFilterhe,
              setActivated
            )}
            {renderCard(
              "Policies",
              "policies-summary",
              "policies-tracker",
              "policies",
              setFilterhe,
              setActivated
            )}
            {renderCard(
              "Communications",
              "communications-summary",
              "communications-tracker",
              "communications",
              setFilterhe,
              setActivated
            )}
            {renderCard(
              "Legal Cases",
              "legal-summary",
              "legal-tracker",
              "legal",
              setFilterhe,
              setActivated
            )}
          </div>
        </div>
        {!isMobile && <div className="detail-view">{renderDetail()}</div>}
      </div>
    </div>
  );
}

export default Level1;

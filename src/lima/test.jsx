import React, { useEffect, useState } from "react";
import axios from "axios";
import { gapi } from "../components/GlobalAPI";

export default function summary({ activeDetail }) {
  const [letters, setLetters] = useState([]);

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        console.log("helo in the summary");
        const response = await axios.get(`${gapi}/LT?user_id=a1b1`);
        console.log(response.data.response);
        setLetters(response.data.response || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLetters();
  }, []);

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

  // Only use letters from database
  const activeData =
    activeDetail === "communications-summary" ||
    activeDetail === "communications-tracker"
      ? letters
      : [];

  if (!activeDetail) {
    return (
      <div className="detail-card placeholder">
        Select a card to view details...
      </div>
    );
  }

  return (
    <div className="detail-card">
      <h4>{titles[activeDetail] || "Details"}</h4>
      <ul>
        {activeData.length > 0 ? (
          activeData.map((item, index) => (
            <li key={index}>
              {item.letter_subject} — <b>{item.status}</b>
            </li>
          ))
        ) : (
          <li>No records found</li>
        )}
      </ul>
    </div>
  );
}

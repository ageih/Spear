import React, { useEffect, useState } from "react";
import "./History.css";
import { gapi, user } from "../GlobalAPI";
import axios from "axios";

const History = ({ record_id, setHistoryOpen }) => {
    const filteredKeys = ["id", "temp_deleted", "LT_id", "created_at", "updated_at"];
    const [history, setHistory] = useState([]);

    const fetch = async () => {
        try {
            const response = await axios.get(
                `${gapi}/fetch-history?user_id=${user?.user?.user_id}&record_id=${record_id}`
            );
            console.log("here history", response.data);
            setHistory(response.data.response);
        } catch (error) {
            console.error(error, "nah not good");
        }
    };

    useEffect(() => {
        fetch();
    }, []);

    // ✅ Define helper to safely format values
    const formatValue = (value) => {
        if (value === null || value === undefined) return "-";
        if (typeof value === "object") {
            try {
                return JSON.stringify(value);
            } catch {
                return "[object]";
            }
        }
        return value.toString();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="header">
                    <h2>
                        History
                    </h2>
                    <button className="btn"
                        onClick={(e) => {
                            e.stopPropagation();

                            setHistoryOpen(null)
                        }}
                    >X</button>
                </div>
                {history.length > 0 ? (
                    <div className="history-container">
                        {history
                            .slice()
                            .reverse()
                            .map((update, index) => (
                                <div key={update.update_id || index} className="history-item">
                                    <div className="history-header">
                                        <strong className="history-timestamp">
                                            {new Date(update.updated_at).toLocaleString()}
                                        </strong>
                                        <span className="history-separator">•</span>
                                        Updated by:{" "}
                                        <strong className="history-updater">
                                            {update.updated_by || "System"}
                                        </strong>
                                    </div>

                                    {update.old_data && Object.keys(update.old_data).length > 0 && (
                                        <div className="old-data-section">
                                            <strong className="old-data-title">Previous Data:</strong>
                                            <div className="old-data-content">
                                                {Object.entries(update.old_data)
                                                    .filter(([key]) => !filteredKeys.includes(key))
                                                    .map(([key, value]) => (
                                                        <div key={key} className="old-data-item">
                                                            <b>{key}:</b> {formatValue(value)}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {update.changes && Object.keys(update.changes).length > 0 && (
                                        <div className="changes-section">
                                            <strong className="changes-title">Changes Made:</strong>
                                            <ul className="changes-list">
                                                {Object.entries(update.changes).map(([field, change]) => (
                                                    <li key={field} className="change-item">
                                                        <b>{field}:</b>
                                                        <span className="old-value">
                                                            {" "}
                                                            {formatValue(change?.old)}
                                                        </span>
                                                        <span className="change-arrow">→</span>
                                                        <span className="new-value">
                                                            {formatValue(change?.new)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {(!update.old_data ||
                                        Object.keys(update.old_data).length === 0) &&
                                        (!update.changes ||
                                            Object.keys(update.changes).length === 0) && (
                                            <div className="no-info">
                                                No detailed change information available
                                            </div>
                                        )}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="no-history">No history available for this letter</div>
                )}
            </div>
        </div >
    );
};

export default History;

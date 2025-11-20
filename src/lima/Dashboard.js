// import React, { useState } from "react";
// // import Communications from "./Communications";
// // import Test from "../pages/test";
// import '../pages/Dashboard.css';
// // import MeetingTracker from "./MeetingTracker";
// import LetterTracker from "./LetterTracker";

// export default function Dashboard() {
//     const [activeDetail, setActiveDetail] = useState(null);
//     const renderDetail = () => {
//         switch (activeDetail) {
//             case "communications-summary":
//             case "meetings-summary":
//             case "policies-summary":
//             case "legal-summary":
//                 return <Test activeDetail={activeDetail} />;

//             case "communications-tracker":
//                 return <LetterTracker />;

//             case "meetings-tracker":
//                 return <MeetingTracker />;

//             case "policies-tracker":
//                 return <Communications />;

//             case "legal-tracker":
//                 return <MeetingTracker />;

//             default:
//                 return (
//                     <div className="placeholder-text">
//                         Select a card to view details...
//                     </div>
//                 );
//         }
//     };


//     return (
//         <>
//             <h2 className="h2ing">Performance Dashboard</h2>

//             <div
//             // className="dashboard-container"
//             >
//                 <div className="chart-grid">
//                     <div className="chart-card">
//                         <div className="chart-title">
//                             {/* <div className="chart-heading">Communications</div> */}
//                             <button
//                                 className="tracker-button"
//                                 onClick={() => setActiveDetail("communications-summary")}
//                             >
//                                 Communications
//                             </button>
//                             <button
//                                 className="tracker-btn"
//                                 onClick={() => setActiveDetail("communications-tracker")}
//                             >
//                                 Open Communications Tracker
//                             </button>
//                         </div>
//                     </div>

//                     <div className="chart-card">
//                         <div className="chart-title">
//                             {/* <div className="chart-heading">Meetings</div> */}
//                             <button
//                                 className="tracker-button"
//                                 onClick={() => setActiveDetail("meetings-summary")}
//                             >
//                                 Meetings
//                             </button>
//                             <button
//                                 className="tracker-btn"
//                                 onClick={() => setActiveDetail("meetings-tracker")}
//                             >
//                                 Open Meetings Tracker
//                             </button>
//                         </div>
//                     </div>

//                     <div className="chart-card">
//                         <div className="chart-title">
//                             {/* <div className="chart-heading">Policies</div> */}
//                             <button
//                                 className="tracker-button"
//                                 onClick={() => setActiveDetail("policies-summary")}
//                             >
//                                 Policies
//                             </button>
//                             <button
//                                 className="tracker-btn"
//                                 onClick={() => setActiveDetail("policies-tracker")}
//                             >
//                                 Open Policies Tracker
//                             </button>
//                         </div>
//                     </div>

//                     <div className="chart-card">
//                         <div className="chart-title">
//                             {/* <div className="chart-heading">Legal Cases</div> */}
//                             <button
//                                 className="tracker-button"
//                                 onClick={() => setActiveDetail("legal-summary")}
//                             >
//                                 Legal Cases
//                             </button>
//                             <button
//                                 className="tracker-btn"
//                                 onClick={() => setActiveDetail("legal-tracker")}
//                             >
//                                 Open Legal Tracker
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="chart-heading" style={{ marginTop: 20 }}>
//                 {renderDetail()}
//             </div>

//         </>
//     );
// }

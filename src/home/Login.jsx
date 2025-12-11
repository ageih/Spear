// // src/home/Login.jsx
// import React, { useState } from "react";
// import axios from "axios";
// import gonLogo from "../assets/GON-logo.webp";
// import { gapi } from "../montok/component/GlobalAPI";

// const Login = ({ onLogin }) => {
//   const [govId, setGovId] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [isStaffLogin, setIsStaffLogin] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");

//     console.log(`🔐 ========== LOGIN ATTEMPT ==========`);
//     console.log(`🆔 Government ID: ${govId}`);
//     console.log(`🔑 Password: ${password ? "***" : "MISSING"}`);
//     console.log(`👥 Login Type: ${isStaffLogin ? "Staff" : "Official"}`);
//     console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

//     try {
//       const endpoint = isStaffLogin ? "/staff-login" : "/login";
//       const url = `${gapi}${endpoint}`;

//       console.log(`🌐 Making API call to: ${url}`);

//       const response = await axios.post(url, {
//         govId,
//         password,
//       });

//       console.log(`✅ LOGIN SUCCESSFUL`);
//       console.log(`👤 User:`, response.data.user);
//       console.log(
//         `🎫 Session ID: ${response.data.sessionId ? "Received" : "Missing"}`
//       );
//       console.log(`📊 User Level: ${response.data.user.cs_user_level}`);
//       console.log(`🏢 Department: ${response.data.user.cs_user_department}`);

//       if (response.data.user.is_staff) {
//         console.log(
//           `👥 Staff Designation: ${response.data.user.staff_designation}`
//         );
//         console.log(
//           `🎯 Staff Permissions:`,
//           response.data.user.staff_permissions
//         );
//       }

//       onLogin(response.data.user, response.data.sessionId);
//     } catch (error) {
//       console.error(`❌ LOGIN FAILED`);
//       console.error(`💥 Error Details:`, {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         url: error.config?.url,
//       });

//       if (error.response) {
//         // Server responded with error status
//         console.error(
//           `🚨 Server Error: ${error.response.status} - ${error.response.statusText}`
//         );
//         console.error(`📋 Error Response:`, error.response.data);

//         if (error.response.status === 401) {
//           setError("Invalid Government ID or password. Please try again.");
//         } else if (error.response.status === 400) {
//           setError(
//             error.response.data.error ||
//               "Invalid request. Please check your input."
//           );
//         } else if (error.response.status === 500) {
//           setError("Server error. Please try again later.");
//         } else {
//           setError(
//             `Login failed: ${
//               error.response.data.error || error.response.statusText
//             }`
//           );
//         }
//       } else if (error.request) {
//         // Request was made but no response received
//         console.error(`🌐 Network Error: No response received from server`);
//         console.error(`📡 Request Details:`, error.request);
//         setError(
//           "Cannot connect to server. Please check your internet connection and try again."
//         );
//       } else {
//         // Something else happened
//         console.error(`⚡ Unexpected Error:`, error.message);
//         setError("An unexpected error occurred. Please try again.");
//       }
//     } finally {
//       setIsLoading(false);
//       console.log(`========== LOGIN PROCESS COMPLETE ==========\n`);
//     }
//   };

//   const handleLoginTypeChange = (staffMode) => {
//     console.log(
//       `🔄 Login type changed to: ${staffMode ? "Staff" : "Official"}`
//     );
//     setIsStaffLogin(staffMode);
//     setError(""); // Clear any previous errors
//   };

//   return (
//     <div
//       style={styles.container}
//       styles={{
//         padding: "0px",
//         // background: "red",
//       }}
//     >
//       <div style={styles.loginCard}>
//         {/* Header */}
//         <div style={styles.header}>
//           <div style={styles.logo}>
//             <div style={styles.logoContainer}>
//               <img
//                 src={gonLogo}
//                 alt="SPEAR Nagaland Logo"
//                 style={styles.logoImage}
//                 onError={(e) => {
//                   console.error("❌ Logo failed to load:", e);
//                   e.target.style.display = "none";
//                   const fallback = document.querySelector(".fallback-logo");
//                   if (fallback) fallback.style.display = "block";
//                 }}
//                 onLoad={() => console.log("✅ Logo loaded successfully")}
//               />
//               <div style={styles.fallbackLogo} className="fallback-logo">
//                 <svg
//                   width="32"
//                   height="32"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   xmlns="http://www.w3.org/2000/svg"
//                 >
//                   <path
//                     d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                 </svg>
//               </div>
//             </div>
//             <h1 style={styles.logoText}>SPEAR Nagaland</h1>
//           </div>
//           <p style={styles.subtitle}>
//             State Performance Evaluation and Analytics Repository
//           </p>

//           {/* Login Type Toggle */}
//           <div style={styles.loginTypeToggle}>
//             <button
//               type="button"
//               style={{
//                 ...styles.toggleButton,
//                 ...(isStaffLogin ? {} : styles.toggleButtonActive),
//               }}
//               onClick={() => handleLoginTypeChange(false)}
//             >
//               Official Login
//             </button>
//             <button
//               type="button"
//               style={{
//                 ...styles.toggleButton,
//                 ...(isStaffLogin ? styles.toggleButtonActive : {}),
//               }}
//               onClick={() => handleLoginTypeChange(true)}
//             >
//               Staff Login
//             </button>
//           </div>
//         </div>

//         {/* Login Form */}
//         <form onSubmit={handleSubmit} style={styles.form}>
//           <div style={styles.formGroup}>
//             <label style={styles.label}>Government ID</label>
//             <input
//               type="text"
//               value={govId}
//               onChange={(e) => {
//                 console.log(`📝 Government ID input: ${e.target.value}`);
//                 setGovId(e.target.value);
//               }}
//               placeholder="Enter your Government ID"
//               style={styles.input}
//               required
//               onFocus={() => console.log("🎯 Government ID input focused")}
//               onBlur={() => console.log("📭 Government ID input blurred")}
//             />
//           </div>

//           <div style={styles.formGroup}>
//             <label style={styles.label}>Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => {
//                 console.log(
//                   `📝 Password input: ${e.target.value ? "***" : "EMPTY"}`
//                 );
//                 setPassword(e.target.value);
//               }}
//               placeholder="Enter your password"
//               style={styles.input}
//               required
//               onFocus={() => console.log("🎯 Password input focused")}
//               onBlur={() => console.log("📭 Password input blurred")}
//             />
//           </div>

//           {error && (
//             <div style={styles.errorMessage}>
//               <svg
//                 width="16"
//                 height="16"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//                 style={styles.errorIcon}
//               >
//                 <path
//                   d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                 />
//               </svg>
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             style={
//               isLoading
//                 ? { ...styles.loginButton, ...styles.loginButtonLoading }
//                 : styles.loginButton
//             }
//             disabled={isLoading}
//             onMouseEnter={() =>
//               !isLoading && console.log("🖱️ Login button hover")
//             }
//             onMouseLeave={() =>
//               !isLoading && console.log("🖱️ Login button leave")
//             }
//           >
//             {isLoading ? (
//               <>
//                 <div style={styles.spinner}></div>
//                 {isStaffLogin ? "Staff Sign In..." : "Signing In..."}
//               </>
//             ) : isStaffLogin ? (
//               "Staff Sign In"
//             ) : (
//               "Sign In"
//             )}
//           </button>
//         </form>

//         {/* Login Instructions */}
//         <div style={styles.infoSection}>
//           <p style={styles.infoText}>
//             {isStaffLogin
//               ? "Staff accounts can only access features permitted by their assigned official."
//               : "Use your Government ID and password to access the system."}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     // padding: "20px",
//   },
//   loginCard: {
//     background: "white",
//     borderRadius: "16px",
//     padding: "48px",
//     boxShadow:
//       "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//     width: "100%",
//     maxWidth: "440px",
//   },
//   header: {
//     textAlign: "center",
//     marginBottom: "32px",
//   },
//   logo: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "12px",
//     marginBottom: "8px",
//   },
//   logoContainer: {
//     position: "relative",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     width: "100px",
//     height: "100px",
//   },
//   logoImage: {
//     width: "120px",
//     height: "150px",
//     objectFit: "contain",
//   },
//   fallbackLogo: {
//     display: "none",
//     color: "#667eea",
//   },
//   logoText: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#1a202c",
//     margin: 0,
//     background: "linear-gradient(135deg, #667eea, #764ba2)",
//     backgroundClip: "text",
//     WebkitBackgroundClip: "text",
//     WebkitTextFillColor: "transparent",
//   },
//   subtitle: {
//     fontSize: "14px",
//     color: "#718096",
//     margin: 0,
//   },
//   loginTypeToggle: {
//     display: "flex",
//     background: "#f7fafc",
//     borderRadius: "8px",
//     padding: "4px",
//     marginTop: "16px",
//   },
//   toggleButton: {
//     flex: 1,
//     padding: "8px 16px",
//     border: "none",
//     background: "transparent",
//     borderRadius: "6px",
//     fontSize: "14px",
//     fontWeight: "500",
//     cursor: "pointer",
//     transition: "all 0.2s ease",
//     color: "#7c8cd6ff",
//   },
//   toggleButtonActive: {
//     background: "white",
//     boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
//     color: "#3951beff",
//   },
//   form: {
//     marginBottom: "32px",
//   },
//   formGroup: {
//     marginBottom: "20px",
//   },
//   label: {
//     display: "block",
//     fontSize: "14px",
//     fontWeight: "600",
//     color: "#2d3748",
//     marginBottom: "6px",
//   },
//   input: {
//     width: "100%",
//     padding: "12px 16px",
//     border: "2px solid #e2e8f0",
//     borderRadius: "8px",
//     fontSize: "14px",
//     transition: "all 0.2s ease",
//     outline: "none",
//     boxSizing: "border-box",
//   },
//   errorMessage: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     padding: "12px 16px",
//     backgroundColor: "#fed7d7",
//     border: "1px solid #feb2b2",
//     borderRadius: "8px",
//     color: "#c53030",
//     fontSize: "14px",
//     marginBottom: "16px",
//   },
//   errorIcon: {
//     color: "#c53030",
//   },
//   loginButton: {
//     width: "100%",
//     padding: "14px 20px",
//     background: "linear-gradient(135deg, #667eea, #764ba2)",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "16px",
//     fontWeight: "600",
//     cursor: "pointer",
//     transition: "all 0.2s ease",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "8px",
//   },
//   loginButtonLoading: {
//     opacity: 0.8,
//     cursor: "not-allowed",
//   },
//   spinner: {
//     width: "18px",
//     height: "18px",
//     border: "2px solid transparent",
//     borderTop: "2px solid white",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//   },
//   infoSection: {
//     borderTop: "1px solid #e2e8f0",
//     paddingTop: "24px",
//     textAlign: "center",
//   },
//   infoText: {
//     fontSize: "12px",
//     color: "#718096",
//     margin: 0,
//     lineHeight: "1.4",
//   },
// };

// // Add CSS animation
// const styleSheet = document.styleSheets[0];
// styleSheet.insertRule(
//   `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `,
//   styleSheet.cssRules.length
// );

// // Add hover effects
// styles.input[":focus"] = {
//   borderColor: "#667eea",
//   boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
// };

// styles.loginButton[":hover:not(:disabled)"] = {
//   transform: "translateY(-1px)",
//   boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
// };

// export default Login;

// src/home/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import gonLogo from "../assets/GON-logo.webp";
import { setUser, gapi } from "../montok/component/GlobalAPI";
import "../styles/Login.css";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [loginTypeSelected, setLoginTypeSelected] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Updated formatUsername to match backend expectations
  const formatUsername = (input) => {
    return (
      input
        .trim()
        // Keep spaces, dots, hyphens as backend accepts them
        // Only remove truly problematic characters
        .replace(/[<>]/g, "") // Remove < and > for security
        .substring(0, 30)
    );
  };

  // Validate username matches backend pattern
  const validateUsername = (input) => {
    const pattern = /^[a-zA-Z0-9_. -]+$/;
    return pattern.test(input);
  };

  const handleUsernameChange = (e) => {
    const rawInput = e.target.value;
    setUsername(rawInput);

    // Optional: Show validation error in real-time
    if (rawInput && !validateUsername(rawInput)) {
      // Show error or hint (you can implement this if needed)
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate inputs - MATCH BACKEND VALIDATION
    if (!username.trim()) {
      setError("Username is required");
      setIsLoading(false);
      return;
    }

    // Validate username matches backend pattern
    if (!validateUsername(username)) {
      setError(
        "Username can only contain letters, numbers, spaces, dots, underscores, and hyphens"
      );
      setIsLoading(false);
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setError("Valid phone number is required (10 digits)");
      setIsLoading(false);
      return;
    }

    console.log(`📱 ========== SEND OTP ATTEMPT ==========`);
    console.log(`👤 Username: ${username}`);
    console.log(`👤 Formatted Username: ${formatUsername(username)}`);
    console.log(`📞 Phone Number: ${phoneNumber}`);
    console.log(`👥 Login Type: ${isStaffLogin ? "Staff" : "Official"}`);

    try {
      const formattedUsername = formatUsername(username);
      const payload = {
        username: formattedUsername,
        phoneNumber: phoneNumber.replace(/\D/g, ""),
        loginType: isStaffLogin ? "staff" : "official",
      };

      console.log("📤 Payload to backend:", payload);
      console.log("🌐 Making API call to:", `${gapi}/send-otp`);

      const response = await axios.post(`${gapi}/api/send-otp`, payload);

      console.log("✅ OTP sent successfully:", response.data);
      setOtpSent(true);
      setError("");
    } catch (error) {
      console.error(`❌ OTP SEND FAILED:`, error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details || // Added details from validation
        "Failed to send OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!otp.trim()) {
      setError("OTP is required");
      setIsLoading(false);
      return;
    }

    console.log(`🔐 ========== LOGIN ATTEMPT ==========`);

    try {
      // Use the verify-otp endpoint for proper OTP verification flow
      const url = `${gapi}/api/verify-otp`;

      console.log(`🌐 Making API call to: ${url}`);

      const formattedUsername = formatUsername(username);
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

      const payload = {
        username: formattedUsername,
        phoneNumber: cleanPhoneNumber,
        otp: otp,
        loginType: isStaffLogin ? "staff" : "official",
      };

      console.log("📤 Login payload to backend:", payload);

      const response = await axios.post(url, payload);

      console.log(`✅ LOGIN SUCCESSFUL:`, response.data);
      console.log(`👤 User:`, response.data.user);
      console.log(`🔑 Session ID:`, response.data.sessionId);

      // ✅ STORE THE SESSION ID AND USER DATA
      setUser(response.data.user, response.data.sessionId);

      // Call the onLogin callback
      onLogin(response.data.user, response.data.sessionId);
    } catch (error) {
      console.error(`❌ LOGIN FAILED:`, error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.details || // Added details from validation
        "Invalid OTP or login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginTypeChange = (staffMode) => {
    console.log(
      `🔄 Login type changed to: ${staffMode ? "Staff" : "Official"}`
    );
    setIsStaffLogin(staffMode);
    setLoginTypeSelected(true);
    setError("");
    setUsername("");
    setPhoneNumber("");
    setOtp("");
    setOtpSent(false);
  };

  const handleBackToSelection = () => {
    setLoginTypeSelected(false);
    setIsStaffLogin(false);
    setUsername("");
    setPhoneNumber("");
    setOtp("");
    setOtpSent(false);
    setError("");
  };

  const handleResendOtp = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <div className="logo-container">
              <img
                src={gonLogo}
                alt="SPEAR Nagaland Logo"
                className="logo-image"
                onError={(e) => {
                  console.error("❌ Logo failed to load:", e);
                  e.target.style.display = "none";
                  const fallback = document.querySelector(".fallback-logo");
                  if (fallback) fallback.style.display = "block";
                }}
                onLoad={() => console.log("✅ Logo loaded successfully")}
              />
              <div className="fallback-logo">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="logo-text">SPEAR Nagaland</h1>
          </div>
          <p className="subtitle">
            State Performance Evaluation and Analytics Repository
          </p>

          {/* Login Type Selection */}
          {!loginTypeSelected ? (
            <div className="login-type-selection">
              <h3 className="selection-title">Choose Login Type</h3>
              <div className="selection-buttons">
                <button
                  type="button"
                  className="selection-button"
                  onClick={() => handleLoginTypeChange(false)}
                >
                  <div className="button-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="button-content">
                    <div className="button-title">Official Login</div>
                    <div className="button-description">
                      For government officials
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  className="selection-button"
                  onClick={() => handleLoginTypeChange(true)}
                >
                  <div className="button-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="button-content">
                    <div className="button-title">Staff Login</div>
                    <div className="button-description">
                      For staff accounts with limited permissions
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="login-type-section">
              <div className="login-type-header">
                <button
                  type="button"
                  className="back-button"
                  onClick={handleBackToSelection}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Back
                </button>
                <div className="selected-type-display">
                  <div className="selected-type-icon">
                    {isStaffLogin ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="selected-type-text">
                    <div className="selected-type-title">
                      {isStaffLogin ? "Staff Login" : "Official Login"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Login Form */}
        {loginTypeSelected && (
          <>
            <form
              onSubmit={otpSent ? handleSubmit : handleSendOtp}
              className="login-form"
            >
              <div className="form-group">
                <label className="form-label">
                  Username
                  <span className="input-hint">
                    (letters, numbers, spaces, dots, underscores, hyphens)
                  </span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="e.g., Sharma Kumar"
                  className="form-input"
                  required
                  disabled={otpSent}
                  pattern="[a-zA-Z0-9_. -]+"
                  title="Only letters, numbers, spaces, dots, underscores, and hyphens are allowed"
                />
                {username && (
                  <div className="username-preview">
                    Will be sent as: <strong>{formatUsername(username)}</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setPhoneNumber(value);
                  }}
                  className="form-input"
                  required
                  disabled={otpSent}
                  maxLength={10}
                  minLength={10}
                  title="Please enter a 10-digit phone number"
                />
              </div>

              {otpSent && (
                <div className="form-group">
                  <label className="form-label">OTP</label>
                  <div className="otp-container">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 6-digit OTP"
                      className="form-input otp-input"
                      required
                      maxLength={6}
                      minLength={6}
                      pattern="\d{6}"
                      title="Please enter a 6-digit OTP"
                    />
                    <button
                      type="button"
                      className="resend-otp-button"
                      onClick={handleResendOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                  <div className="otp-instruction">
                    OTP sent to {phoneNumber}
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="error-icon"
                  >
                    <path
                      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`login-button ${
                  isLoading ? "login-button-loading" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    {otpSent ? "Verifying..." : "Sending OTP..."}
                  </>
                ) : otpSent ? (
                  "Verify & Login"
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>

            <div className="info-section">
              <p className="info-text">
                {isStaffLogin
                  ? "Staff accounts can only access features permitted by their assigned official."
                  : "Use your username and phone number to receive OTP for login."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

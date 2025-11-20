// src/home/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import gonLogo from "../assets/GON-logo.webp";
import { gapi } from "../montok/component/GlobalAPI";

const Login = ({ onLogin }) => {
  const [govId, setGovId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStaffLogin, setIsStaffLogin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log(`🔐 ========== LOGIN ATTEMPT ==========`);
    console.log(`🆔 Government ID: ${govId}`);
    console.log(`🔑 Password: ${password ? "***" : "MISSING"}`);
    console.log(`👥 Login Type: ${isStaffLogin ? "Staff" : "Official"}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    try {
      const endpoint = isStaffLogin ? "/staff-login" : "/login";
      const url = `${gapi}${endpoint}`;

      console.log(`🌐 Making API call to: ${url}`);

      const response = await axios.post(url, {
        govId,
        password,
      });

      console.log(`✅ LOGIN SUCCESSFUL`);
      console.log(`👤 User:`, response.data.user);
      console.log(
        `🎫 Session ID: ${response.data.sessionId ? "Received" : "Missing"}`
      );
      console.log(`📊 User Level: ${response.data.user.cs_user_level}`);
      console.log(`🏢 Department: ${response.data.user.cs_user_department}`);

      if (response.data.user.is_staff) {
        console.log(
          `👥 Staff Designation: ${response.data.user.staff_designation}`
        );
        console.log(
          `🎯 Staff Permissions:`,
          response.data.user.staff_permissions
        );
      }

      onLogin(response.data.user, response.data.sessionId);
    } catch (error) {
      console.error(`❌ LOGIN FAILED`);
      console.error(`💥 Error Details:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      });

      if (error.response) {
        // Server responded with error status
        console.error(
          `🚨 Server Error: ${error.response.status} - ${error.response.statusText}`
        );
        console.error(`📋 Error Response:`, error.response.data);

        if (error.response.status === 401) {
          setError("Invalid Government ID or password. Please try again.");
        } else if (error.response.status === 400) {
          setError(
            error.response.data.error ||
              "Invalid request. Please check your input."
          );
        } else if (error.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(
            `Login failed: ${
              error.response.data.error || error.response.statusText
            }`
          );
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error(`🌐 Network Error: No response received from server`);
        console.error(`📡 Request Details:`, error.request);
        setError(
          "Cannot connect to server. Please check your internet connection and try again."
        );
      } else {
        // Something else happened
        console.error(`⚡ Unexpected Error:`, error.message);
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
      console.log(`========== LOGIN PROCESS COMPLETE ==========\n`);
    }
  };

  const handleLoginTypeChange = (staffMode) => {
    console.log(
      `🔄 Login type changed to: ${staffMode ? "Staff" : "Official"}`
    );
    setIsStaffLogin(staffMode);
    setError(""); // Clear any previous errors
  };

  return (
    <div
      style={styles.container}
      styles={{
        padding: "0px",
        // background: "red",
      }}
    >
      <div style={styles.loginCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoContainer}>
              <img
                src={gonLogo}
                alt="SPEAR Nagaland Logo"
                style={styles.logoImage}
                onError={(e) => {
                  console.error("❌ Logo failed to load:", e);
                  e.target.style.display = "none";
                  const fallback = document.querySelector(".fallback-logo");
                  if (fallback) fallback.style.display = "block";
                }}
                onLoad={() => console.log("✅ Logo loaded successfully")}
              />
              <div style={styles.fallbackLogo} className="fallback-logo">
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
            <h1 style={styles.logoText}>SPEAR Nagaland</h1>
          </div>
          <p style={styles.subtitle}>
            State Performance Evaluation and Analytics Repository
          </p>

          {/* Login Type Toggle */}
          <div style={styles.loginTypeToggle}>
            <button
              type="button"
              style={{
                ...styles.toggleButton,
                ...(isStaffLogin ? {} : styles.toggleButtonActive),
              }}
              onClick={() => handleLoginTypeChange(false)}
            >
              Official Login
            </button>
            <button
              type="button"
              style={{
                ...styles.toggleButton,
                ...(isStaffLogin ? styles.toggleButtonActive : {}),
              }}
              onClick={() => handleLoginTypeChange(true)}
            >
              Staff Login
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Government ID</label>
            <input
              type="text"
              value={govId}
              onChange={(e) => {
                console.log(`📝 Government ID input: ${e.target.value}`);
                setGovId(e.target.value);
              }}
              placeholder="Enter your Government ID"
              style={styles.input}
              required
              onFocus={() => console.log("🎯 Government ID input focused")}
              onBlur={() => console.log("📭 Government ID input blurred")}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                console.log(
                  `📝 Password input: ${e.target.value ? "***" : "EMPTY"}`
                );
                setPassword(e.target.value);
              }}
              placeholder="Enter your password"
              style={styles.input}
              required
              onFocus={() => console.log("🎯 Password input focused")}
              onBlur={() => console.log("📭 Password input blurred")}
            />
          </div>

          {error && (
            <div style={styles.errorMessage}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={styles.errorIcon}
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
            style={
              isLoading
                ? { ...styles.loginButton, ...styles.loginButtonLoading }
                : styles.loginButton
            }
            disabled={isLoading}
            onMouseEnter={() =>
              !isLoading && console.log("🖱️ Login button hover")
            }
            onMouseLeave={() =>
              !isLoading && console.log("🖱️ Login button leave")
            }
          >
            {isLoading ? (
              <>
                <div style={styles.spinner}></div>
                {isStaffLogin ? "Staff Sign In..." : "Signing In..."}
              </>
            ) : isStaffLogin ? (
              "Staff Sign In"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Login Instructions */}
        <div style={styles.infoSection}>
          <p style={styles.infoText}>
            {isStaffLogin
              ? "Staff accounts can only access features permitted by their assigned official."
              : "Use your Government ID and password to access the system."}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // padding: "20px",
  },
  loginCard: {
    background: "white",
    borderRadius: "16px",
    padding: "48px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    width: "100%",
    maxWidth: "440px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  logoContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100px",
    height: "100px",
  },
  logoImage: {
    width: "120px",
    height: "150px",
    objectFit: "contain",
  },
  fallbackLogo: {
    display: "none",
    color: "#667eea",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    margin: 0,
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "14px",
    color: "#718096",
    margin: 0,
  },
  loginTypeToggle: {
    display: "flex",
    background: "#f7fafc",
    borderRadius: "8px",
    padding: "4px",
    marginTop: "16px",
  },
  toggleButton: {
    flex: 1,
    padding: "8px 16px",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#7c8cd6ff",
  },
  toggleButtonActive: {
    background: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    color: "#3951beff",
  },
  form: {
    marginBottom: "32px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "all 0.2s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    backgroundColor: "#fed7d7",
    border: "1px solid #feb2b2",
    borderRadius: "8px",
    color: "#c53030",
    fontSize: "14px",
    marginBottom: "16px",
  },
  errorIcon: {
    color: "#c53030",
  },
  loginButton: {
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  loginButtonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid transparent",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  infoSection: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "24px",
    textAlign: "center",
  },
  infoText: {
    fontSize: "12px",
    color: "#718096",
    margin: 0,
    lineHeight: "1.4",
  },
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,
  styleSheet.cssRules.length
);

// Add hover effects
styles.input[":focus"] = {
  borderColor: "#667eea",
  boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
};

styles.loginButton[":hover:not(:disabled)"] = {
  transform: "translateY(-1px)",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
};

export default Login;

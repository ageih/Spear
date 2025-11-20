// component/GlobalAPI.js
export const gapi = "https://webapicab.tech:5901";

// Don't initialize user immediately - make it a function
export const getUser = () => {
    if (typeof window === 'undefined') {
        return null; // Server-side rendering
    }

    try {
        const ticketSession = localStorage.getItem("ticketSession");
        return ticketSession ? JSON.parse(ticketSession) : null;
    } catch (error) {
        console.error("Error reading user from localStorage:", error);
        return null;
    }
};

export const setUser = (userData) => {
    if (typeof window === 'undefined') return;

    try {
        if (userData) {
            localStorage.setItem("ticketSession", JSON.stringify(userData));
        } else {
            localStorage.removeItem("ticketSession");
        }
    } catch (error) {
        console.error("Error saving user to localStorage:", error);
    }
};

// For backward compatibility, you can keep this but it might be null initially
export let user = null;

// Initialize user on client side only
if (typeof window !== 'undefined') {
    try {
        const ticketSession = localStorage.getItem("ticketSession");
        user = ticketSession ? JSON.parse(ticketSession) : null;
    } catch (error) {
        console.error("Error initializing user:", error);
        user = null;
    }
}
// hooks/useUserSession.js
import { useState, useEffect } from 'react';
import { getUser, setUser } from "./GlobalAPI";

export const useUserSession = () => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeUser = () => {
            try {
                setIsLoading(true);
                setError(null);

                const currentUser = getUser();

                if (currentUser?.user?.user_id) {
                    setUserData(currentUser);
                    console.log("User data loaded successfully:", currentUser.user.user_id);
                } else {
                    setError('User not authenticated');
                    console.log("No user found in localStorage");
                }
            } catch (err) {
                console.error('Failed to initialize user:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        // Initialize immediately
        initializeUser();

        // Also listen for storage events (in case user logs in/out in another tab)
        const handleStorageChange = (e) => {
            if (e.key === 'ticketSession') {
                initializeUser();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const updateUser = (newUserData) => {
        setUser(newUserData);
        setUserData(newUserData);
    };

    const clearUser = () => {
        setUser(null);
        setUserData(null);
        setError('User not authenticated');
    };

    return {
        userData,
        isLoading,
        error,
        updateUser,
        clearUser
    };
};
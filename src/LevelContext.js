import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { gapi, user } from "./montok/component/GlobalAPI";

const UserContext = createContext();

export const UserProvider = ({ children, userLevel }) => {
    const [levelUser, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const fetchLevelUsers = async () => {

        try {
            if (!userLevel) {
                return;
            }
            const level = user?.user?.cs_user_level

            console.log('levelllllllll', level, userLevel)
            setLoading(true);
            const fetch = await axios.get(`${gapi}/user-level?user_level=${userLevel}`)
            console.log(fetch.data.data, 'in the main page to get access users')
            setUser(fetch?.data.data);
        } catch (error) {
            console.error('Error during login:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchLevelUsers();
    }, [userLevel]);

    const valueuser = {
        levelUser,
        refetch: () => userLevel && fetchLevelUsers(userLevel)
    };

    return (
        <UserContext.Provider value={valueuser}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use the context
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
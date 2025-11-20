import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({
    message,
    type = 'info',
    duration = 2000,
    onClose,
    position = 'top-right'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show toast with animation
        setIsVisible(true);

        // Auto dismiss
        const timer = setTimeout(() => {
            hideToast();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const hideToast = () => {
        setIsVisible(false);
        // Wait for animation to complete before calling onClose
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    const handleClose = () => {
        hideToast();
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'} toast-${position}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' && '✓'}
                    {type === 'error' && '✕'}
                    {type === 'warning' && '⚠'}
                    {type === 'info' && 'ℹ'}
                </div>
                <span className="toast-message">{message}</span>
                <button className="toast-close" onClick={handleClose}>
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;
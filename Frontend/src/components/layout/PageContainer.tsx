import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Standardized container for data-driven pages.
 * Ensures consistent pt-20 clearance for the fixed navbar 
 * and provides a max-width dashboard layout.
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => {
    return (
        <div className={`pt-20 pb-12 px-8 max-w-7xl mx-auto relative z-10 ${className}`}>
            {children}
        </div>
    );
};

export default PageContainer;

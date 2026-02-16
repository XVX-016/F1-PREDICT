import { motion } from 'framer-motion';

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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`pt-20 pb-12 px-8 max-w-7xl mx-auto relative z-10 ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default PageContainer;

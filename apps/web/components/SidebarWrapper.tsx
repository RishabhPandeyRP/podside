'use client';

import { useSelector, useDispatch } from 'react-redux';
import { SideBarState } from '../lib/sideBarSlice';
import { closeSidebar } from '../lib/sideBarSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { FocusTrap } from 'focus-trap-react';
import ProfileSidebar from './Sidebars/ProfileSidebar';

export default function SidebarWrapper() {
    const dispatch = useDispatch();
    const { isOpen, type, data } = useSelector((state: any) => state.sideBar);


    useEffect(() => {
        if (isOpen) {
            // Save current scroll position (optional)
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scroll position when sidebar closes
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }, [isOpen]);

    const renderContent = () => {
        switch (type) {
            case "profile":
                return <ProfileSidebar email={data?.email} />;
            case "conference":
                return <div><h2 className="text-2xl font-bold mb-4">Conference Details</h2>
                    <p>Conference ID: {data?.conferenceId}</p>
                    {/* Add more conference details here */}
                </div>;
            default:
                return <div><h2 className="text-2xl font-bold mb-4">Sidebar</h2>
                    <p>No content available.</p>
                </div>;
        }
    }
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-10 scroll-none"
                        onClick={() => dispatch(closeSidebar())}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Sidebar Panel */}
                    <FocusTrap
                        active={isOpen}
                        focusTrapOptions={{
                            allowOutsideClick: true,  // <- crucial: lets you click overlay
                            clickOutsideDeactivates: true, // also allows deactivation via click outside
                            escapeDeactivates: true,  // allow Esc key to close
                            fallbackFocus: '#sidebar-close-btn', // fallback node if none found
                        }}
                    >
                        <motion.aside
                            className="fixed top-0 right-0 h-full w-96 bg-[#121212] shadow-2xl z-10 p-4 overflow-y-auto"
                            role='dialog'
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* ✅ always focusable element */}
                            <button
                                id="sidebar-close-btn"
                                tabIndex={0}
                                className="absolute top-4 right-4 text-gray-600 hover:text-black"
                                onClick={() => dispatch(closeSidebar())}
                                aria-label="Close sidebar"
                            >
                                ✕
                            </button>

                            
                            {renderContent()}
                        </motion.aside>
                    </FocusTrap>
                </>
            )}
        </AnimatePresence>
    );
}

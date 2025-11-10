"use client";

import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import NavBar from "../components/NavBar";
import Sidebar from "../components/SidebarWrapper";
import Footer from "../components/Footer";
import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname.startsWith("/conference/");
  const { isOpen } = useSelector((state: any) => state.sideBar);

  return (
    <>
      {!hideNavbar && <NavBar />}

      <motion.div
        className="flex-grow transition-transform relative z-0"
        animate={{ x: isOpen ? "-24rem" : "0rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <ToastContainer position="bottom-center" />
        {children}
        <Footer />
      </motion.div>

      <Sidebar />
    </>
  );
}

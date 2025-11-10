import React from "react";
import { Mail, User, LogOut, Settings } from "lucide-react";

interface ProfileSidebarProps {
  email: string;
}

const ProfileSidebar = ({ email }: ProfileSidebarProps) => {
  const username = email?.split("@")[0] || "User";

  return (
    <div className="flex flex-col h-full text-gray-100 bg-[#121212]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-semibold">
          {username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{username}</h2>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Mail size={14} /> {email}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-800 mb-4"></div>

      {/* Menu */}
      <div className="flex flex-col gap-2 flex-grow">
        <SidebarButton icon={<User size={18} />} label="My Profile" />
        <SidebarButton icon={<Settings size={18} />} label="Settings" />
        <SidebarButton icon={<LogOut size={18} />} label="Log Out" danger />
      </div>

      {/* Footer */}
      <div className="mt-auto text-xs text-gray-500 text-center py-3 border-t border-gray-800">
        © {new Date().getFullYear()} PodSide
      </div>
    </div>
  );
};

export default ProfileSidebar;

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}

const SidebarButton = ({ icon, label, danger }: SidebarButtonProps) => {
  return (
    <button
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

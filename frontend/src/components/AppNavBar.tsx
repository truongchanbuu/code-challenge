import NotificationBell from "@/components/NotificationBell";
import ProfileModal from "./ProfileModal";
import { useState } from "react";
import AppNavbarMenu from "./AppNavBarMenu";
import { useProfile } from "@/hooks/use-profile";

interface Props {
  appName?: string;
  unread?: number;
  avatarUrl?: string;
  userName?: string;
  onBellClick?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

export default function AppNavbar({
  appName = "Online Classroom Management System",
}: Props) {
  const { currentUser } = useProfile();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const onProfile = () => {
    close();
    setIsProfileModalOpen(true);
  };

  return (
    <div className="navbar bg-base-100 border-base-200 border-b">
      <div className="flex-1">
        <a className="btn btn-ghost px-2 text-lg font-semibold" href="/">
          {appName}
        </a>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <AppNavbarMenu
          onOpenProfile={onProfile}
          userName={currentUser?.username}
        />
      </div>

      {isProfileModalOpen && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          open={isProfileModalOpen}
        />
      )}
    </div>
  );
}

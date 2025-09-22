import NotificationBell from "@/components/NotificationBell";
import { storage } from "@/utils/storage";

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
  avatarUrl,
  userName = "Instructor",
  onProfile,
  onSettings,
}: Props) {
  const onLogout = () => {
    storage.clear();
  };

  return (
    <div className="navbar bg-base-100 border-base-200 border-b">
      <div className="flex-1">
        <a className="btn btn-ghost px-2 text-lg font-semibold" href="/">
          {appName}
        </a>
      </div>

      <div className="flex-none gap-2">
        <NotificationBell />

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-9 rounded-full">
              <img
                alt={userName}
                src={
                  avatarUrl ??
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                    userName,
                  )}`
                }
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-52 shadow"
          >
            <li className="menu-title px-4 py-2">{userName}</li>
            <li>
              <a onClick={onProfile}>Profile</a>
            </li>
            <li>
              <a onClick={onSettings}>Settings</a>
            </li>
            <li>
              <a className="text-error" onClick={onLogout}>
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { storage } from "@/utils/storage";

export default function AppNavbarMenu({
  userName = "User",
  avatarUrl,
  onSettings,
  onOpenProfile,
}: {
  userName?: string;
  avatarUrl?: string;
  onSettings?: () => void;
  onOpenProfile: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const nav = useNavigate();

  const closeMenu = () => {
    if (ref.current) ref.current.open = false;
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = ref.current;
      if (el?.open && el && !el.contains(e.target as Node)) {
        el.open = false;
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onLogout = () => {
    storage.clear();
    closeMenu();
    nav("/login", { replace: true });
  };

  return (
    <details ref={ref} className="dropdown dropdown-end">
      <summary
        className="btn btn-ghost btn-circle avatar"
        aria-haspopup="menu"
        aria-expanded={ref.current?.open ? "true" : "false"}
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
      </summary>

      <ul
        role="menu"
        className="menu menu-sm dropdown-content bg-base-100 rounded-box mt-3 w-52 shadow"
        onClick={closeMenu}
      >
        <li className="menu-title px-4 py-2">{userName}</li>
        <li>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onOpenProfile();
            }}
          >
            Profile
          </button>
        </li>
        <li>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onSettings?.();
            }}
          >
            Settings
          </button>
        </li>
        <li>
          <button
            type="button"
            role="menuitem"
            className="text-error"
            onClick={onLogout}
          >
            Logout
          </button>
        </li>
      </ul>
    </details>
  );
}

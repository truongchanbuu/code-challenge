import { createBrowserRouter, Outlet } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import OtpVerificationPage from "@/pages/OtpVerificationPage";
import InstructorDashboard from "@/features/instructors/components/InstructorDashboard";
import StudentDashboard from "@/features/student/components/StudentDashboard";
import { PublicOnly, AuthGuard, RoleGuard } from "./guard";
import NotFoundPage from "@/pages/NotFoundPage";

function PublicOnlyLayout() {
  return (
    <PublicOnly>
      <Outlet />
    </PublicOnly>
  );
}

function AuthedLayout() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyLayout />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/verify/:channel", element: <OtpVerificationPage /> },
    ],
  },

  {
    element: <AuthedLayout />,
    children: [
      {
        path: "/instructor/dashboard",
        element: (
          <RoleGuard allow={["instructor"]}>
            <InstructorDashboard />
          </RoleGuard>
        ),
      },
      {
        path: "/student/dashboard",
        element: (
          <RoleGuard allow={["student"]}>
            <StudentDashboard />
          </RoleGuard>
        ),
      },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);

import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import Home from "@/pages/Home";
import OtpVerificationPage from "@/pages/OtpVerificationPage";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/verify/:channel", element: <OtpVerificationPage /> },
]);

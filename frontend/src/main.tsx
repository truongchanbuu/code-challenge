import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient.ts";
import { IoProvider } from "socket.io-react-hook";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <IoProvider>
        <App />
        <Toaster richColors closeButton position="top-right" />
      </IoProvider>
    </QueryClientProvider>
  </StrictMode>,
);

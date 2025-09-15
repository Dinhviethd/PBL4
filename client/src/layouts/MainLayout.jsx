import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

export default function MainLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 20, background: "#f0f4ff" }}>
        <Outlet />
      </div>
    </div>
  );
}

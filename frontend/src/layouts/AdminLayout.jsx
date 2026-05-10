import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNavbar from "../components/admin/TopNavbar";
import AdminDrawer from "../components/admin/AdminDrawer";
import "../styles/admin.css";

function AdminLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  function toggleDrawer() {
    setIsDrawerOpen((prev) => !prev);
  }

  function closeDrawer() {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  }

  return (
    <div className="admin-layout">
      <TopNavbar onMenuClick={toggleDrawer} />

      <AdminDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main
        className={`admin-main ${isDrawerOpen ? "drawer-open" : ""}`}
        onClick={closeDrawer}
      >
        <div onClick={(event) => event.stopPropagation()}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
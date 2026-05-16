import { useState } from "react";
import { Outlet } from "react-router-dom";
import PetOwnerTopNavbar from "../components/petowner/PetOwnerTopNavbar";
import PetOwnerDrawer from "../components/petowner/PetOwnerDrawer";
import "../styles/admin.css";
import "../styles/petOwner.css";

function PetOwnerLayout() {
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
    <div className="admin-layout petowner-layout">
      <PetOwnerTopNavbar onMenuClick={toggleDrawer} />

      <PetOwnerDrawer
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

export default PetOwnerLayout;

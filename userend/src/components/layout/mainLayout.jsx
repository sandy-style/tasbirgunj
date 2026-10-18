import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../common/Navbar";

export default function MainLayout() {
  const { pathname } = useLocation();
  const hideNavbar = pathname === "/";

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}

      <main>
        <Outlet />
      </main>
    </div>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import ProtectedRoute from "../components/common/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/explore" element={<Home />} />

      <Route element={<ProtectedRoute />}>
        {/* We'll add protected pages here later. */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

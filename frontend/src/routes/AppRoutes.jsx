import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Login from "../pages/Login";
import Register from "../pages/Register";
import DashboardStudent from "../pages/DashboardStudent";
import DashboardAdmin from "../pages/DashboardAdmin";
import Diagnostic from "../pages/Diagnostic";
import Results from "../pages/Results";
import Simulations from "../pages/Simulations";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/student" element={
          <ProtectedRoute>
            <PageTransition><DashboardStudent /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PageTransition><DashboardAdmin /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/diagnostic" element={
          <ProtectedRoute>
            <PageTransition><Diagnostic /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute>
            <PageTransition><Results /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/simulations" element={
          <ProtectedRoute>
            <PageTransition><Simulations /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition><Profile /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default AppRoutes;

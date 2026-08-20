import {
  Navigate,
  useLocation
} from "react-router-dom";
import {
  useAuth
} from "../context/AuthContext";

export default function ProtectedRoute({
  children
}) {
  const location =
    useLocation();

  const {
    authenticated,
    user
  } = useAuth();

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user?.must_change_password === true &&
    location.pathname !== "/change-password"
  ) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }

  if (
    user?.must_change_password === false &&
    location.pathname === "/change-password"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}
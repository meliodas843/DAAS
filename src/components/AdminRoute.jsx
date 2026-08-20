import {
  Navigate
} from "react-router-dom";
import {
  useAuth
} from "../context/AuthContext";

export default function AdminRoute({
  children
}) {
  const {
    user,
    authenticated,
    loading
  } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        Loading...
      </div>
    );
  }

  if (
    !authenticated ||
    !user
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user
      .must_change_password ===
    true
  ) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }

  if (
    user.role !==
    "admin"
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
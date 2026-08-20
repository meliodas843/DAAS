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
    authenticated
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
    user?.role !==
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
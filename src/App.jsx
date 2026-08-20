import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Receivables from "./pages/Receivables";
import Payables from "./pages/Payables";
import RevenueExpense from "./pages/RevenueExpense";
import CashFlow from "./pages/CashFlow";
import Users from "./pages/Users";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Login />
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={
            <Dashboard />
          }
        />

        <Route
          path="/receivables"
          element={
            <Receivables />
          }
        />

        <Route
          path="/payables"
          element={
            <Payables />
          }
        />

        <Route
          path="/revenue-expense"
          element={
            <RevenueExpense />
          }
        />

        <Route
          path="/cash-flow"
          element={
            <CashFlow />
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}
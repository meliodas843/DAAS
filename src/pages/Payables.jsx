import { useEffect, useState } from "react";
import Card from "../components/Card";
import HorizontalBarChart from "../components/HorizontalBarChart";
import ChangeBarChart from "../components/ChangeBarChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import {
  getPayableAccounts,
  getPayableBranches,
  getPayableChanges,
  getPayableMonthly
} from "../api/dashboardApi";

export default function Payables() {
  const [accounts, setAccounts] = useState([]);
  const [changes, setChanges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [monthly, setMonthly] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const filters = {
          date_from: "2026-01-01",
          date_to: "2026-08-31"
        };

        const [
          accountsData,
          changesData,
          branchesData,
          monthlyData
        ] = await Promise.all([
          getPayableAccounts(filters),
          getPayableChanges(filters),
          getPayableBranches(filters),
          getPayableMonthly(filters)
        ]);

        setAccounts(accountsData);
        setChanges(changesData);
        setBranches(branchesData);
        setMonthly(monthlyData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Backend error: {error}</div>;
  }

  return (
    <div className="page-grid page-grid-2">
      <Card title="Өглөгийн дүн дансаар">
        <HorizontalBarChart data={accounts} />
      </Card>

      <Card title="Сарын Өглөгийн Өөрчлөлт">
        <ChangeBarChart data={changes} />
      </Card>

      <Card title="Өглөгийн дүн салбараар">
        <HorizontalBarChart data={branches} green />
      </Card>

      <Card title="Өглөгийн дүн сараар">
        <MonthlyBarChart
          data={monthly}
          color="#afa0f4"
        />
      </Card>
    </div>
  );
}
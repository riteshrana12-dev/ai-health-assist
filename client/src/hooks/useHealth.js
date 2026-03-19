import { useState, useCallback, useEffect } from "react";
import { healthService } from "../services/healthService";
import toast from "react-hot-toast";

export const useHealth = () => {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await healthService.getDashboard();
      setDashboard(data.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load dashboard";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (days = 30) => {
    setIsLoading(true);
    try {
      const { data } = await healthService.getAnalytics(days);
      setAnalytics(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logVitals = useCallback(
    async (vitalsData) => {
      setIsLoading(true);
      try {
        const { data } = await healthService.logVitals(vitalsData);
        toast.success("Vitals logged successfully! 📊");
        await fetchDashboard();
        return { success: true, data: data.data };
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to log vitals";
        toast.error(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchDashboard],
  );

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const { data } = await healthService.getHistory(page);
      setHistory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load history");
    }
  }, []);

  const deleteEntry = useCallback(
    async (id) => {
      try {
        await healthService.deleteEntry(id);
        toast.success("Entry deleted");
        await fetchDashboard();
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || "Delete failed";
        toast.error(msg);
        return { success: false };
      }
    },
    [fetchDashboard],
  );

  return {
    dashboard,
    analytics,
    history,
    isLoading,
    error,
    fetchDashboard,
    fetchAnalytics,
    logVitals,
    fetchHistory,
    deleteEntry,
  };
};

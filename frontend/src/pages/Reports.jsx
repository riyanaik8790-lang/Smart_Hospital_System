import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ChevronDown, Download } from "lucide-react";
import { authFetch } from '../api/authFetch';

const WEEKLY_TREND_DATA = [
  { day: "Mon", admitted: 2, busyDoctors: 2, discharged: 0 },
  { day: "Tue", admitted: 1, busyDoctors: 1, discharged: 0 },
  { day: "Wed", admitted: 3, busyDoctors: 3, discharged: 1 },
  { day: "Thu", admitted: 4, busyDoctors: 4, discharged: 1 },
  { day: "Fri", admitted: 5, busyDoctors: 5, discharged: 2 },
  { day: "Sat", admitted: 4, busyDoctors: 4, discharged: 3 },
  { day: "Sun", admitted: 2, busyDoctors: 2, discharged: 4 }
];

const Reports = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");

  const reportFilename = (extension) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
    return `smart-hospital-performance-report-${timestamp}.${extension}`;
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const chartTitle = (() => {
    if (!dateRange.startDate || !dateRange.endDate) return "Hospital Trends";
    const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      month: "short", day: "2-digit", year: "numeric"
    });
    return `Trends: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  })();

  useEffect(() => {
    authFetch("/api/efficiency")
      .then((res) => res.json())
      .then((res) => {
        setStats(res);
      })
      .catch((err) =>
        console.error("Error loading report:", err)
      );
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadTrends = async () => {
      // Replace this fallback with the API request below once the backend has
      // a date-aware trends endpoint. The selected values are YYYY-MM-DD.
      if (dateRange.startDate && dateRange.endDate) {
        // const params = new URLSearchParams({
        //   startDate: dateRange.startDate,
        //   endDate: dateRange.endDate
        // });
        // const response = await authFetch(`/api/reports/trends?${params}`);
        // if (!response.ok) throw new Error('Unable to load trends.');
        // const trends = await response.json();
        // if (isCurrent) setData(trends); // [{ day, admitted, busyDoctors, discharged }]

        // Mock/filtering fallback while the data source is static.
        if (isCurrent) setData(WEEKLY_TREND_DATA);
        return;
      }

      if (isCurrent) setData(WEEKLY_TREND_DATA);
    };

    loadTrends().catch((error) => console.error("Error loading date-range trends:", error));
    return () => { isCurrent = false; };
  }, [dateRange]);

  const handleExportCSV = () => {
    setExporting("csv");
    setExportError("");
    try {
      const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const rows = [
        ["Smart Hospital Performance Report"],
        ["Generated", new Date().toLocaleString()],
        [],
        ["Performance metric", "Value"],
        ["Bed Occupancy", `${stats.bedOccupancyRate || 0}%`],
        ["Doctor Utilization", `${stats.doctorUtilizationRate || 0}%`],
        ["Treatment Efficiency", `${stats.treatmentEfficiency || 0}%`],
        ["Critical Load", `${stats.criticalLoad || 0}%`],
        [],
        ["Weekly Hospital Trends"],
        ["Day", "Admitted", "Busy Doctors", "Discharged"],
        ...data.map(({ day, admitted, busyDoctors, discharged }) => [day, admitted, busyDoctors, discharged])
      ];
      downloadBlob(
        new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }),
        reportFilename("csv")
      );
    } catch (error) {
      console.error("Performance CSV export error:", error);
      setExportError("Unable to generate the CSV report.");
    } finally {
      setExporting("");
      setIsExportOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    setExportError("");
    try {
      const response = await authFetch("/api/reports/performance/pdf");
      if (!response.ok) {
        const message = response.headers.get("content-type")?.includes("application/json")
          ? (await response.json()).message
          : await response.text();
        throw new Error(message || "Unable to generate the PDF report.");
      }
      downloadBlob(await response.blob(), reportFilename("pdf"));
    } catch (error) {
      console.error("Performance PDF export error:", error);
      setExportError(error.message || "Unable to generate the PDF report.");
    } finally {
      setExporting("");
      setIsExportOpen(false);
    }
  };

  return (
    <div className="reports-page" style={{ padding: "20px" }}>
      {/* HEADER */}
      <div
        className="reports-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px"
        }}
      >
      <h2
        style={{
          fontSize: "24px",
          marginBottom: "20px",
          fontWeight: "700",
          color: "#111827"
        }}
      >
       Smart Hospital Performance Report
      </h2>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "flex-end", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }} aria-label="Report date range">
            <label className="input-group" style={{ margin: 0 }}>
              <span className="help-text">Start date</span>
              <input
                type="date"
                className="form-control"
                value={dateRange.startDate || ""}
                max={dateRange.endDate || undefined}
                onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value || null }))}
              />
            </label>
            <label className="input-group" style={{ margin: 0 }}>
              <span className="help-text">End date</span>
              <input
                type="date"
                className="form-control"
                value={dateRange.endDate || ""}
                min={dateRange.startDate || undefined}
                onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value || null }))}
              />
            </label>
          </div>
        <div className="efficiency-export-menu">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsExportOpen((isOpen) => !isOpen)}
            aria-expanded={isExportOpen}
            aria-haspopup="menu"
            disabled={Boolean(exporting)}
          >
            <Download size={16} />
            Export
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {isExportOpen && (
            <div className="efficiency-export-options" role="menu">
              <button type="button" onClick={handleExportCSV} role="menuitem"><Download size={16} /> {exporting === "csv" ? "Preparing CSV..." : "Export as CSV"}</button>
              <button type="button" onClick={handleExportPDF} role="menuitem"><Download size={16} /> {exporting === "pdf" ? "Preparing PDF..." : "Export as PDF"}</button>
            </div>
          )}
        </div>
        </div>
      </div>

      {exportError && <div className="alert alert-error" role="alert">{exportError}</div>}

      {/* KPI CARDS */}
      <div
        className="reports-stats"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "30px"
        }}
      >
        <Card
          title="Bed Occupancy"
          value={`${stats.bedOccupancyRate || 0}%`}
          color="#6366f1"
        />

        <Card
          title="Doctor Utilization"
          value={`${stats.doctorUtilizationRate || 0}%`}
          color="#22c55e"
        />

        <Card
          title="Treatment Efficiency"
          value={`${stats.treatmentEfficiency || 0}%`}
          color="#f59e0b"
        />

        <Card
          title="Critical Load"
          value={`${stats.criticalLoad || 0}%`}
          color="#ef4444"
        />
      </div>

      {/* TREND CHART */}
      <div
        className="reports-chart"
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          boxShadow:
            "0 4px 14px rgba(0,0,0,0.08)"
        }}
      >
        <h3
          style={{
            marginBottom: "15px",
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827"
          }}
        >
          {chartTitle}
        </h3>

        <ResponsiveContainer
          width="100%"
          height={350}
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Legend />

            {/* ADMITTED */}
            <Line
              type="monotone"
              dataKey="admitted"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />

            {/* DISCHARGED */}
            <Line
              type="monotone"
              dataKey="discharged"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />

            {/* BUSY DOCTORS */}
            <Line
              type="monotone"
              dataKey="busyDoctors"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "18px",
        borderRadius: "12px",
        boxShadow:
          "0 3px 10px rgba(0,0,0,0.06)",
        borderLeft: `6px solid ${color}`
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#6b7280"
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginTop: "8px",
          color: "#111827"
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default Reports;

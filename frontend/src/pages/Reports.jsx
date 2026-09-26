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
import { useLocation } from 'react-router-dom';
import { authFetch } from '../api/authFetch';

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const todayInputValue = () => toDateInputValue(new Date());

const createDailyTrendSeries = (startDate, endDate, metrics) => {
  const valuesByDate = new Map(metrics.map((metric) => [metric.date, metric]));
  const points = [];
  const cursor = parseDateInput(startDate);
  const finalDate = parseDateInput(endDate);

  while (cursor && finalDate && cursor <= finalDate) {
    const date = toDateInputValue(cursor);
    const metric = valuesByDate.get(date) || {};
    points.push({
      date,
      label: cursor.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
      admitted: Number(metric.admitted) || 0,
      discharged: Number(metric.discharged) || 0,
      busyDoctors: Number(metric.busyDoctors) || 0
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
};

const Reports = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [dateRange, setDateRange] = useState(() => {
    const routeRange = location.state?.dateRange;
    const maxDate = todayInputValue();
    if (routeRange?.startDate && routeRange?.endDate && routeRange.startDate <= routeRange.endDate && routeRange.endDate <= maxDate) {
      return { startDate: routeRange.startDate, endDate: routeRange.endDate };
    }
    const endDate = todayInputValue();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return { startDate: toDateInputValue(start), endDate };
  });
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
    const params = new URLSearchParams(dateRange);
    authFetch(`/api/efficiency?${params}`)
      .then((res) => res.json())
      .then((res) => {
        setStats(res);
      })
      .catch((err) =>
        console.error("Error loading report:", err)
      );
  }, [dateRange]);

  useEffect(() => {
    let isCurrent = true;

    const loadTrends = async () => {
      if (dateRange.startDate && dateRange.endDate) {
        const cappedEndDate = dateRange.endDate > todayInputValue()
          ? todayInputValue()
          : dateRange.endDate;
        const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: cappedEndDate });
        const response = await authFetch(`/api/reports/trends?${params}`);
        const trends = await response.json();
        if (!response.ok) throw new Error(trends.message || 'Unable to load trends.');
        if (isCurrent) setData(createDailyTrendSeries(dateRange.startDate, cappedEndDate, trends));
        return;
      }

      if (isCurrent) setData([]);
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
        ["Hospital Trends"],
        ["Date", "Admitted", "Busy Doctors", "Discharged"],
        ...data.map(({ date, admitted, busyDoctors, discharged }) => [date, admitted, busyDoctors, discharged])
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
        <div className="grid grid-cols-3 gap-2 items-end md:flex md:flex-wrap md:justify-end md:gap-3" style={{ marginBottom: "20px" }} aria-label="Report date range and export options">
            <label className="input-group min-w-0" style={{ margin: 0 }}>
              <span className="help-text">Start date</span>
              <input
                type="date"
                className="form-control !min-w-0 !text-xs"
                value={dateRange.startDate || ""}
                max={todayInputValue()}
                onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value || null }))}
              />
            </label>
            <label className="input-group min-w-0" style={{ margin: 0 }}>
              <span className="help-text">End date</span>
              <input
                type="date"
                className="form-control !min-w-0 !text-xs"
                value={dateRange.endDate || ""}
                min={dateRange.startDate || undefined}
                max={todayInputValue()}
                onChange={(event) => setDateRange((current) => {
                  const selectedEndDate = event.target.value || null;
                  return { ...current, endDate: selectedEndDate && selectedEndDate > todayInputValue() ? todayInputValue() : selectedEndDate };
                })}
              />
            </label>
        <div className="efficiency-export-menu">
          <button
            type="button"
            className="btn btn-primary w-full !px-1 !py-2 !text-xs"
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
        className="reports-stats grid grid-cols-2 gap-3 md:grid-cols-4"
        style={{
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

            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={15} />

            <YAxis />

            <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} />

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
      className="p-3"
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow:
          "0 3px 10px rgba(0,0,0,0.06)",
        borderLeft: `6px solid ${color}`
      }}
    >
      <div
        className="text-xs"
        style={{
          color: "#6b7280"
        }}
      >
        {title}
      </div>

      <div
        className="text-lg"
        style={{
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

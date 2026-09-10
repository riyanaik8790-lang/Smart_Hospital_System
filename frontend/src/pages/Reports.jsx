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

const Reports = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch("/api/efficiency")
      .then((res) => res.json())
      .then((res) => {
        setStats(res);

        // CUSTOM WEEKLY TREND DATA
        setData([
          {
            day: "Mon",
            admitted: 2,
            busyDoctors: 2,
            discharged: 0
          },
          {
            day: "Tue",
            admitted: 1,
            busyDoctors: 1,
            discharged: 0
          },
          {
            day: "Wed",
            admitted: 3,
            busyDoctors: 3,
            discharged: 1
          },
          {
            day: "Thu",
            admitted: 4,
            busyDoctors: 4,
            discharged: 1
          },
          {
            day: "Fri",
            admitted: 5,
            busyDoctors: 5,
            discharged: 2
          },
          {
            day: "Sat",
            admitted: 4,
            busyDoctors: 4,
            discharged: 3
          },
          {
            day: "Sun",
            admitted: 2,
            busyDoctors: 2,
            discharged: 4
          }
        ]);
      })
      .catch((err) =>
        console.error("Error loading report:", err)
      );
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {/* HEADER */}
      <h2
        style={{
          fontSize: "24px",
          marginBottom: "20px",
          fontWeight: "700",
          color: "#111827"
        }}
      >
        📊 Smart Hospital Performance Dashboard
      </h2>

      {/* KPI CARDS */}
      <div
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
          📈 Weekly Hospital Trends
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
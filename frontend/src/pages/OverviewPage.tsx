import { useEffect, useState } from "react";

import {
  api,
  ApiError,
  type HealthResponse,
  type OverviewResponse,
} from "../services/api";


// ============================================================
// TYPES
// ============================================================

type HealthState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; data: HealthResponse };

type OverviewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; data: OverviewResponse };


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}


function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}


function formatMonth(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return months[month - 1] ?? "";
}


// ============================================================
// KPI CARD
// ============================================================

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
}


function KpiCard({
  title,
  value,
  description,
}: KpiCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "20px",
        minHeight: "120px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          marginBottom: "10px",
          fontWeight: 500,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "6px",
        }}
      >
        {value}
      </div>

      {description && (
        <div
          style={{
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}


// ============================================================
// OVERVIEW PAGE
// ============================================================

export function OverviewPage() {

  // ----------------------------------------------------------
  // Selected period
  // ----------------------------------------------------------

  const [year] = useState(2026);

  // Your uploaded workbook currently contains:
  // January -> June 2026
  //
  // We start with June because this is the latest month
  // currently available in the database.
  const [month, setMonth] = useState(6);


  // ----------------------------------------------------------
  // Health state
  // ----------------------------------------------------------

  const [healthState, setHealthState] =
    useState<HealthState>({
      status: "loading",
    });


  // ----------------------------------------------------------
  // Overview state
  // ----------------------------------------------------------

  const [overviewState, setOverviewState] =
    useState<OverviewState>({
      status: "loading",
    });


  // ----------------------------------------------------------
  // Load backend health
  // ----------------------------------------------------------

  useEffect(() => {

    let cancelled = false;

    setHealthState({
      status: "loading",
    });

    api
      .getHealth()
      .then((data) => {

        if (cancelled) {
          return;
        }

        setHealthState({
          status: "loaded",
          data,
        });
      })
      .catch((error: unknown) => {

        if (cancelled) {
          return;
        }

        console.error(
          error instanceof ApiError
            ? error.message
            : error,
        );

        setHealthState({
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };

  }, []);


  // ----------------------------------------------------------
  // Load overview metrics
  // ----------------------------------------------------------

  useEffect(() => {

    let cancelled = false;

    setOverviewState({
      status: "loading",
    });

    api
      .getOverview(year, month)
      .then((data) => {

        if (cancelled) {
          return;
        }

        setOverviewState({
          status: "loaded",
          data,
        });
      })
      .catch((error: unknown) => {

        if (cancelled) {
          return;
        }

        console.error(
          error instanceof ApiError
            ? error.message
            : error,
        );

        setOverviewState({
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };

  }, [year, month]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        padding: "24px",
        background: "#f8fafc",
        minHeight: "100%",
      }}
    >

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Executive Overview
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Service Advisor Performance Tracker
          </p>

        </div>


        {/* Period selector */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          <label
            htmlFor="month"
            style={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            Period
          </label>

          <select
            id="month"
            value={month}
            onChange={(event) =>
              setMonth(Number(event.target.value))
            }
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "8px 12px",
              background: "#ffffff",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >

            <option value={1}>January 2026</option>
            <option value={2}>February 2026</option>
            <option value={3}>March 2026</option>
            <option value={4}>April 2026</option>
            <option value={5}>May 2026</option>
            <option value={6}>June 2026</option>

          </select>

        </div>

      </div>


      {/* ======================================================
          BACKEND STATUS
          ====================================================== */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "14px 16px",
          marginBottom: "24px",
        }}
      >

        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "5px",
          }}
        >
          Backend connection status
        </div>


        {healthState.status === "loading" && (
          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Checking API connection...
          </div>
        )}


        {healthState.status === "error" && (
          <div
            style={{
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            Couldn't reach the API. Is the backend running?
          </div>
        )}


        {healthState.status === "loaded" && (
          <div
            style={{
              color: "#059669",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Connected — API status:{" "}
            {healthState.data.status}
            {", "}
            DB connected:{" "}
            {String(
              healthState.data.database_connected,
            )}
          </div>
        )}

      </div>


      {/* ======================================================
          LOADING
          ====================================================== */}

      {overviewState.status === "loading" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "40px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Loading dashboard metrics...
        </div>
      )}


      {/* ======================================================
          ERROR
          ====================================================== */}

      {overviewState.status === "error" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "30px",
            textAlign: "center",
          }}
        >

          <div
            style={{
              color: "#dc2626",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Unable to load dashboard metrics
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Please make sure the FastAPI backend is running.
          </div>

        </div>
      )}


      {/* ======================================================
          DASHBOARD
          ====================================================== */}

      {overviewState.status === "loaded" && (
        <>

          {/* Period title */}

          <div
            style={{
              marginBottom: "14px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#334155",
            }}
          >
            {formatMonth(
              overviewState.data.period.month,
            )}{" "}
            {overviewState.data.period.year}
          </div>


          {/* ==================================================
              KPI GRID
              ================================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >

            <KpiCard
              title="Active Advisors"
              value={formatNumber(
                overviewState.data.active_advisors,
              )}
              description="Service advisors"
            />


            <KpiCard
              title="Total GUS"
              value={formatNumber(
                overviewState.data.total_gus,
              )}
              description="General service vehicles"
            />


            <KpiCard
              title="Total PM"
              value={formatNumber(
                overviewState.data.total_pm,
              )}
              description="Preventive maintenance"
            />


            <KpiCard
              title="PM Conversion"
              value={`${overviewState.data.pm_conversion_pct.toFixed(2)}%`}
              description="PM / GUS"
            />


            <KpiCard
              title="VAS Revenue"
              value={formatCurrency(
                overviewState.data.total_vas_revenue,
              )}
              description="VAS value"
            />


            <KpiCard
              title="NPS"
              value={overviewState.data.nps.toFixed(2)}
              description={`Sample: ${formatNumber(
                overviewState.data.nps_sample,
              )}`}
            />

          </div>


          {/* ==================================================
              CUSTOMER EXPERIENCE
              ================================================== */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >

            <KpiCard
              title="NPS Promoters"
              value={formatNumber(
                overviewState.data.nps_promoters,
              )}
            />


            <KpiCard
              title="NPS Neutral"
              value={formatNumber(
                overviewState.data.nps_neutral,
              )}
            />


            <KpiCard
              title="NPS Detractors"
              value={formatNumber(
                overviewState.data.nps_detractors,
              )}
            />


            <KpiCard
              title="IVOC Responses"
              value={formatNumber(
                overviewState.data.ivoc_responses,
              )}
              description="VOC response volume"
            />

          </div>


          {/* ==================================================
              DATA SOURCE INFORMATION
              ================================================== */}

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "18px",
            }}
          >

            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Data source
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              These dashboard values are retrieved from the
              Service Advisor Performance Tracker database
              through the FastAPI metrics API.
            </div>

          </div>

        </>
      )}

    </div>
  );
}
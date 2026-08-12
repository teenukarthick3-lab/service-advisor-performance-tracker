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
  accent?: "red" | "dark" | "green";
}

function KpiCard({
  title,
  value,
  description,
  accent = "red",
}: KpiCardProps) {
  const accentColor =
    accent === "green"
      ? "#059669"
      : accent === "dark"
        ? "#111827"
        : "#eb0a1e";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "24px",
        minHeight: "145px",
        boxShadow: "0 5px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "5px",
          background: accentColor,
        }}
      />

      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          marginBottom: "12px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "32px",
          lineHeight: 1.15,
          fontWeight: 900,
          color: "#111827",
          marginBottom: "8px",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>

      {description && (
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            fontWeight: 600,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          color: "#eb0a1e",
          fontSize: "11px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          marginBottom: "5px",
        }}
      >
        {eyebrow}
      </div>

      <h2
        style={{
          margin: 0,
          color: "#111827",
          fontSize: "24px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "6px 0 0",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        {description}
      </p>
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

  // Latest currently available workbook month.
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
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {/* ======================================================
          HERO
          ====================================================== */}

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "30px",
          marginBottom: "24px",
          padding: "34px 38px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f8fafc 65%, #fff1f2 100%)",
          border: "1px solid #e2e8f0",
          borderLeft: "7px solid #eb0a1e",
          boxShadow:
            "0 10px 30px rgba(15,23,42,0.07)",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "-100px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            border: "35px solid rgba(235,10,30,0.05)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              padding: "7px 13px",
              marginBottom: "12px",
              borderRadius: "5px",
              background: "#eb0a1e",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "0.2em",
            }}
          >
            TOYOTA
          </div>

          <div
            style={{
              color: "#eb0a1e",
              fontSize: "11px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "5px",
            }}
          >
            Service Performance Analytics
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              lineHeight: 1.15,
              fontWeight: 950,
              color: "#111827",
              letterSpacing: "-0.03em",
            }}
          >
            Executive Overview
          </h1>

          <p
            style={{
              margin: "9px 0 0",
              color: "#64748b",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            Service Advisor Performance Tracker
          </p>
        </div>

        {/* Period Selector */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            minWidth: "220px",
            padding: "18px",
            borderRadius: "12px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.06)",
          }}
        >
          <label
            htmlFor="month"
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#9ca3af",
              marginBottom: "8px",
            }}
          >
            Reporting Period
          </label>

          <select
            id="month"
            value={month}
            onChange={(event) =>
              setMonth(Number(event.target.value))
            }
            style={{
              width: "100%",
              height: "46px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "0 12px",
              background: "#ffffff",
              color: "#111827",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              outline: "none",
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
      </section>

      {/* ======================================================
          BACKEND STATUS
          ====================================================== */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "28px",
          boxShadow:
            "0 3px 12px rgba(15,23,42,0.04)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "4px",
            }}
          >
            System Status
          </div>

          <div
            style={{
              fontSize: "15px",
              color: "#334155",
              fontWeight: 800,
            }}
          >
            Backend connection
          </div>
        </div>

        {healthState.status === "loading" && (
          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Checking API connection...
          </div>
        )}

        {healthState.status === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#dc2626",
              }}
            />
            Couldn't reach the API
          </div>
        )}

        {healthState.status === "loaded" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#059669",
              fontSize: "14px",
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow:
                  "0 0 0 4px rgba(16,185,129,0.12)",
              }}
            />

            Connected — API status:{" "}
            {healthState.data.status}
            {", DB connected: "}
            {String(
              healthState.data.database_connected,
            )}
          </div>
        )}
      </section>

      {/* ======================================================
          LOADING
          ====================================================== */}

      {overviewState.status === "loading" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "60px 30px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "16px",
            fontWeight: 700,
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
            borderLeft: "6px solid #dc2626",
            borderRadius: "14px",
            padding: "35px",
            textAlign: "center",
            boxShadow:
              "0 5px 18px rgba(15,23,42,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "#dc2626",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            Unable to load dashboard metrics
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            The dashboard is connected to the API, but
            the selected period's metrics are currently
            unavailable.
          </div>
        </div>
      )}

      {/* ======================================================
          DASHBOARD
          ====================================================== */}

      {overviewState.status === "loaded" && (
        <>
          {/* Period Heading */}

          <section
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <SectionHeader
              eyebrow="Performance Snapshot"
              title={`${formatMonth(
                overviewState.data.period.month,
              )} ${overviewState.data.period.year}`}
              description="Executive-level service advisor performance indicators."
            />

            <div
              style={{
                padding: "9px 14px",
                borderRadius: "20px",
                background: "#fff1f2",
                color: "#be123c",
                fontSize: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Monthly Snapshot
            </div>
          </section>

          {/* ==================================================
              CORE KPI GRID
              ================================================== */}

          <section
            style={{
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "18px",
              }}
            >
              <KpiCard
                title="Active Advisors"
                value={formatNumber(
                  overviewState.data.active_advisors,
                )}
                description="Service advisors"
                accent="dark"
              />

              <KpiCard
                title="Total GUS"
                value={formatNumber(
                  overviewState.data.total_gus,
                )}
                description="General service vehicles"
                accent="red"
              />

              <KpiCard
                title="Total PM"
                value={formatNumber(
                  overviewState.data.total_pm,
                )}
                description="Preventive maintenance"
                accent="red"
              />

              <KpiCard
                title="PM Conversion"
                value={`${overviewState.data.pm_conversion_pct.toFixed(
                  2,
                )}%`}
                description="PM / GUS"
                accent="green"
              />

              <KpiCard
                title="VAS Revenue"
                value={formatCurrency(
                  overviewState.data.total_vas_revenue,
                )}
                description="Value-added service revenue"
                accent="red"
              />

              <KpiCard
                title="NPS"
                value={overviewState.data.nps.toFixed(2)}
                description={`Sample: ${formatNumber(
                  overviewState.data.nps_sample,
                )}`}
                accent="green"
              />
            </div>
          </section>

          {/* ==================================================
              CUSTOMER EXPERIENCE
              ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "26px",
              marginBottom: "28px",
              boxShadow:
                "0 5px 18px rgba(15,23,42,0.05)",
            }}
          >
            <SectionHeader
              eyebrow="Customer Experience"
              title="NPS & Voice of Customer"
              description="Customer sentiment and feedback response indicators."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
              }}
            >
              <KpiCard
                title="NPS Promoters"
                value={formatNumber(
                  overviewState.data.nps_promoters,
                )}
                accent="green"
              />

              <KpiCard
                title="NPS Neutral"
                value={formatNumber(
                  overviewState.data.nps_neutral,
                )}
                accent="dark"
              />

              <KpiCard
                title="NPS Detractors"
                value={formatNumber(
                  overviewState.data.nps_detractors,
                )}
                accent="red"
              />

              <KpiCard
                title="IVOC Responses"
                value={formatNumber(
                  overviewState.data.ivoc_responses,
                )}
                description="VOC response volume"
                accent="dark"
              />
            </div>
          </section>

          {/* ==================================================
              DATA SOURCE
              ================================================== */}

          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "22px 24px",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, #111827, #1f2937)",
              color: "#ffffff",
              boxShadow:
                "0 8px 25px rgba(15,23,42,0.12)",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eb0a1e",
                fontSize: "20px",
                fontWeight: 900,
              }}
            >
              T
            </div>

            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  marginBottom: "4px",
                }}
              >
                Toyota Service Analytics
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#cbd5e1",
                  lineHeight: 1.6,
                }}
              >
                Dashboard values are retrieved from the
                Service Advisor Performance Tracker database
                through the FastAPI metrics API.
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
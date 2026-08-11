import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  type LeaderboardAdvisor,
} from "../services/api";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function LeaderboardPage() {
  const [year] = useState(2026);
  const [month, setMonth] = useState(6);

  const [data, setData] = useState<LeaderboardAdvisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    api
      .getLeaderboard(year, month)
      .then((response) => {
        if (cancelled) return;

        setData(response.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        console.error(err);

        if (err instanceof ApiError) {
          setError(
            `Unable to load leaderboard. API returned ${err.status}.`
          );
        } else {
          setError("Unable to load leaderboard.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const selectedMonth =
    MONTHS.find((item) => item.value === month)?.label ?? "";

  return (
    <div
      style={{
        padding: "32px",
        background: "#f7f9fc",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Advisor Leaderboard
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Advisors ranked by PM Conversion %
          </p>
        </div>

        {/* Month selector */}
        <div>
          <label
            style={{
              marginRight: "10px",
              fontSize: "14px",
              color: "#4b5563",
            }}
          >
            Period
          </label>

          <select
            value={month}
            onChange={(event) =>
              setMonth(Number(event.target.value))
            }
            style={{
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              background: "#ffffff",
              fontSize: "14px",
            }}
          >
            {MONTHS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label} {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "30px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Loading leaderboard...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "8px",
            padding: "20px",
            color: "#be123c",
          }}
        >
          {error}
        </div>
      )}

      {/* Data */}
      {!loading && !error && (
        <>
          <div
            style={{
              marginBottom: "16px",
              color: "#4b5563",
              fontSize: "14px",
            }}
          >
            {selectedMonth} {year} — {data.length} advisors
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f3f4f6",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={headerStyle}>Rank</th>
                  <th style={headerStyle}>Advisor</th>
                  <th style={headerStyle}>Employee No.</th>
                  <th style={headerStyle}>Branch</th>
                  <th style={headerStyle}>Grade</th>
                  <th style={headerStyle}>GUS</th>
                  <th style={headerStyle}>PM</th>
                  <th style={headerStyle}>PM Conversion</th>
                  <th style={headerStyle}>NPS</th>
                  <th style={headerStyle}>VAS Revenue</th>
                </tr>
              </thead>

              <tbody>
                {data.map((advisor) => (
                  <tr
                    key={advisor.advisor_id}
                    style={{
                      borderBottom:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <td style={cellStyle}>
                      <strong>
                        #{advisor.rank}
                      </strong>
                    </td>

                    <td style={cellStyle}>
                      <strong>
                        {advisor.name}
                      </strong>
                    </td>

                    <td style={cellStyle}>
                      {advisor.employee_number}
                    </td>

                    <td style={cellStyle}>
                      {advisor.branch}
                    </td>

                    <td style={cellStyle}>
                      {advisor.grade ?? "-"}
                    </td>

                    <td style={cellStyle}>
                      {advisor.gus.toLocaleString()}
                    </td>

                    <td style={cellStyle}>
                      {advisor.pm.toLocaleString()}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: 700,
                      }}
                    >
                      {advisor.pm_conversion_pct.toFixed(2)}%
                    </td>

                    <td style={cellStyle}>
                      {advisor.nps.toFixed(2)}
                    </td>

                    <td style={cellStyle}>
                      ₹
                      {advisor.vas_value.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.length === 0 && (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                No advisor data available for this period.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#4b5563",
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "#374151",
  whiteSpace: "nowrap",
};
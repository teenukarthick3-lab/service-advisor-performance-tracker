import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  type NpsVocResponse,
} from "../services/api";

export function NpsVocPage() {
  const [data, setData] = useState<NpsVocResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = 2026;
  const month = 6;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    api
      .getNpsVoc(year, month)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error(err);

          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load NPS & VOC metrics."
          );
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
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>NPS & VOC</h1>
        <p>Loading NPS and VOC metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>NPS & VOC</h1>

        <p style={{ color: "red" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>NPS & VOC</h1>
        <p>No data available.</p>
      </div>
    );
  }

  const { nps, voc } = data;

  return (
    <div style={{ padding: "40px" }}>

      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "8px" }}>
            NPS & VOC
          </h1>

          <p style={{ color: "#64748b" }}>
            Customer satisfaction and Voice of Customer metrics
          </p>
        </div>

        <strong>
          June 2026
        </strong>
      </div>


      {/* NPS Score */}

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "30px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            color: "#64748b",
            marginBottom: "8px",
          }}
        >
          NPS Score
        </p>

        <h1
          style={{
            fontSize: "48px",
            margin: 0,
          }}
        >
          {nps.score.toFixed(2)}
        </h1>

        <p style={{ color: "#94a3b8" }}>
          Net Promoter Score
        </p>
      </div>


      {/* NPS Distribution */}

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h2>NPS Distribution</h2>

          <p style={{ color: "#64748b" }}>
            Customer response distribution
          </p>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={thStyle}>
                Category
              </th>

              <th style={thStyle}>
                Responses
              </th>

              <th style={thStyle}>
                Percentage
              </th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td style={tdStyle}>
                <strong>Promoters</strong>
              </td>

              <td style={tdStyle}>
                {nps.promoters.toLocaleString()}
              </td>

              <td style={tdStyle}>
                {percentage(
                  nps.promoters,
                  nps.sample
                )}
                %
              </td>
            </tr>

            <tr>
              <td style={tdStyle}>
                <strong>Neutral</strong>
              </td>

              <td style={tdStyle}>
                {nps.neutral.toLocaleString()}
              </td>

              <td style={tdStyle}>
                {percentage(
                  nps.neutral,
                  nps.sample
                )}
                %
              </td>
            </tr>

            <tr>
              <td style={tdStyle}>
                <strong>Detractors</strong>
              </td>

              <td style={tdStyle}>
                {nps.detractors.toLocaleString()}
              </td>

              <td style={tdStyle}>
                {percentage(
                  nps.detractors,
                  nps.sample
                )}
                %
              </td>
            </tr>

            <tr
              style={{
                background: "#f8fafc",
              }}
            >
              <td style={tdStyle}>
                <strong>Total Sample</strong>
              </td>

              <td style={tdStyle}>
                <strong>
                  {nps.sample.toLocaleString()}
                </strong>
              </td>

              <td style={tdStyle}>
                <strong>100%</strong>
              </td>
            </tr>

          </tbody>
        </table>
      </div>


      {/* NPS Cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "24px",
        }}
      >

        <MetricCard
          title="Promoters"
          value={nps.promoters}
          description="Customers likely to recommend"
        />

        <MetricCard
          title="Neutral"
          value={nps.neutral}
          description="Passive customers"
        />

        <MetricCard
          title="Detractors"
          value={nps.detractors}
          description="Customers unlikely to recommend"
        />

      </div>


      {/* VOC */}

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
        }}
      >

        <h2>
          Voice of Customer
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "24px",
          }}
        >
          IVOC response volume
        </p>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "24px",
          }}
        >

          <p
            style={{
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            IVOC Responses
          </p>

          <h2 style={{ margin: 0 }}>
            {voc.ivoc_responses.toLocaleString()}
          </h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            VOC response volume
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================
   Helper Functions
========================= */

function percentage(
  value: number,
  total: number
): string {
  if (!total) {
    return "0.00";
  }

  return ((value / total) * 100).toFixed(2);
}


/* =========================
   Components
========================= */

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "24px",
      }}
    >
      <p
        style={{
          color: "#64748b",
          marginBottom: "8px",
        }}
      >
        {title}
      </p>

      <h2 style={{ margin: 0 }}>
        {value.toLocaleString()}
      </h2>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "8px",
        }}
      >
        {description}
      </p>
    </div>
  );
}


/* =========================
   Styles
========================= */

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 24px",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 24px",
  borderBottom: "1px solid #f1f5f9",
};
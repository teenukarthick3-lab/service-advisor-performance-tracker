import { useEffect, useState } from "react";
import { api, ApiError, type ProductMetricsResponse } from "../services/api";

export function ProductsPage() {
  const [data, setData] = useState<ProductMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = 2026;
  const month = 6;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    api
      .getProducts(year, month)
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
              : "Unable to load product metrics."
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
        <h1>Product & VAS Performance</h1>
        <p>Loading product metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Product & VAS Performance</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Product & VAS Performance</h1>
        <p>No data available.</p>
      </div>
    );
  }

  const products = [
    ["Tyre", data.products.tyre],
    ["Battery", data.products.battery],
    ["Injector Cleaner", data.products.injector_cleaner],
    ["Engine Flush", data.products.engine_flush],
    ["Bactakleen", data.products.bactakleen],
    ["Wheel Alignment", data.products.wheel_alignment],
    ["Smiles AMC", data.products.smiles_amc],
  ];

  return (
    <div style={{ padding: "40px" }}>
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
            Product & VAS Performance
          </h1>

          <p style={{ color: "#64748b" }}>
            Product penetration and revenue metrics
          </p>
        </div>

        <div>
          <strong>June 2026</strong>
        </div>
      </div>

      {/* GUS */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <p style={{ color: "#64748b", marginBottom: "8px" }}>
          Total GUS
        </p>

        <h2 style={{ margin: 0 }}>
          {data.gus.toLocaleString()}
        </h2>

        <p style={{ color: "#94a3b8" }}>
          General service vehicles
        </p>
      </div>

      {/* Product table */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div style={{ padding: "20px 24px" }}>
          <h2>Product Penetration</h2>
          <p style={{ color: "#64748b" }}>
            Product count and penetration against total GUS
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
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Count</th>
              <th style={thStyle}>Penetration</th>
            </tr>
          </thead>

          <tbody>
            {products.map(([name, product]) => (
              <tr key={name as string}>
                <td style={tdStyle}>
                  <strong>{name as string}</strong>
                </td>

                <td style={tdStyle}>
                  {(product as { count: number }).count.toLocaleString()}
                </td>

                <td style={tdStyle}>
                  {(product as { penetration_pct: number }).penetration_pct.toFixed(
                    2
                  )}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <h2>Revenue</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <RevenueCard
            title="VAS Revenue"
            value={data.revenue.vas_value}
          />

          <RevenueCard
            title="DIY Revenue"
            value={data.revenue.diy_value}
          />

          <RevenueCard
            title="Accessories Revenue"
            value={data.revenue.accessories_value}
          />
        </div>
      </div>
    </div>
  );
}

function RevenueCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "20px",
      }}
    >
      <p style={{ color: "#64748b", marginBottom: "8px" }}>
        {title}
      </p>

      <h2 style={{ margin: 0 }}>
        ₹{value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </h2>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 24px",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 24px",
  borderBottom: "1px solid #f1f5f9",
};
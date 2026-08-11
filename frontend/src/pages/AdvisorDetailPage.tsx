import { useEffect, useMemo, useState } from "react";
import { api, type AdvisorMetric } from "../services/api";

const YEAR = 2026;

const MONTHS = [
  { value: 1, label: "Jan", full: "January" },
  { value: 2, label: "Feb", full: "February" },
  { value: 3, label: "Mar", full: "March" },
  { value: 4, label: "Apr", full: "April" },
  { value: 5, label: "May", full: "May" },
  { value: 6, label: "Jun", full: "June" },
  { value: 7, label: "Jul", full: "July" },
  { value: 8, label: "Aug", full: "August" },
  { value: 9, label: "Sep", full: "September" },
  { value: 10, label: "Oct", full: "October" },
  { value: 11, label: "Nov", full: "November" },
  { value: 12, label: "Dec", full: "December" },
];

type ProductConversionKey =
  | "tyre_pm_conversion_pct"
  | "battery_pm_conversion_pct"
  | "injector_cleaner_pm_conversion_pct"
  | "engine_flush_pm_conversion_pct"
  | "bactakleen_pm_conversion_pct"
  | "wheel_alignment_pm_conversion_pct"
  | "smiles_amc_pm_conversion_pct";

type ProductValueKey =
  | "tyre"
  | "battery"
  | "injector_cleaner"
  | "engine_flush"
  | "bactakleen"
  | "wheel_alignment"
  | "smiles_amc";

type MonthlyAdvisor = AdvisorMetric & {
  month: number;

  tyre_pm_conversion_pct?: number;
  battery_pm_conversion_pct?: number;
  injector_cleaner_pm_conversion_pct?: number;
  engine_flush_pm_conversion_pct?: number;
  bactakleen_pm_conversion_pct?: number;
  wheel_alignment_pm_conversion_pct?: number;
  smiles_amc_pm_conversion_pct?: number;
};

type MetricKey =
  | "gus"
  | "pm"
  | "pm_conversion_pct"
  | "nps"
  | "vas_value"
  | "tyre"
  | "battery"
  | "injector_cleaner"
  | "engine_flush"
  | "bactakleen"
  | "wheel_alignment"
  | "smiles_amc"
  | "ivoc_responses"
  | ProductConversionKey;

export function AdvisorDetailPage() {
  const [monthlyData, setMonthlyData] = useState<
    MonthlyAdvisor[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBranch, setSelectedBranch] =
    useState("");

  const [selectedAdvisorId, setSelectedAdvisorId] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAllMonths() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.all(
          MONTHS.map(async (month) => {
            try {
              const response = await api.getAdvisors(
                YEAR,
                month.value
              );

              return {
                month: month.value,
                data: response.data ?? [],
              };
            } catch (err) {
              console.error(
                `Unable to load month ${month.value}`,
                err
              );

              return {
                month: month.value,
                data: [],
              };
            }
          })
        );

        if (cancelled) return;

        const combined: MonthlyAdvisor[] = [];

        for (const result of results) {
          for (const advisor of result.data) {
            combined.push({
              ...advisor,
              month: result.month,
            });
          }
        }

        setMonthlyData(combined);

        const available = results
          .filter(
            (item) => item.data.length > 0
          )
          .sort((a, b) => b.month - a.month);

        const latest = available[0];

        if (
          latest &&
          latest.data.length > 0
        ) {
          const firstAdvisor = [
            ...latest.data,
          ].sort((a, b) =>
            a.name.localeCompare(b.name)
          )[0];

          setSelectedBranch(
            firstAdvisor.branch
          );

          setSelectedAdvisorId(
            firstAdvisor.advisor_id
          );
        }
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load advisor performance data."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAllMonths();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableMonths = useMemo(() => {
    const values = new Set(
      monthlyData.map(
        (item) => item.month
      )
    );

    return MONTHS.filter((month) =>
      values.has(month.value)
    );
  }, [monthlyData]);

  const latestRecords = useMemo(() => {
    const latestMonth =
      availableMonths.length > 0
        ? availableMonths[
            availableMonths.length - 1
          ].value
        : null;

    if (!latestMonth) return [];

    return monthlyData.filter(
      (item) =>
        item.month === latestMonth
    );
  }, [
    monthlyData,
    availableMonths,
  ]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        latestRecords
          .map((item) => item.branch)
          .filter(Boolean)
      )
    ).sort();
  }, [latestRecords]);

  const branchAdvisors = useMemo(() => {
    if (!selectedBranch) return [];

    return latestRecords
      .filter(
        (item) =>
          item.branch === selectedBranch
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  }, [
    latestRecords,
    selectedBranch,
  ]);

  const selectedAdvisor = useMemo(() => {
    if (selectedAdvisorId === null) {
      return null;
    }

    return (
      monthlyData.find(
        (item) =>
          item.advisor_id ===
          selectedAdvisorId
      ) ?? null
    );
  }, [
    monthlyData,
    selectedAdvisorId,
  ]);

  const selectedMonthlyData = useMemo(() => {
    if (selectedAdvisorId === null) {
      return [];
    }

    return monthlyData
      .filter(
        (item) =>
          item.advisor_id ===
          selectedAdvisorId
      )
      .sort(
        (a, b) => a.month - b.month
      );
  }, [
    monthlyData,
    selectedAdvisorId,
  ]);

  const firstAvailableMonth =
    availableMonths[0];

  const latestAvailableMonth =
    availableMonths[
      availableMonths.length - 1
    ];

  const periodLabel =
    firstAvailableMonth &&
    latestAvailableMonth
      ? `${firstAvailableMonth.full} → ${latestAvailableMonth.full}`
      : "No data";

  function changeBranch(
    branch: string
  ) {
    setSelectedBranch(branch);

    const firstAdvisor = latestRecords
      .filter(
        (item) =>
          item.branch === branch
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      )[0];

    setSelectedAdvisorId(
      firstAdvisor?.advisor_id ?? null
    );
  }

  function changeAdvisor(
    id: number
  ) {
    const advisor = latestRecords.find(
      (item) =>
        item.advisor_id === id
    );

    if (advisor) {
      setSelectedBranch(
        advisor.branch
      );

      setSelectedAdvisorId(id);
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h2
            style={sectionTitleStyle}
          >
            Loading Advisor Performance...
          </h2>

          <p style={mutedStyle}>
            Loading monthly advisor data.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={errorStyle}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* HERO */}

      <section style={heroStyle}>
        <div>
          <div style={toyotaBadgeStyle}>
            TOYOTA
          </div>

          <div style={eyebrowStyle}>
            SERVICE PERFORMANCE ANALYTICS
          </div>

          <h1 style={heroTitleStyle}>
            Service Advisor Comparison
          </h1>

          <p
            style={heroSubtitleStyle}
          >
            Track monthly performance,
            growth and service-product
            activity.
          </p>
        </div>

        <div style={yearStyle}>
          {YEAR}
        </div>
      </section>

      {/* FILTERS */}

      <section style={filterGridStyle}>
        <div style={cardStyle}>
          <label style={labelStyle}>
            Branch
          </label>

          <select
            value={selectedBranch}
            onChange={(event) =>
              changeBranch(
                event.target.value
              )
            }
            style={selectStyle}
          >
            <option value="">
              Select Branch
            </option>

            {branches.map(
              (branch) => (
                <option
                  key={branch}
                  value={branch}
                >
                  {branch}
                </option>
              )
            )}
          </select>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>
            Service Advisor
          </label>

          <select
            value={
              selectedAdvisorId ?? ""
            }
            disabled={!selectedBranch}
            onChange={(event) =>
              changeAdvisor(
                Number(
                  event.target.value
                )
              )
            }
            style={{
              ...selectStyle,
              opacity:
                selectedBranch
                  ? 1
                  : 0.6,
            }}
          >
            <option value="">
              Select Advisor
            </option>

            {branchAdvisors.map(
              (advisor) => (
                <option
                  key={
                    advisor.advisor_id
                  }
                  value={
                    advisor.advisor_id
                  }
                >
                  {advisor.name} —{" "}
                  {
                    advisor.employee_number
                  }
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {/* AVAILABLE MONTHS */}

      <section
        style={availabilityStyle}
      >
        <div>
          <div style={smallLabelStyle}>
            DATA AVAILABLE
          </div>

          <div style={periodStyle}>
            {periodLabel}
          </div>
        </div>

        <div
          style={monthPillContainer}
        >
          {availableMonths.map(
            (month) => (
              <span
                key={month.value}
                style={monthPillStyle}
              >
                {month.label}
              </span>
            )
          )}
        </div>
      </section>

      {/* SELECTED ADVISOR */}

      {selectedAdvisor && (
        <>
          <section
            style={advisorHeaderStyle}
          >
            <div>
              <div
                style={smallLabelStyle}
              >
                SELECTED SERVICE ADVISOR
              </div>

              <h2
                style={advisorNameStyle}
              >
                {selectedAdvisor.name}
              </h2>

              <p
                style={advisorMetaStyle}
              >
                {
                  selectedAdvisor.employee_number
                }
                {" • "}
                {selectedAdvisor.branch}
              </p>
            </div>

            <div
              style={advisorDetailsGrid}
            >
              <InfoItem
                label="Branch"
                value={
                  selectedAdvisor.branch
                }
              />

              <InfoItem
                label="City"
                value={
                  selectedAdvisor.city ??
                  "-"
                }
              />

              <InfoItem
                label="Grade"
                value={
                  selectedAdvisor.grade ??
                  "-"
                }
              />

              <InfoItem
                label="Designation"
                value={
                  selectedAdvisor.designation ??
                  "-"
                }
              />
            </div>
          </section>

          {/* KPI CARDS */}

          <section style={kpiGridStyle}>
            <KpiCard
              title="GUS"
              value={latestValue(
                selectedMonthlyData,
                "gus"
              )}
              growth={periodGrowth(
                selectedMonthlyData,
                "gus"
              )}
            />

            <KpiCard
              title="PM"
              value={latestValue(
                selectedMonthlyData,
                "pm"
              )}
              growth={periodGrowth(
                selectedMonthlyData,
                "pm"
              )}
            />

            <KpiCard
              title="PM Conversion"
              value={`${latestValue(
                selectedMonthlyData,
                "pm_conversion_pct"
              ).toFixed(2)}%`}
              growth={periodGrowth(
                selectedMonthlyData,
                "pm_conversion_pct"
              )}
            />

            <KpiCard
              title="NPS"
              value={latestValue(
                selectedMonthlyData,
                "nps"
              ).toFixed(2)}
              growth={periodGrowth(
                selectedMonthlyData,
                "nps"
              )}
            />

            <KpiCard
              title="VAS Revenue"
              value={formatCurrency(
                latestValue(
                  selectedMonthlyData,
                  "vas_value"
                )
              )}
              growth={periodGrowth(
                selectedMonthlyData,
                "vas_value"
              )}
            />
          </section>

          {/* GROWTH */}

          <section style={cardStyle}>
            <SectionHeader
              title="Performance Growth"
              description={`Change from ${periodLabel}`}
            />

            <div
              style={growthGridStyle}
            >
              <GrowthCard
                title="GUS"
                value={periodGrowth(
                  selectedMonthlyData,
                  "gus"
                )}
              />

              <GrowthCard
                title="PM"
                value={periodGrowth(
                  selectedMonthlyData,
                  "pm"
                )}
              />

              <GrowthCard
                title="PM Conversion"
                value={periodGrowth(
                  selectedMonthlyData,
                  "pm_conversion_pct"
                )}
              />

              <GrowthCard
                title="NPS"
                value={periodGrowth(
                  selectedMonthlyData,
                  "nps"
                )}
              />

              <GrowthCard
                title="VAS Revenue"
                value={periodGrowth(
                  selectedMonthlyData,
                  "vas_value"
                )}
              />
            </div>
          </section>

          {/* CHARTS */}

          <section
            style={chartGridStyle}
          >
            <TrendChart
              title="GUS Trend"
              description="General service vehicles"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="gus"
              format="number"
            />

            <TrendChart
              title="PM Trend"
              description="Preventive maintenance"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="pm"
              format="number"
            />

            <TrendChart
              title="PM Conversion"
              description="Monthly conversion percentage"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="pm_conversion_pct"
              format="percent"
            />

            <TrendChart
              title="NPS Trend"
              description="Net Promoter Score"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="nps"
              format="decimal"
            />
          </section>

          {/* MONTHLY COMPARISON */}

          <section style={cardStyle}>
            <SectionHeader
              title="Monthly Comparison"
              description="Actual value and month-over-month growth"
            />

            <ComparisonTable
              title="GUS"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="gus"
              format="number"
            />

            <ComparisonTable
              title="PM"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="pm"
              format="number"
            />

            <ComparisonTable
              title="PM Conversion"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="pm_conversion_pct"
              format="percent"
            />

            <ComparisonTable
              title="NPS"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="nps"
              format="decimal"
            />

            <ComparisonTable
              title="VAS Revenue"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="vas_value"
              format="currency"
            />

            <ComparisonTable
              title="IVOC Responses"
              data={selectedMonthlyData}
              months={availableMonths}
              metric="ivoc_responses"
              format="number"
            />
          </section>

          {/* PRODUCT PERFORMANCE */}

          <section style={cardStyle}>
            <SectionHeader
              title="Product Performance"
              description="Product activity and PM conversion percentage by month"
            />

            <ProductPerformanceTable
              title="Tyre"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="tyre"
              conversionMetric="tyre_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Battery"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="battery"
              conversionMetric="battery_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Injector Cleaner"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="injector_cleaner"
              conversionMetric="injector_cleaner_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Engine Flush"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="engine_flush"
              conversionMetric="engine_flush_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Bactakleen"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="bactakleen"
              conversionMetric="bactakleen_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Wheel Alignment"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="wheel_alignment"
              conversionMetric="wheel_alignment_pm_conversion_pct"
            />

            <ProductPerformanceTable
              title="Smiles AMC"
              data={selectedMonthlyData}
              months={availableMonths}
              valueMetric="smiles_amc"
              conversionMetric="smiles_amc_pm_conversion_pct"
            />
          </section>
        </>
      )}

      {!selectedAdvisor && (
        <section style={cardStyle}>
          <div style={emptyStyle}>
            Select a branch and service advisor
            to view the comparison.
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={smallLabelStyle}>
        {label}
      </div>

      <div style={infoValueStyle}>
        {value}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  growth,
}: {
  title: string;
  value: number | string;
  growth: number | null;
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiTitleStyle}>
        {title}
      </div>

      <div style={kpiValueStyle}>
        {typeof value === "number"
          ? formatNumber(value)
          : value}
      </div>

      {growth !== null && (
        <div
          style={{
            marginTop: "7px",
            color:
              growth >= 0
                ? "#15803d"
                : "#dc2626",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {growth >= 0 ? "↑" : "↓"}{" "}
          {growth > 0 ? "+" : ""}
          {growth.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function GrowthCard({
  title,
  value,
}: {
  title: string;
  value: number | null;
}) {
  const color =
    value === null
      ? "#6b7280"
      : value >= 0
      ? "#15803d"
      : "#dc2626";

  return (
    <div
      style={{
        ...growthCardStyle,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={smallLabelStyle}>
        {title}
      </div>

      <div
        style={{
          marginTop: "8px",
          color,
          fontSize: "24px",
          fontWeight: 800,
        }}
      >
        {value === null
          ? "—"
          : `${value >= 0 ? "+" : ""}${value.toFixed(
              2
            )}%`}
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT PERFORMANCE TABLE
========================================================= */

function ProductPerformanceTable({
  title,
  data,
  months,
  valueMetric,
  conversionMetric,
}: {
  title: string;
  data: MonthlyAdvisor[];
  months: typeof MONTHS;
  valueMetric: ProductValueKey;
  conversionMetric: ProductConversionKey;
}) {
  return (
    <div style={comparisonBlockStyle}>
      <div
        style={{
          ...comparisonTitleStyle,
          fontSize: "16px",
        }}
      >
        {title}
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th
                style={{
                  ...tableHeaderStyle,
                  textAlign: "left",
                  minWidth: "100px",
                }}
              >
                Metric
              </th>

              {months.map((month) => (
                <th
                  key={month.value}
                  style={tableHeaderStyle}
                >
                  {month.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* VALUE ROW */}

            <tr>
              <td
                style={{
                  ...tableValueStyle,
                  textAlign: "left",
                  fontWeight: 800,
                }}
              >
                Value
              </td>

              {months.map((month) => {
                const record = data.find(
                  (item) =>
                    item.month ===
                    month.value
                );

                return (
                  <td
                    key={month.value}
                    style={tableValueStyle}
                  >
                    {record
                      ? formatNumber(
                          Number(
                            record[
                              valueMetric
                            ] ?? 0
                          )
                        )
                      : "—"}
                  </td>
                );
              })}
            </tr>

            {/* CONVERSION ROW */}

            <tr>
              <td
                style={{
                  ...tableValueStyle,
                  textAlign: "left",
                  fontWeight: 800,
                  color: "#eb0a1e",
                }}
              >
                Conv %
              </td>

              {months.map((month) => {
                const record = data.find(
                  (item) =>
                    item.month ===
                    month.value
                );

                return (
                  <td
                    key={month.value}
                    style={{
                      ...tableValueStyle,
                      color: "#eb0a1e",
                      fontWeight: 800,
                    }}
                  >
                    {record
                      ? `${Number(
                          record[
                            conversionMetric
                          ] ?? 0
                        ).toFixed(2)}%`
                      : "—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={growthLegendStyle}>
        Value = product activity
        {" • "}
        Conv % = PM conversion percentage
      </div>
    </div>
  );
}

/* =========================================================
   EXISTING COMPARISON TABLE
========================================================= */

function ComparisonTable({
  title,
  data,
  months,
  metric,
  format,
}: {
  title: string;
  data: MonthlyAdvisor[];
  months: typeof MONTHS;
  metric: MetricKey;
  format:
    | "number"
    | "percent"
    | "decimal"
    | "currency";
}) {
  return (
    <div style={comparisonBlockStyle}>
      <div style={comparisonTitleStyle}>
        {title}
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {months.map((month) => (
                <th
                  key={month.value}
                  style={tableHeaderStyle}
                >
                  {month.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              {months.map((month) => {
                const record = data.find(
                  (item) =>
                    item.month ===
                    month.value
                );

                return (
                  <td
                    key={month.value}
                    style={tableValueStyle}
                  >
                    {record
                      ? formatMetric(
                          Number(
                            record[metric] ?? 0
                          ),
                          format
                        )
                      : "—"}
                  </td>
                );
              })}
            </tr>

            <tr>
              {months.map(
                (month, index) => {
                  const current =
                    data.find(
                      (item) =>
                        item.month ===
                        month.value
                    );

                  const previous =
                    index > 0
                      ? data.find(
                          (item) =>
                            item.month ===
                            months[
                              index - 1
                            ].value
                        )
                      : undefined;

                  const growth =
                    current && previous
                      ? calculateGrowth(
                          Number(
                            previous[
                              metric
                            ] ?? 0
                          ),
                          Number(
                            current[
                              metric
                            ] ?? 0
                          )
                        )
                      : null;

                  return (
                    <td
                      key={month.value}
                      style={{
                        ...growthCellStyle,
                        color:
                          growth === null
                            ? "#9ca3af"
                            : growth >= 0
                            ? "#15803d"
                            : "#dc2626",
                      }}
                    >
                      {growth === null
                        ? "—"
                        : `${
                            growth >= 0
                              ? "+"
                              : ""
                          }${growth.toFixed(
                            2
                          )}%`}
                    </td>
                  );
                }
              )}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={growthLegendStyle}>
        First row = actual value
        {" • "}
        Second row = month-over-month growth
      </div>
    </div>
  );
}

/* =========================================================
   TREND CHART
========================================================= */

function TrendChart({
  title,
  description,
  data,
  months,
  metric,
  format,
}: {
  title: string;
  description: string;
  data: MonthlyAdvisor[];
  months: typeof MONTHS;
  metric: MetricKey;
  format:
    | "number"
    | "percent"
    | "decimal"
    | "currency";
}) {
  const width = 760;
  const height = 280;
  const left = 50;
  const right = 20;
  const top = 35;
  const bottom = 45;

  const values = data.map((item) =>
    Number(item[metric] ?? 0)
  );

  const min =
    values.length > 0
      ? Math.min(...values)
      : 0;

  const max =
    values.length > 0
      ? Math.max(...values)
      : 1;

  const range = max - min || 1;

  const points = months
    .map((month, index) => {
      const record = data.find(
        (item) =>
          item.month === month.value
      );

      if (!record) {
        return null;
      }

      const x =
        months.length === 1
          ? width / 2
          : left +
            (index *
              (width -
                left -
                right)) /
              (months.length - 1);

      const value = Number(
        record[metric] ?? 0
      );

      const y =
        top +
        (1 - (value - min) / range) *
          (height - top - bottom);

      return {
        x,
        y,
        value,
      };
    })
    .filter(
      (
        point
      ): point is {
        x: number;
        y: number;
        value: number;
      } => point !== null
    );

  const line =
    points.length > 1
      ? points
          .map(
            (point) =>
              `${point.x},${point.y}`
          )
          .join(" ")
      : "";

  return (
    <div style={chartCardStyle}>
      <div style={chartTitleStyle}>
        {title}
      </div>

      <div
        style={chartDescriptionStyle}
      >
        {description}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          height: "270px",
          marginTop: "10px",
        }}
      >
        {[0, 1, 2, 3].map(
          (row) => {
            const y =
              top +
              (row *
                (height -
                  top -
                  bottom)) /
                3;

            return (
              <line
                key={row}
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          }
        )}

        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#eb0a1e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map(
          (point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#fff"
                stroke="#eb0a1e"
                strokeWidth="3"
              />

              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#374151"
              >
                {formatMetric(
                  point.value,
                  format
                )}
              </text>
            </g>
          )
        )}

        {months.map(
          (month, index) => {
            const x =
              months.length === 1
                ? width / 2
                : left +
                  (index *
                    (width -
                      left -
                      right)) /
                    (months.length - 1);

            return (
              <text
                key={month.value}
                x={x}
                y={height - 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#6b7280"
              >
                {month.label}
              </text>
            );
          }
        )}
      </svg>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom: "22px",
      }}
    >
      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <p style={mutedStyle}>
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function latestValue(
  data: MonthlyAdvisor[],
  metric: MetricKey
): number {
  if (!data.length) return 0;

  return Number(
    data[data.length - 1][metric] ??
      0
  );
}

function periodGrowth(
  data: MonthlyAdvisor[],
  metric: MetricKey
): number | null {
  if (data.length < 2) return null;

  const first = Number(
    data[0][metric] ?? 0
  );

  const last = Number(
    data[data.length - 1][metric] ??
      0
  );

  return calculateGrowth(
    first,
    last
  );
}

function calculateGrowth(
  previous: number,
  current: number
): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return (
    ((current - previous) /
      previous) *
    100
  );
}

function formatMetric(
  value: number,
  format:
    | "number"
    | "percent"
    | "decimal"
    | "currency"
): string {
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }

  if (format === "decimal") {
    return value.toFixed(2);
  }

  if (format === "currency") {
    return formatCurrency(value);
  }

  return formatNumber(value);
}

function formatNumber(
  value: number
): string {
  return value.toLocaleString(
    "en-IN"
  );
}

function formatCurrency(
  value: number
): string {
  return `₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle: React.CSSProperties = {
  padding: "28px",
  minHeight: "100%",
  background:
    "linear-gradient(180deg,#f7f8fa,#eef1f5)",
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "30px 34px",
  marginBottom: "20px",
  borderRadius: "14px",
  background:
    "linear-gradient(135deg,#ffffff,#fafafa)",
  border: "1px solid #e5e7eb",
  borderLeft: "5px solid #eb0a1e",
  boxShadow:
    "0 8px 25px rgba(15,23,42,.06)",
};

const toyotaBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "4px",
  background: "#eb0a1e",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "2px",
  marginBottom: "9px",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 800,
  color: "#eb0a1e",
  letterSpacing: "2px",
};

const heroTitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: "29px",
  fontWeight: 850,
  color: "#111827",
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6b7280",
  fontSize: "14px",
};

const yearStyle: React.CSSProperties = {
  fontSize: "45px",
  fontWeight: 900,
  color: "#d1d5db",
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(280px,1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "11px",
  padding: "22px",
  marginBottom: "20px",
  boxShadow:
    "0 4px 15px rgba(15,23,42,.04)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "12px",
  fontWeight: 800,
  color: "#374151",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "45px",
  padding: "0 12px",
  borderRadius: "7px",
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: "14px",
  color: "#111827",
};

const availabilityStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  padding: "18px 22px",
  marginBottom: "20px",
  borderRadius: "10px",
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const periodStyle: React.CSSProperties = {
  marginTop: "5px",
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
};

const monthPillContainer: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const monthPillStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "20px",
  background: "#fff1f2",
  color: "#be123c",
  fontSize: "11px",
  fontWeight: 800,
};

const advisorHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "30px",
  flexWrap: "wrap",
  padding: "24px",
  marginBottom: "20px",
  borderRadius: "11px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderTop: "3px solid #eb0a1e",
};

const advisorNameStyle: React.CSSProperties = {
  margin: "5px 0",
  fontSize: "24px",
  fontWeight: 850,
  color: "#111827",
};

const advisorMetaStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6b7280",
};

const advisorDetailsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4,minmax(100px,1fr))",
  gap: "22px",
  minWidth: "500px",
};

const infoValueStyle: React.CSSProperties = {
  marginTop: "5px",
  fontSize: "13px",
  fontWeight: 700,
  color: "#111827",
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 800,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: ".6px",
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(170px,1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const kpiCardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderBottom:
    "3px solid #eb0a1e",
  borderRadius: "9px",
  padding: "18px",
};

const kpiTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 800,
  color: "#6b7280",
  textTransform: "uppercase",
};

const kpiValueStyle: React.CSSProperties = {
  marginTop: "7px",
  fontSize: "23px",
  fontWeight: 850,
  color: "#111827",
};

const growthGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(160px,1fr))",
  gap: "12px",
};

const growthCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "8px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const chartGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(420px,1fr))",
  gap: "18px",
  marginBottom: "20px",
};

const chartCardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "20px",
  boxShadow:
    "0 4px 15px rgba(15,23,42,.04)",
};

const chartTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 850,
  color: "#111827",
};

const chartDescriptionStyle: React.CSSProperties = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#9ca3af",
};

const comparisonBlockStyle: React.CSSProperties = {
  marginBottom: "30px",
};

const comparisonTitleStyle: React.CSSProperties = {
  marginBottom: "9px",
  fontSize: "15px",
  fontWeight: 800,
  color: "#1f2937",
};

const tableWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "650px",
  borderCollapse: "collapse",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: 800,
  color: "#374151",
};

const tableValueStyle: React.CSSProperties = {
  padding: "12px 10px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: 700,
  color: "#111827",
};

const growthCellStyle: React.CSSProperties = {
  padding: "9px 10px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "11px",
  fontWeight: 800,
};

const growthLegendStyle: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "10px",
  color: "#9ca3af",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "19px",
  fontWeight: 850,
  color: "#111827",
};

const mutedStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  color: "#6b7280",
};

const errorStyle: React.CSSProperties = {
  padding: "20px",
  borderRadius: "10px",
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  color: "#9f1239",
  fontWeight: 700,
};

const emptyStyle: React.CSSProperties = {
  padding: "40px",
  textAlign: "center",
  color: "#6b7280",
};
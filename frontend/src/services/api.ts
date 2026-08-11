const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://service-advisor-performance-tracker.onrender.com/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed`,
      response.status
    );
  }

  return (await response.json()) as T;
}

/* =========================
   HEALTH
========================= */

export interface HealthResponse {
  status: string;
  environment: string;
  database_connected: boolean;
}

/* =========================
   OVERVIEW
========================= */

export interface OverviewResponse {
  period: {
    year: number;
    month: number;
  };

  filters: {
    branch: string | null;
    grade: string | null;
  };

  active_advisors: number;
  total_gus: number;
  total_pm: number;
  pm_conversion_pct: number;
  total_vas_revenue: number;

  nps: number;
  nps_sample: number;
  nps_promoters: number;
  nps_neutral: number;
  nps_detractors: number;

  ivoc_responses: number;
}

/* =========================
   ADVISORS
========================= */

export interface AdvisorMetric {
  advisor_id: number;

  employee_number: string;
  name: string;

  branch: string;
  city: string | null;
  designation: string | null;
  grade: string | null;

  snapshot_date: string;

  gus: number;
  pm: number;
  pm_conversion_pct: number;

  tyre: number;
  tyre_pm_conversion_pct: number;

  battery: number;
  battery_pm_conversion_pct: number;

  injector_cleaner: number;
  injector_cleaner_pm_conversion_pct: number;

  engine_flush: number;
  engine_flush_pm_conversion_pct: number;

  bactakleen: number;
  bactakleen_pm_conversion_pct: number;

  wheel_alignment: number;
  wheel_alignment_pm_conversion_pct: number;

  smiles_amc: number;
  smiles_amc_pm_conversion_pct: number;

  vas_vehicles: number;
  vas_treatments: number;
  vas_value: number;

  diy_value: number;
  accessories_value: number;

  gs_to_bp_conversion: number;

  nps_sample: number;
  nps_promoters: number;
  nps_neutral: number;
  nps_detractors: number;
  nps: number;

  ivoc_responses: number;
}

export interface AdvisorsResponse {
  period: {
    year: number;
    month: number;
  };

  data: AdvisorMetric[];
}

/* =========================
   LEADERBOARD
========================= */

export interface LeaderboardAdvisor {
  rank: number;

  advisor_id: number;

  employee_number: string;
  name: string;

  branch: string;
  city: string | null;
  designation: string | null;
  grade: string | null;

  gus: number;
  pm: number;
  pm_conversion_pct: number;

  nps: number;
  vas_value: number;
}

export interface LeaderboardResponse {
  period: {
    year: number;
    month: number;
  };

  ranking_metric: string;

  data: LeaderboardAdvisor[];
}

/* =========================
   PRODUCTS
========================= */

export interface ProductMetric {
  count: number;
  penetration_pct: number;
}

export interface ProductMetricsResponse {
  period: {
    year: number;
    month: number;
  };

  gus: number;

  products: {
    tyre: ProductMetric;
    battery: ProductMetric;
    injector_cleaner: ProductMetric;
    engine_flush: ProductMetric;
    bactakleen: ProductMetric;
    wheel_alignment: ProductMetric;
    smiles_amc: ProductMetric;
  };

  revenue: {
    vas_value: number;
    diy_value: number;
    accessories_value: number;
  };
}

/* =========================
   NPS & VOC
========================= */

export interface NpsVocResponse {
  period: {
    year: number;
    month: number;
  };

  nps: {
    score: number;
    sample: number;
    promoters: number;
    neutral: number;
    detractors: number;
  };

  voc: {
    ivoc_responses: number;
  };
}

/* =========================
   API
========================= */

export const api = {
  getHealth: () =>
    request<HealthResponse>("/health"),

  getOverview: (year: number, month: number) =>
    request<OverviewResponse>(
      `/metrics/overview?year=${year}&month=${month}`
    ),

  getAdvisors: (year: number, month: number) =>
    request<AdvisorsResponse>(
      `/metrics/advisors?year=${year}&month=${month}`
    ),

  getLeaderboard: (year: number, month: number) =>
    request<LeaderboardResponse>(
      `/metrics/leaderboard?year=${year}&month=${month}`
    ),

  getProducts: (year: number, month: number) =>
    request<ProductMetricsResponse>(
      `/metrics/products?year=${year}&month=${month}`
    ),

  getNpsVoc: (year: number, month: number) =>
    request<NpsVocResponse>(
      `/metrics/nps-voc?year=${year}&month=${month}`
    ),
};
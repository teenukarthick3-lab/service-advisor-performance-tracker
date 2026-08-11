import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

type UploadResult = {
  status?: string;
  import_batch_id?: number;
  filename?: string;
  business_date?: string;
  rows_parsed?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_failed?: number;
  rows_rejected?: number;
  database_modified?: boolean;
  message?: string;
};

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [businessDate, setBusinessDate] = useState("2026-08-10");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    if (!businessDate) {
      setError("Please select a business date.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("business_date", businessDate);

      const response = await fetch(
        `${API_BASE_URL}/upload/commit`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? JSON.stringify(data.detail)
            : "Upload failed."
        );
      }

      setResult(data);
      setMessage("Upload completed successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the file."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Data Upload
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Import the Service Advisor Performance Tracker Excel
          workbook into the database.
        </p>
      </div>

      {/* Upload Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Upload Excel Workbook
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Select the Excel workbook and business date. The file
            will be validated and permanently imported into the
            database.
          </p>
        </div>

        {/* Business Date */}
        <div className="mb-6">
          <label
            htmlFor="business-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Business Date
          </label>

          <input
            id="business-date"
            type="date"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
            className="h-11 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Excel File */}
        <div className="mb-6">
          <label
            htmlFor="excel-file"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Excel Workbook
          </label>

          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) =>
              setFile(e.target.files?.[0] ?? null)
            }
            className="block w-full max-w-md cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>

        {/* Selected File */}
        {file && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">
              Selected file
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900">
              {file.name}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload & Import"}
        </button>

        {/* Success Message */}
        {message && (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Import Result */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Import Result
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Details from the latest workbook import.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.status ?? "-"}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Import Batch ID
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.import_batch_id ?? "-"}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Business Date
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.business_date ?? "-"}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rows Parsed
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.rows_parsed ?? 0}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rows Inserted
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.rows_inserted ?? 0}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rows Updated
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.rows_updated ?? 0}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rows Failed
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.rows_failed ?? 0}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rows Rejected
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.rows_rejected ?? 0}
              </strong>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Database Modified
              </span>
              <strong className="mt-2 block text-base text-slate-900">
                {result.database_modified ? "Yes" : "No"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
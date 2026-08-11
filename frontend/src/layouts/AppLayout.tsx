import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "▦" },
  { to: "/leaderboard", label: "Leaderboard", icon: "★" },
  { to: "/advisors", label: "Advisors", icon: "◉" },
  { to: "/products", label: "Products & VAS", icon: "▤" },
  { to: "/nps-voc", label: "NPS & VOC", icon: "♥" },
  { to: "/upload", label: "Data Upload", icon: "↑" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* =========================================================
          DESKTOP SIDEBAR
          ========================================================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Brand */}
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eb0a1e] text-lg font-extrabold text-white shadow-lg shadow-red-100">
              T
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-950">
                TOYOTA
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Service Analytics
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Performance Portal
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl px-3 py-3",
                    "text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-red-50 text-[#eb0a1e] shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-[#eb0a1e] text-white shadow-md shadow-red-100"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>

                    <span>{item.label}</span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#eb0a1e]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom information */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-700">
                Analytics Portal
              </span>
            </div>

            <p className="text-[11px] leading-5 text-slate-400">
              Service Advisor performance monitoring and business intelligence.
            </p>

            <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              2026 Performance
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN AREA
          ========================================================= */}
      <div className="min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#eb0a1e]">
                Toyota Service Analytics
              </div>

              <h1 className="mt-1 text-sm font-bold text-slate-900 sm:text-base">
                Service Advisor Performance Tracker
              </h1>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Portal Status
                </div>

                <div className="mt-1 flex items-center justify-end gap-2 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Connected
                </div>
              </div>

              <div className="h-9 w-px bg-slate-200" />

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Routed page */}
        <main className="min-h-[calc(100vh-73px)] px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* =========================================================
          MOBILE NAVIGATION
          ========================================================= */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-around">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1.5",
                  "text-[10px] font-semibold transition-all",
                  isActive
                    ? "bg-red-50 text-[#eb0a1e]"
                    : "text-slate-400 hover:text-slate-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "text-base",
                      isActive ? "text-[#eb0a1e]" : "text-slate-400",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "▣" },
  { to: "/leaderboard", label: "Leaderboard", icon: "★" },
  { to: "/advisors", label: "Advisors", icon: "◉" },
  { to: "/products", label: "Products & VAS", icon: "◆" },
  { to: "/nps-voc", label: "NPS & VOC", icon: "♥" },
  { to: "/upload", label: "Data Upload", icon: "↑" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-950">

      {/* =========================================================
          DESKTOP SIDEBAR
          ========================================================= */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">

        {/* Toyota Brand */}
        <div className="border-b border-slate-200 px-7 py-7">
          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eb0a1e] text-2xl font-black text-white shadow-lg shadow-red-100">
              T
            </div>

            <div>
              <div className="text-2xl font-black tracking-tight text-slate-950">
                TOYOTA
              </div>

              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#eb0a1e]">
                Service Analytics
              </div>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-5 py-7">

          <div className="mb-4 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            Performance Portal
          </div>

          <nav className="space-y-2">

            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-4 rounded-xl px-4 py-4",
                    "text-[15px] font-bold transition-all duration-200",
                    isActive
                      ? "bg-[#fff1f2] text-[#eb0a1e] shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold transition-all",
                        isActive
                          ? "bg-[#eb0a1e] text-white shadow-md shadow-red-100"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>

                    <span>{item.label}</span>

                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[#eb0a1e]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

          </nav>
        </div>

        {/* Bottom Information */}
        <div className="border-t border-slate-200 p-5">

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="mb-3 flex items-center gap-3">

              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />

              <span className="text-sm font-bold text-slate-800">
                Analytics Portal
              </span>

            </div>

            <p className="text-xs leading-6 text-slate-500">
              Service Advisor performance monitoring and
              business intelligence dashboard.
            </p>

            <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
              2026 Performance
            </div>

          </div>

        </div>

      </aside>

      {/* =========================================================
          MAIN AREA
          ========================================================= */}

      <div className="min-w-0 lg:pl-72">

        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-md sm:px-7 lg:px-10">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#eb0a1e]">
                Toyota Service Analytics
              </div>

              <h1 className="mt-2 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Service Advisor Performance Tracker
              </h1>

            </div>

            {/* Status */}
            <div className="hidden items-center gap-5 sm:flex">

              <div className="text-right">

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Portal Status
                </div>

                <div className="mt-1 flex items-center justify-end gap-2 text-sm font-bold text-emerald-600">

                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />

                  Connected

                </div>

              </div>

              <div className="h-10 w-px bg-slate-200" />

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-md">
                SA
              </div>

            </div>

          </div>

        </header>

        {/* Routed Page */}
        <main className="min-h-[calc(100vh-90px)] px-5 py-7 pb-28 sm:px-7 sm:py-8 lg:px-10 lg:py-10">

          <Outlet />

        </main>

      </div>

      {/* =========================================================
          MOBILE NAVIGATION
          ========================================================= */}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.10)] backdrop-blur-md lg:hidden">

        <div className="mx-auto flex max-w-2xl items-center justify-around">

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex min-w-16 flex-col items-center gap-1.5 rounded-xl px-2 py-2",
                  "text-[11px] font-bold transition-all",
                  isActive
                    ? "bg-[#fff1f2] text-[#eb0a1e]"
                    : "text-slate-400 hover:text-slate-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "text-xl font-bold",
                      isActive
                        ? "text-[#eb0a1e]"
                        : "text-slate-400",
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
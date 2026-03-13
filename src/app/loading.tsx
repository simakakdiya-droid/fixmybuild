export default function DashboardLoading() {
  return (
    <div>
      {/* Page header skeleton */}
      <div
        className="page-header page-header-inner"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <div className="skeleton" style={{ width: "200px", height: "28px", marginBottom: "0.5rem" }} />
          <div className="skeleton" style={{ width: "320px", height: "18px" }} />
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <div className="skeleton" style={{ width: "90px", height: "32px", borderRadius: "7px" }} />
          <div className="skeleton" style={{ width: "120px", height: "32px", borderRadius: "7px" }} />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="stat-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "7px", marginBottom: "0.875rem" }} />
            <div className="skeleton" style={{ width: "60px", height: "32px", marginBottom: "0.375rem" }} />
            <div className="skeleton" style={{ width: "90px", height: "14px" }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["Pipeline", "Stage", "Status", "Severity", "Root Cause", "Confidence", "PR", "Action"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {[180, 80, 70, 80, 200, 90, 70, 90].map((w, j) => (
                  <td key={j}>
                    <div className="skeleton" style={{ width: `${w}px`, height: "16px", maxWidth: "100%" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

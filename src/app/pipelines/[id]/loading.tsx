export default function PipelineDetailLoading() {
  return (
    <>
      {/* Breadcrumb skeleton */}
      <div className="breadcrumb">
        <div className="skeleton" style={{ width: "70px", height: "14px" }} />
        <span className="breadcrumb-sep">›</span>
        <div className="skeleton" style={{ width: "160px", height: "14px" }} />
      </div>

      {/* Main card skeleton */}
      <div className="card">
        <div className="detail-header">
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "140px", height: "12px", marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ width: "260px", height: "24px", marginBottom: "0.375rem" }} />
            <div className="skeleton" style={{ width: "120px", height: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div className="skeleton" style={{ width: "90px", height: "24px", borderRadius: "999px" }} />
            <div className="skeleton" style={{ width: "70px", height: "24px", borderRadius: "999px" }} />
          </div>
        </div>

        {/* Stages skeleton */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="skeleton" style={{ width: "100px", height: "12px", marginBottom: "0.75rem" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div className="skeleton" style={{ width: "100px", height: "32px", borderRadius: "999px" }} />
                {i < 5 && <div style={{ width: "24px", height: "2px", background: "var(--border)", margin: "0 2px" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="detail-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skeleton" style={{ width: "100px", height: "12px", marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: "100%", height: "60px", borderRadius: "7px" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <div className="skeleton" style={{ width: "80px", height: "12px", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ width: "100%", height: "60px", borderRadius: "7px" }} />
            </div>
            <div>
              <div className="skeleton" style={{ width: "70px", height: "12px", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ width: "80px", height: "24px", borderRadius: "999px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Log panel skeleton */}
      <div className="expand-panel">
        <div className="expand-header" style={{ cursor: "default" }}>
          <div className="skeleton" style={{ width: "120px", height: "14px" }} />
        </div>
      </div>

      {/* PR button skeleton */}
      <div style={{ marginTop: "0.5rem" }}>
        <div className="skeleton" style={{ width: "180px", height: "40px", borderRadius: "7px" }} />
      </div>
    </>
  );
}

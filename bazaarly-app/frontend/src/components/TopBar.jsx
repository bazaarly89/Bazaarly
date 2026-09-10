import React from "react";
import { topBarConfig } from "./homepage.config";

export default function TopBar({ config = topBarConfig }) {
  return (
    <div className="topbar">
      <span className="topbar-badge">{config.label}</span>
      <span className="topbar-address">{config.address}</span>
      <svg className="topbar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
      {config.coinBadge != null && (
        <span className="topbar-coin">{config.coinBadge}</span>
      )}
    </div>
  );
}

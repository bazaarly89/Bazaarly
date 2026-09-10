import React, { useState } from "react";
import Icon from "./Icon";
import { bottomNavConfig } from "./homepage.config";

export default function BottomNav({ tabs = bottomNavConfig }) {
  const [active, setActive] = useState(0);
  return (
    <div className="bottomnav">
      {tabs.map((t, i) => (
        <a
          key={t.label}
          href={t.link}
          className={`bottomnav-item ${i === active ? "active" : ""}`}
          onClick={() => setActive(i)}
        >
          <span className="bottomnav-icon-wrap">
            <Icon name={t.icon} size={22} />
            {t.badge != null && <span className="bottomnav-badge">{t.badge}</span>}
          </span>
          <span className="bottomnav-label">{t.label}</span>
        </a>
      ))}
    </div>
  );
}

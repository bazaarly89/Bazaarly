import React, { useState } from "react";
import Icon from "./Icon";
import { categoryNavConfig } from "./homepage.config";

export default function CategoryNav({ items = categoryNavConfig }) {
  const [active, setActive] = useState(0);
  return (
    <div className="catnav">
      {items.map((c, i) => (
        <a
          key={c.label}
          href={c.link}
          className={`catnav-item ${i === active ? "active" : ""}`}
          onClick={() => setActive(i)}
        >
          <span className="catnav-icon">
            <Icon name={c.icon} />
          </span>
          <span className="catnav-label">{c.label}</span>
        </a>
      ))}
    </div>
  );
}

import React from "react";
import { suggestedForYouConfig } from "./homepage.config";

export default function SuggestedForYou({ config = suggestedForYouConfig, customerName }) {
  const name = customerName || config.defaultName;
  const greeting = config.greetingTemplate.replace("{name}", name);

  return (
    <div className="suggested">
      <h3 className="suggested-title">{greeting}</h3>
      <div className="suggested-row">
        {config.items.map((item, i) => (
          <a className="suggested-card" href={item.link} key={i}>
            <img src={item.image} alt={item.title} />
            <span className="suggested-name">{item.title}</span>
            <span className="suggested-cta">View Store</span>
          </a>
        ))}
      </div>
    </div>
  );
}

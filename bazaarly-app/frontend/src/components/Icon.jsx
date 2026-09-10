import React from "react";

/**
 * Lightweight inline icon set — no external icon library required.
 * Add more icons here if you add new categories/tabs that need them;
 * everything else (labels, links, order) still comes from the config files.
 */
const paths = {
  bag: "M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  shirt: "M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-4L8 4Z",
  mobile: "M7 3h10v18H7V3Zm3 15h4",
  laptop: "M4 5h16v10H4V5Zm-1 12h18l-2 3H5l-2-3Z",
  beauty: "M9 3h6v4l2 2v12H7V9l2-2V3Z",
  home: "m4 11 8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  play: "M6 4l14 8-14 8V4Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  cart: "M4 4h2l2 11h10l2-8H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
};

export default function Icon({ name, size = 22, color = "currentColor" }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

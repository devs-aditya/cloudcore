"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();

 useEffect(() => {
  console.log("Current page:", pathname);
}, [pathname]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {!collapsed && <h2>CloudCore</h2>}

      {!collapsed && (
        <button className="new-button">
          + New
        </button>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 rounded-md border px-3 py-2"
      >
        {collapsed ? "→" : "←"}
      </button>

      {!collapsed && (
        <nav className="sidebar-nav">
          <Link
            href="/"
            className={`sidebar-link ${
              pathname === "/" ? "active" : ""
            }`}
          >
            🏠 My Drive
          </Link>

          <Link
            href="/recent"
            className={`sidebar-link ${
              pathname === "/recent" ? "active" : ""
            }`}
          >
            🕐 Recent
          </Link>

          <Link
            href="/starred"
            className={`sidebar-link ${
              pathname === "/starred" ? "active" : ""
            }`}
          >
            ⭐ Starred
          </Link>

          <Link
            href="/trash"
            className={`sidebar-link ${
              pathname === "/trash" ? "active" : ""
            }`}
          >
            🗑 Trash
          </Link>
        </nav>
      )}
    </aside>
  );
}
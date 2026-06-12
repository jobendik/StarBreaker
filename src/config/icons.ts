// Inline SVG icons used by the upgrade cards, shop, and menus.

const S = "#9af2ff";

export const ICONS: Record<string, string> = {
  pulse: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7l7 5-7 5M11 7l7 5-7 5"/></svg>`,
  orbital: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-22 12 12)"/></svg>`,
  spread: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.8" stroke-linecap="round"><path d="M12 21L6 5M12 21l6-16M12 21V8"/></svg>`,
  missile: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M14 4c3 0 6 3 6 6l-7 7-3-3z"/><path d="M7 17l-2.5 2.5M10.5 14l-4 4"/></svg>`,
  nova: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" opacity=".7"/><circle cx="12" cy="12" r="10.5" opacity=".4"/></svg>`,
  railgun: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.8" stroke-linecap="round"><path d="M3 12h18M6 8.5h10M6 15.5h10"/><circle cx="20" cy="12" r="1.6" fill="${S}"/></svg>`,
  tesla: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14l4-3 3 2 4-5 3 2 2-3"/><path d="M13 3L5 14h6l-2 7 8-11h-6z" opacity=".45"/></svg>`,
  glaive: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2c4 3 8 7 8 12-5 0-9-2-12-6 2 6 6 10 12 10-7 3-14-1-16-8C3 6 7 3 12 2z"/></svg>`,
  power: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l2.4 6.3L21 12l-6.6 2.7L12 21l-2.4-6.3L3 12l6.6-2.7z"/></svg>`,
  haste: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M13 3L5 14h6l-2 7 8-11h-6z"/></svg>`,
  speed: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l6 5-6 5M11 7l6 5-6 5"/></svg>`,
  hp: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M12 9v6M9 12h6"/></svg>`,
  magnet: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linecap="round"><path d="M6 4v7a6 6 0 0012 0V4M6 4h3M15 4h3M6 9h3M15 9h3"/></svg>`,
  regen: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linecap="round"><path d="M12 8v8M8 12h8"/><path d="M5 12a7 7 0 0110-6.3"/></svg>`,
  greed: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 9-8 9-8-9z"/><path d="M9 12h6"/></svg>`,
  armor: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>`,
  crit: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/></svg>`,
  heal: `<svg viewBox="0 0 24 24" fill="none" stroke="#7cfc8a" stroke-width="1.8" stroke-linecap="round"><path d="M12 6v12M6 12h12"/><circle cx="12" cy="12" r="9" opacity=".5"/></svg>`,
  bomb: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffb24a" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="14" r="7"/><path d="M15 9l3-3M18 6l1.4-1.4M18 6l1 1M18 6l-1-1"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffcf4a" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 9-8 9-8-9z"/></svg>`,
  ship: `<svg viewBox="0 0 24 24" fill="none" stroke="${S}" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l7 16-7-4-7 4z"/></svg>`,
  cargo: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffcf4a" stroke-width="1.7" stroke-linejoin="round"><path d="M4 9l8-5 8 5v8l-8 5-8-5z"/><path d="M4 9l8 5 8-5M12 14v8"/></svg>`,
};

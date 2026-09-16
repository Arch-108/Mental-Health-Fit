// Small, consistent stroke-icon set (Feather/Lucide-style) used across the
// app in place of emoji - emoji render inconsistently across OSes/fonts and
// read as a hobby project rather than a clinical product. Every icon shares
// the same viewBox/stroke conventions so they sit together cleanly at any
// size, and all use currentColor so they inherit whatever text color their
// container sets (including dark mode, no extra work needed).
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconMenu({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function IconClose({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function IconBell({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function IconMoon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconSun({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="4.2" y1="4.2" x2="6" y2="6" />
      <line x1="18" y1="18" x2="19.8" y2="19.8" />
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="4.2" y1="19.8" x2="6" y2="18" />
      <line x1="18" y1="6" x2="19.8" y2="4.2" />
    </svg>
  );
}

export function IconChat({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4Z" />
      <line x1="8" y1="9.5" x2="16" y2="9.5" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  );
}

export function IconAccessibility({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <circle cx="12" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M5 8.5h14" />
      <path d="M12 8.5v5.5" />
      <path d="M12 14 8 20" />
      <path d="M12 14l4 6" />
      <path d="M8.5 11.5h7" />
    </svg>
  );
}

export function IconChevronDown({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconArrowUp({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  );
}

export function IconArrowDown({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="6 13 12 19 18 13" />
    </svg>
  );
}

export function IconArrowRight({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export function IconLogout({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
      <polyline points="15 16 20 11 15 6" />
      <line x1="20" y1="11" x2="9" y2="11" />
    </svg>
  );
}

export function IconPulse({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <polyline points="3 12 8 12 10.5 6 13.5 18 16 12 21 12" />
    </svg>
  );
}

export function IconMapPin({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function IconUsers({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9" />
      <path d="M21 20c0-2.8-2-5.1-4.6-5.8" />
    </svg>
  );
}

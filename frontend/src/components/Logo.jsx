// Brand mark: a navy rounded-square badge with a gold pulse/heartbeat line -
// reads at favicon size and scales cleanly up to the auth hero. Built as
// inline SVG (not an image asset) so it stays crisp at any size and can be
// recolored via props without shipping a second file.
export default function LogoMark({ size = 28, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" {...props}>
      <rect width="40" height="40" rx="12" fill="#1B3A63" />
      <path
        d="M7 21.5h4.6l2.6-8.5 4.6 15.5 2.7-13 2.1 6h6.4"
        stroke="#E8A83C"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 28, wordmark = true, dark = false, style, ...props }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', ...style }} {...props}>
      <LogoMark size={size} />
      {wordmark && (
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: size * 0.46 + 'px',
            letterSpacing: '-0.02em',
            color: dark ? 'white' : 'var(--color-primary)',
          }}
        >
          Forever Fit
        </span>
      )}
    </span>
  );
}

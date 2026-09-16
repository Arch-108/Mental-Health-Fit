// Reusable photo header for content pages - same navy-scrim-over-photo
// treatment as the auth hero, so pages that deserve a bit of warmth (Find
// Doctors, Maternal Care, Crisis Support) share one consistent pattern
// instead of every page inventing its own banner.
export default function PageBanner({ image, title, subtitle }) {
  return (
    <div className="page-banner" style={{ backgroundImage: `linear-gradient(100deg, rgba(15,24,38,0.88) 0%, rgba(27,58,99,0.62) 55%, rgba(27,58,99,0.25) 100%), url('${image}')` }}>
      <div className="page-banner-inner">
        <h1 style={{ color: 'white', margin: subtitle ? '0 0 0.35rem' : 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, maxWidth: 560 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

import { useTheme } from '../context/ThemeContext';
import { IconMoon, IconSun } from './Icons';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="theme-toggle-btn"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <IconMoon size={17} /> : <IconSun size={17} />}
    </button>
  );
}

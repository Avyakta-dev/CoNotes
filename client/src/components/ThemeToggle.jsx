import { RiToggleLine, RiToggleFill } from 'react-icons/ri';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="flex items-center justify-center text-ink dark:text-cream hover:text-turquoise transition-colors"
    >
      {isDark ? (
        <RiToggleFill className="w-8 h-8 text-turquoise" />
      ) : (
        <RiToggleLine className="w-8 h-8" />
      )}
    </button>
  );
}
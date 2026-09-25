import { UserRound } from 'lucide-react';

const SIZES = { sm: 28, md: 40, lg: 64 };

// Each pair maintains readable contrast while keeping the soft badge treatment
// used by the existing profile avatar.
const PALETTE = [
  { background: '#e0f2fe', color: '#0369a1' },
  { background: '#e0e7ff', color: '#4338ca' },
  { background: '#f3e8ff', color: '#7e22ce' },
  { background: '#fce7f3', color: '#be185d' },
  { background: '#ffedd5', color: '#c2410c' },
  { background: '#fef3c7', color: '#a16207' },
  { background: '#dcfce7', color: '#15803d' },
  { background: '#ccfbf1', color: '#0f766e' },
  { background: '#e2e8f0', color: '#475569' }
];

const hashName = (name) => [...name].reduce(
  (hash, character) => ((hash * 31) + character.charCodeAt(0)) | 0,
  0
);

const getInitials = (name) => {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

/** A deterministic, offline placeholder avatar for people without photos. */
const Avatar = ({ name, size = 'md', className = '' }) => {
  const pixels = SIZES[size] || SIZES.md;
  const cleanName = String(name || '').trim();
  const initials = getInitials(cleanName);
  const colors = PALETTE[Math.abs(hashName(cleanName || 'person')) % PALETTE.length];

  return (
    <span
      className={`avatar ${className}`.trim()}
      role="img"
      aria-label={cleanName ? `${cleanName} avatar` : 'Person avatar'}
      style={{
        width: pixels,
        height: pixels,
        minWidth: pixels,
        background: colors.background,
        color: colors.color,
        fontSize: pixels >= SIZES.lg ? '20px' : pixels >= SIZES.md ? '14px' : '11px'
      }}
    >
      {initials || <UserRound size={Math.round(pixels * 0.52)} aria-hidden="true" />}
    </span>
  );
};

export default Avatar;

import React from 'react';

export interface KeyBadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary';
  className?: string;
}

export const KeyBadge: React.FC<KeyBadgeProps> = ({
  children,
  variant = 'secondary',
  className = '',
}) => {
  return (
    <kbd className={`btn-kbd btn-kbd-${variant} ${className}`}>
      {children}
    </kbd>
  );
};

export const EnterKeyBadge: React.FC<{
  variant?: 'primary' | 'danger' | 'secondary';
  className?: string;
}> = ({ variant = 'primary', className = '' }) => (
  <kbd className={`btn-kbd btn-kbd-${variant} ${className}`} aria-label="Enter">
    <svg className="btn-kbd-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 4v7a3 3 0 0 1-3 3H4m0 0l5-5m-5 5l5 5"
      />
    </svg>
  </kbd>
);

export const EscKeyBadge: React.FC<{
  variant?: 'primary' | 'danger' | 'secondary';
  className?: string;
}> = ({ variant = 'secondary', className = '' }) => (
  <kbd className={`btn-kbd btn-kbd-${variant} ${className}`} aria-label="Escape">
    Esc
  </kbd>
);

export default KeyBadge;

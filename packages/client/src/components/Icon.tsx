import Utils from '../utils';
import { useTheme } from '../contexts/ThemeProvider';
import { THEME } from '@excalidraw/excalidraw';

type AvailableIcons = 'archive' | 'close' | 'plus' | 'share' | 'copy';

interface IconComponentProps {
  className?: string;
}

const Archive = ({ className }: IconComponentProps) => {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(3 3)"
      >
        <path d="m.5.5h14v3h-14z" />
        <path d="m2.5 3.5v9c0 1.1045695.8954305 2 2 2h6c1.1045695 0 2-.8954305 2-2v-9" />
        <path d="m5.5 6.5h4" />
      </g>
    </svg>
  );
};

const Close = ({ className }: IconComponentProps) => {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7.5 7.5 6 6" />
        <path d="m13.5 7.5-6 6" />
      </g>
    </svg>
  );
};

const Share = ({ className }: IconComponentProps) => {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(3 3)"
      >
        <circle cx="3" cy="7.5" r="2.5" />
        <circle cx="12" cy="2.5" r="2.5" />
        <circle cx="12" cy="12.5" r="2.5" />
        <path d="m5.5 6.5 4-3" />
        <path d="m5.5 8.5 4 3" />
      </g>
    </svg>
  );
};

const Copy = ({ className }: IconComponentProps) => {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m14.5 13.5v-8a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2z" />
        <path d="m7.5 5.5h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
      </g>
    </svg>
  );
};

const Plus = ({ className }: IconComponentProps) => {
  return (
    <svg
      height="21"
      viewBox="0 0 21 21"
      width="21"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5.5 10.5h10" />
        <path d="m10.5 5.5v10" />
      </g>
    </svg>
  );
};

interface IconProps {
  name: AvailableIcons;
  className?: string;
}

const Icon = ({ name, className }: IconProps) => {
  const { theme } = useTheme();

  const iconClassName = `${className || ''} ${
    theme === THEME.LIGHT ? 'text-gray-800' : 'text-gray-200'
  }`;

  switch (name) {
    case 'archive':
      return <Archive className={iconClassName} />;
    case 'close':
      return <Close className={iconClassName} />;
    case 'plus':
      return <Plus className={iconClassName} />;
    case 'share':
      return <Share className={iconClassName} />;
    case 'copy':
      return <Copy className={iconClassName} />;
    default:
      return Utils.exhaustiveMatchingGuard(name);
  }
};

export default Icon;

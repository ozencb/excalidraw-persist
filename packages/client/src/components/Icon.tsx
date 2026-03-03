import Utils from '../utils';
import { useTheme } from '../contexts/ThemeProvider';
import { THEME } from '@excalidraw/excalidraw';

type AvailableIcons = 'archive' | 'close' | 'plus';

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
    default:
      return Utils.exhaustiveMatchingGuard(name);
  }
};

export default Icon;

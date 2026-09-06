import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Base>
);

export const IconList = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </Base>
);

export const IconSheet = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M9 9v11" />
  </Base>
);

export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14A8.5 8.5 0 1 1 10 4a7 7 0 0 0 10 10z" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p} strokeWidth={2.2}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const IconChevron = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const IconLightbulb = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a6 6 0 0 0-3.5 10.9c.5.4.8 1 .9 1.6l.1.5h5l.1-.5c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 2z" />
  </Base>
);

export const IconKey = (p: IconProps) => (
  <Base {...p}>
    <circle cx="7.5" cy="15.5" r="3.5" />
    <path d="M10 13 20 3M17 6l2.5 2.5M14.5 8.5 17 11" />
  </Base>
);

export const IconRedo = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Base>
);

/** Two side panels either side of a page, for the focus-mode toggle. */
export const IconPanels = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M8 4v16M16 4v16" />
  </Base>
);

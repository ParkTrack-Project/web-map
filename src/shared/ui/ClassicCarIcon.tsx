import type { SVGProps } from 'react';

interface ClassicCarIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Filled Material-style front view, used for the primary parking action. */
export function ClassicCarIcon({ size = 24, ...props }: ClassicCarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M18.92 6.01A1.51 1.51 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99ZM6.5 16A1.5 1.5 0 1 1 6.5 13a1.5 1.5 0 0 1 0 3Zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM5 11l1.5-4.5h11L19 11H5Z" />
    </svg>
  );
}

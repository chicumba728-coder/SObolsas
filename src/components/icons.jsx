import React from 'react';

function Icon({ size = 18, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
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

export function ArrowRight(props) {
  return <Icon {...props}><path d="M5 12h13.5" /><path d="m13 6.5 5.5 5.5L13 17.5" /></Icon>;
}

export function ArrowLeft(props) {
  return <Icon {...props}><path d="M19 12H5.5" /><path d="m11 6.5L5.5 12 11 17.5" /></Icon>;
}

export function ArrowUpRight(props) {
  return <Icon {...props}><path d="M7 17 17 7" /><path d="M8.5 7H17v8.5" /></Icon>;
}

export function ChevronDown(props) {
  return <Icon {...props}><path d="m6.5 9.5 5.5 5 5.5-5" /></Icon>;
}

export function Plus(props) {
  return <Icon {...props}><path d="M12 5.5v13" /><path d="M5.5 12h13" /></Icon>;
}

export function Close(props) {
  return <Icon {...props}><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></Icon>;
}

export function Search(props) {
  return <Icon {...props}><circle cx="11" cy="11" r="6.25" /><path d="m15.8 15.8 3.7 3.7" /></Icon>;
}

export function Alert(props) {
  return <Icon {...props}><path d="M12 4.5 3.2 19.5h17.6L12 4.5Z" /><path d="M12 10v4.2" /><path d="M12 17.2h.01" /></Icon>;
}

export function Info(props) {
  return <Icon {...props}><circle cx="12" cy="12" r="7.75" /><path d="M12 11v5.2" /><path d="M12 7.8h.01" /></Icon>;
}

export function Compass(props) {
  return <Icon {...props}><circle cx="12" cy="12" r="8" /><path d="m15.2 8.8-1.7 4.5-4.7 1.9 1.7-4.5 4.7-1.9Z" /></Icon>;
}

export function Lock(props) {
  return <Icon {...props}><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Icon>;
}

export function Eye(props) {
  return <Icon {...props}><path d="M2.8 12S6 6.2 12 6.2 21.2 12 21.2 12 18 17.8 12 17.8 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="3" /></Icon>;
}

export function EyeOff(props) {
  return <Icon {...props}><path d="M4 4.5 20 19.5" /><path d="M9.6 9.7A3 3 0 0 0 12 15c.9 0 1.7-.4 2.3-1" /><path d="M6.4 6.9C4.2 8.4 2.8 12 2.8 12s3.2 5.8 9.2 5.8c1.5 0 2.8-.4 4-1" /><path d="M10 6.5c.6-.2 1.3-.3 2-.3 6 0 9.2 5.8 9.2 5.8a17 17 0 0 1-2.2 3" /></Icon>;
}


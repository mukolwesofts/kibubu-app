function IconBase({
  size = 18,
  strokeWidth = 1.8,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function PencilIcon({ size }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </IconBase>
  );
}

export function TrashIcon({ size }: { size?: number }) {
  return (
    <IconBase size={size}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </IconBase>
  );
}

export function PlusIcon({ size }: { size?: number }) {
  return (
    <IconBase size={size} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

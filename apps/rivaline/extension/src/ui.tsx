/** Small building blocks of the Rivaline panel. More come with the panel shell in step 3. */
const ICON = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof ICON;

export function Icon({
  name,
  size = 12,
  stroke = 3,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON[name]}
    </svg>
  );
}

/** The action's real shortcut as keycaps ("Alt", "Shift", "V"). */
export function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="keys">
      {keys.map((k) => (
        <kbd key={k} className="mono">
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function Avatar({
  name,
  hue,
  size = 40,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-fg"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 42% 38%)`,
      }}
    >
      {letter}
    </span>
  );
}

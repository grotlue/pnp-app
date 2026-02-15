import { cn } from "@/lib/utils/cn";

type StatusBadgeTone =
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "violet"
  | "teal";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
};

const toneClassMap: Record<StatusBadgeTone, string> = {
  slate: "border-slate-300/70 bg-slate-100 text-slate-700",
  blue: "border-sky-300/70 bg-sky-100 text-sky-700",
  green: "border-emerald-300/70 bg-emerald-100 text-emerald-700",
  amber: "border-amber-300/70 bg-amber-100 text-amber-800",
  violet: "border-violet-300/70 bg-violet-100 text-violet-700",
  teal: "border-teal-300/70 bg-teal-100 text-teal-700",
};

export function StatusBadge({ label, tone = "slate", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        toneClassMap[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

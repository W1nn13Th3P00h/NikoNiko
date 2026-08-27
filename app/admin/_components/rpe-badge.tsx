import { Badge } from "@/components/ui/badge";

// RPE 1-10 -> a rough traffic-light read, purely visual (not a business rule).
function rpeColorClass(rpe: number): string {
  if (rpe <= 3) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (rpe <= 6) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  if (rpe <= 8) return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
}

export function RpeBadge({ rpe }: { rpe: number | null }) {
  if (rpe === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        —
      </Badge>
    );
  }

  return <Badge className={rpeColorClass(rpe)}>RPE {rpe}</Badge>;
}

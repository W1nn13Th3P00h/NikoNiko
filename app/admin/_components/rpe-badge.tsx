import { Badge } from "@/components/ui/badge";
import { rpeColor, rpeTextColor } from "@/lib/zone-colors";

export function RpeBadge({ rpe }: { rpe: number | null }) {
  if (rpe === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        —
      </Badge>
    );
  }

  return (
    <Badge style={{ backgroundColor: rpeColor(rpe), color: rpeTextColor(rpe) }}>RPE {rpe}</Badge>
  );
}

import type { ProfileSegment } from "@/lib/profile-bar";

export function ProfileBar({
  segments,
  height = 20,
}: {
  segments: ProfileSegment[];
  height?: number;
}) {
  if (segments.length === 0) return null;

  return (
    <div className="flex gap-[2px]" style={{ height }}>
      {segments.map((s, i) => (
        <div
          key={i}
          className="rounded-[2px]"
          style={{ flexGrow: s.weightSeconds, backgroundColor: s.color }}
        />
      ))}
    </div>
  );
}

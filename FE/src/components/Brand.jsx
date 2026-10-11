import { cn } from "@/lib/utils";

export default function Brand({ className }) {
  return (
    <div className={cn("brand", className)}>
      <span className="brand-wordmark">DENSO</span>
      <span className="brand-caption">MEETING-TO-SHOPFLOOR</span>
    </div>
  );
}

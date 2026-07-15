import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadChartPng, downloadChartSvg } from "@/lib/chart-export";
import { ImageDown } from "lucide-react";
import { toast } from "sonner";

// Wraps a recharts chart and offers PNG/SVG figure download on hover —
// PNG at 3x for print, SVG as a true vector for papers.
export function ExportableChart({
  filename,
  children,
}: {
  filename: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handle = async (kind: "png" | "svg") => {
    if (!ref.current) return;
    try {
      if (kind === "png") await downloadChartPng(ref.current, filename);
      else downloadChartSvg(ref.current, filename);
    } catch {
      toast.error("Failed to export chart");
    }
  };

  return (
    <div ref={ref} className="group/chart relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Download ${filename} chart`}
            className="absolute right-1 top-1 z-10 h-7 w-7 p-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/chart:opacity-100"
          >
            <ImageDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handle("png")}>
            Download PNG (3x)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handle("svg")}>
            Download SVG (vector)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {children}
    </div>
  );
}

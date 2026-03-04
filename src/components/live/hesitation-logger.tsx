import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PauseCircle } from "lucide-react";

interface HesitationLoggerProps {
  count: number;
  onLog: () => void;
}

export function HesitationLogger({ count, onLog }: HesitationLoggerProps) {
  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Hesitations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onLog}
            className="min-h-[48px] flex-1"
          >
            <PauseCircle className="mr-2 h-5 w-5" />
            Log Hesitation
          </Button>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {count}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

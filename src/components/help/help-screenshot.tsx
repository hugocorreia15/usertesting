import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HelpScreenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  // Screenshots are captured in a separate pass; hide broken frames
  // until the image exists so the page never shows broken-image icons.
  if (missing) return null;

  return (
    <>
      <figure className="my-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full overflow-hidden rounded-md border transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Open screenshot: ${alt}`}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setMissing(true)}
            className="w-full cursor-zoom-in object-cover"
          />
        </button>
        {caption && (
          <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl p-2 sm:p-4"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{alt}</DialogTitle>
          </DialogHeader>
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] w-full rounded-md object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

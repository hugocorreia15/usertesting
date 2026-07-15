import { useLang, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// EN/PT switcher for participant-facing pages.
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language / Idioma"
      className={cn(
        "inline-flex overflow-hidden rounded-md border text-xs",
        className,
      )}
    >
      {(["en", "pt"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "px-2.5 py-1 font-medium uppercase transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

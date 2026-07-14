import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// media_url stores a bucket-relative path (migration 032). Legacy rows
// and any not-yet-migrated environments may still hold full public URLs;
// normalize both to a path before signing.
export function toMediaPath(value: string): string {
  const marker = "/object/public/session-media/";
  const i = value.indexOf(marker);
  return i >= 0 ? value.slice(i + marker.length) : value;
}

const SIGN_TTL_SECONDS = 3600;

export function useSignedMediaUrl(value: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-media", value],
    enabled: !!value,
    // refresh well before the signature expires
    staleTime: (SIGN_TTL_SECONDS - 600) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("session-media")
        .createSignedUrl(toMediaPath(value!), SIGN_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function SignedAudio({ value, className }: { value: string; className?: string }) {
  const { data: url } = useSignedMediaUrl(value);
  if (!url) return <p className="text-xs text-muted-foreground">Loading audio…</p>;
  return <audio src={url} controls className={className} />;
}

export function SignedVideo({ value, className }: { value: string; className?: string }) {
  const { data: url } = useSignedMediaUrl(value);
  if (!url) return <p className="text-xs text-muted-foreground">Loading video…</p>;
  return <video src={url} controls className={className} />;
}

export function SignedImage({
  value,
  alt,
  className,
  onClick,
}: {
  value: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const { data: url } = useSignedMediaUrl(value);
  if (!url) return <p className="text-xs text-muted-foreground">Loading photo…</p>;
  return <img src={url} alt={alt} className={className} onClick={onClick} />;
}

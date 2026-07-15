import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useLang, format } from "@/lib/i18n";
import {
  SignedAudio,
  SignedVideo,
  SignedImage,
} from "@/components/media/signed-media";

interface MediaCaptureProps {
  type: "audio" | "video" | "photo";
  value: string | null;
  onChange: (url: string | null) => void;
  storagePath: string;
}

// Upload guards: photos are compressed client-side (below), so the 5 MB cap
// is practically unreachable; audio/video caps pair with the recording
// duration limits to keep session media within Storage-friendly sizes.
const PHOTO_MAX_MB = 5;
const AUDIO_MAX_MB = 20;
const VIDEO_MAX_MB = 50;
const PHOTO_MAX_BYTES = PHOTO_MAX_MB * 1024 * 1024;
const AUDIO_MAX_BYTES = AUDIO_MAX_MB * 1024 * 1024;
const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;

// Auto-stop recordings so blobs stay bounded.
const AUDIO_MAX_RECORD_MS = 3 * 60 * 1000;
const VIDEO_MAX_RECORD_MS = 2 * 60 * 1000;

// Photo compression targets.
const PHOTO_MAX_EDGE_PX = 1600;
const PHOTO_JPEG_QUALITY = 0.8;
const PHOTO_SKIP_MAX_BYTES = 500 * 1024;

const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export function MediaCapture({ type, value, onChange, storagePath }: MediaCaptureProps) {
  if (type === "audio") return <AudioRecorder value={value} onChange={onChange} storagePath={storagePath} />;
  if (type === "video") return <VideoRecorder value={value} onChange={onChange} storagePath={storagePath} />;
  return <PhotoCapture value={value} onChange={onChange} storagePath={storagePath} />;
}

// The bucket is private (migration 032): store the bucket-relative path
// and let render sites mint short-lived signed URLs.
async function uploadMedia(blob: Blob, path: string, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from("session-media")
    .upload(path, blob, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

// Decode fallback for browsers without createImageBitmap (or without
// EXIF-aware decoding). Revoking after load is safe: the pixels are
// already decoded.
async function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Downscale to a longest edge of PHOTO_MAX_EDGE_PX and re-encode as
// JPEG (quality 0.8) via an offscreen canvas. Skips recompression only
// when the source is already a small-enough JPEG. Orientation is
// preserved: createImageBitmap applies EXIF orientation ("from-image"),
// and the <img> fallback lets the browser do the same on draw.
async function compressPhoto(blob: Blob): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  if (typeof createImageBitmap === "function") {
    try {
      source = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      source = await loadImageElement(blob);
    }
  } else {
    source = await loadImageElement(blob);
  }

  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const longestEdge = Math.max(width, height);

  if (
    blob.type === "image/jpeg" &&
    longestEdge <= PHOTO_MAX_EDGE_PX &&
    blob.size <= PHOTO_SKIP_MAX_BYTES
  ) {
    if (source instanceof ImageBitmap) source.close();
    return blob;
  }

  const scale = Math.min(1, PHOTO_MAX_EDGE_PX / longestEdge);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (source instanceof ImageBitmap) source.close();

  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY),
  );
  if (!out) throw new Error("Photo compression failed");
  return out;
}

function AudioRecorder({
  value,
  onChange,
  storagePath,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  storagePath: string;
}) {
  const { dict } = useLang();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopTimer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (stopTimer.current !== null) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunks.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      if (blob.size > AUDIO_MAX_BYTES) {
        toast.error(
          format(dict.media.audioTooLarge, { size: mb(blob.size), max: AUDIO_MAX_MB }),
        );
        return;
      }
      setUploading(true);
      try {
        const url = await uploadMedia(blob, `${storagePath}.webm`, "audio/webm");
        onChange(url);
      } finally {
        setUploading(false);
      }
    };
    mediaRecorder.current = recorder;
    recorder.start();
    setRecording(true);
    stopTimer.current = window.setTimeout(stop, AUDIO_MAX_RECORD_MS);
  }, [storagePath, onChange, dict, stop]);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2">
          <SignedAudio value={value} className="flex-1 h-10" />
          <Button variant="ghost" size="icon" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant={recording ? "destructive" : "outline"}
            size="sm"
            onClick={recording ? stop : start}
            disabled={uploading}
          >
            {uploading ? (
              "Uploading..."
            ) : recording ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Record Audio
              </>
            )}
          </Button>
          {!uploading && (
            <p className="text-xs text-muted-foreground">{dict.media.audioLimitNote}</p>
          )}
        </>
      )}
    </div>
  );
}

function VideoRecorder({
  value,
  onChange,
  storagePath,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  storagePath: string;
}) {
  const { dict } = useLang();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimer = useRef<number | null>(null);

  const startPreview = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    setPreviewing(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (stopTimer.current !== null) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    if (mediaRecorder.current?.state === "recording") mediaRecorder.current.stop();
    setRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    chunks.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setPreviewing(false);
      const blob = new Blob(chunks.current, { type: "video/webm" });
      if (blob.size > VIDEO_MAX_BYTES) {
        toast.error(
          format(dict.media.videoTooLarge, { size: mb(blob.size), max: VIDEO_MAX_MB }),
        );
        return;
      }
      setUploading(true);
      try {
        const url = await uploadMedia(blob, `${storagePath}.webm`, "video/webm");
        onChange(url);
      } finally {
        setUploading(false);
      }
    };
    mediaRecorder.current = recorder;
    recorder.start();
    setRecording(true);
    stopTimer.current = window.setTimeout(stopRecording, VIDEO_MAX_RECORD_MS);
  }, [storagePath, onChange, dict, stopRecording]);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <SignedVideo value={value} className="w-full max-h-48 rounded-md bg-black" />
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full max-h-48 rounded-md bg-black ${previewing ? "" : "hidden"}`}
          />
          <div className="flex gap-2">
            {!previewing && !uploading && (
              <Button type="button" variant="outline" size="sm" onClick={startPreview}>
                <Video className="mr-2 h-4 w-4" />
                Open Camera
              </Button>
            )}
            {previewing && !recording && (
              <Button type="button" variant="outline" size="sm" onClick={startRecording}>
                <Video className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}
            {recording && (
              <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                <VideoOff className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            )}
            {uploading && (
              <Button type="button" variant="outline" size="sm" disabled>
                Uploading...
              </Button>
            )}
          </div>
          {!uploading && (
            <p className="text-xs text-muted-foreground">{dict.media.videoLimitNote}</p>
          )}
        </>
      )}
    </div>
  );
}

function PhotoCapture({
  value,
  onChange,
  storagePath,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  storagePath: string;
}) {
  const { dict } = useLang();
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    setPreviewing(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPreviewing(false);

    const raw = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85),
    );
    let blob: Blob;
    try {
      blob = await compressPhoto(raw);
    } catch {
      blob = raw; // decode/encode failed: fall back to the uncompressed capture
    }
    if (blob.size > PHOTO_MAX_BYTES) {
      toast.error(
        format(dict.media.photoTooLarge, { size: mb(blob.size), max: PHOTO_MAX_MB }),
      );
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMedia(blob, `${storagePath}.jpg`, "image/jpeg");
      onChange(url);
    } finally {
      setUploading(false);
    }
  }, [storagePath, onChange, dict]);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <SignedImage value={value} alt="Captured" className="w-full max-h-48 rounded-md object-cover" />
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full max-h-48 rounded-md bg-black ${previewing ? "" : "hidden"}`}
          />
          <div className="flex gap-2">
            {!previewing && !uploading && (
              <Button type="button" variant="outline" size="sm" onClick={startPreview}>
                <Camera className="mr-2 h-4 w-4" />
                Open Camera
              </Button>
            )}
            {previewing && (
              <Button type="button" variant="outline" size="sm" onClick={capture}>
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            )}
            {uploading && (
              <Button type="button" variant="outline" size="sm" disabled>
                Uploading...
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

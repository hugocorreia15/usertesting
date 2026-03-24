import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Camera, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MediaCaptureProps {
  type: "audio" | "video" | "photo";
  value: string | null;
  onChange: (url: string | null) => void;
  storagePath: string;
}

export function MediaCapture({ type, value, onChange, storagePath }: MediaCaptureProps) {
  if (type === "audio") return <AudioRecorder value={value} onChange={onChange} storagePath={storagePath} />;
  if (type === "video") return <VideoRecorder value={value} onChange={onChange} storagePath={storagePath} />;
  return <PhotoCapture value={value} onChange={onChange} storagePath={storagePath} />;
}

async function uploadMedia(blob: Blob, path: string, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from("session-media")
    .upload(path, blob, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("session-media").getPublicUrl(path);
  return data.publicUrl;
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
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

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
  }, [storagePath, onChange]);

  const stop = useCallback(() => {
    mediaRecorder.current?.stop();
    setRecording(false);
  }, []);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-2">
          <audio src={value} controls className="flex-1 h-10" />
          <Button variant="ghost" size="icon" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
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
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    setPreviewing(true);
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
  }, [storagePath, onChange]);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setRecording(false);
  }, []);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <video src={value} controls className="w-full max-h-48 rounded-md bg-black" />
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : (
        <>
          {previewing && (
            <video
              ref={videoRef}
              muted
              className="w-full max-h-48 rounded-md bg-black"
            />
          )}
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
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    setPreviewing(true);
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPreviewing(false);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85),
    );
    setUploading(true);
    try {
      const url = await uploadMedia(blob, `${storagePath}.jpg`, "image/jpeg");
      onChange(url);
    } finally {
      setUploading(false);
    }
  }, [storagePath, onChange]);

  const remove = () => onChange(null);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <img src={value} alt="Captured" className="w-full max-h-48 rounded-md object-cover" />
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : (
        <>
          {previewing && (
            <video
              ref={videoRef}
              muted
              className="w-full max-h-48 rounded-md bg-black"
            />
          )}
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

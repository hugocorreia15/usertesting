import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useSessions } from "@/hooks/use-sessions";
import { useTemplates } from "@/hooks/use-templates";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Save,
  Trash2,
  Camera,
  Loader2,
  Pencil,
  X,
  ArrowRight,
  ClipboardList,
  Users,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const statusStyles: Record<string, string> = {
  planned:
    "ring-1 ring-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  in_progress:
    "ring-1 ring-indigo-400/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  completed:
    "ring-1 ring-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
};

const MAX_ITEMS = 5;

function ProfilePage() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const meta = user?.user_metadata;

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(meta?.first_name ?? "");
  const [lastName, setLastName] = useState(meta?.last_name ?? "");
  const [phone, setPhone] = useState(meta?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    meta?.avatar_url ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = meta?.first_name
    ? `${meta.first_name} ${meta.last_name || ""}`.trim()
    : null;
  const initial =
    displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  // Data for right column
  const { data: sessions } = useSessions();
  const { data: templates } = useTemplates();

  const { data: participantSessions } = useQuery({
    queryKey: ["sessions", "as-participant", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_sessions")
        .select("*, templates(name), participants!inner(name, email)")
        .eq("participants.email", user!.email!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const url = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        avatar_url: url,
      });

      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(meta?.first_name ?? "");
    setLastName(meta?.last_name ?? "");
    setPhone(meta?.phone ?? "");
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      navigate({ to: "/login" });
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <PageWrapper title="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile Information */}
          <Card data-animate-card className="bg-transparent backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Profile Information</CardTitle>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="group relative h-24 w-24 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 text-3xl font-medium text-white">
                        {initial}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <span className="text-xs text-muted-foreground">
                    Click to change
                  </span>
                </div>

                {/* Fields */}
                <div className="flex-1">
                  {editing ? (
                    <form onSubmit={handleSave} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" disabled value={user?.email ?? ""} />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed here.
                        </p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" size="sm" disabled={saving}>
                          <Save className="mr-2 h-3.5 w-3.5" />
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="mr-2 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Name
                        </p>
                        <p className="mt-0.5">
                          {displayName || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="mt-0.5">{user?.email ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Phone
                        </p>
                        <p className="mt-0.5">
                          {meta?.phone || "Not set"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card data-animate-card className="bg-transparent backdrop-blur-md border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* My Sessions (Observer) */}
          <Card data-animate-card className="bg-transparent backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  My Sessions{" "}
                  {sessions && (
                    <span className="text-muted-foreground font-normal">
                      ({sessions.length})
                    </span>
                  )}
                </CardTitle>
              </div>
              {sessions && sessions.length > MAX_ITEMS && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/sessions">
                    View all
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.slice(0, MAX_ITEMS).map((s: any) => (
                    <Link
                      key={s.id}
                      to="/sessions/$sessionId"
                      params={{ sessionId: s.id }}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {s.templates?.name ?? "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.participants?.name ?? "No participant"} &middot;{" "}
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status] || ""}`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Create one from the Sessions page.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sessions as Participant */}
          <Card data-animate-card className="bg-transparent backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  Sessions as Participant{" "}
                  {participantSessions && (
                    <span className="text-muted-foreground font-normal">
                      ({participantSessions.length})
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {participantSessions && participantSessions.length > 0 ? (
                <div className="space-y-2">
                  {participantSessions
                    .slice(0, MAX_ITEMS)
                    .map((s: any) => (
                      <Link
                        key={s.id}
                        to="/sessions/$sessionId"
                        params={{ sessionId: s.id }}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {s.templates?.name ?? "Untitled"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status] || ""}`}
                        >
                          {s.status.replace("_", " ")}
                        </span>
                      </Link>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sessions where you are listed as a participant.
                </p>
              )}
            </CardContent>
          </Card>

          {/* My Templates */}
          <Card data-animate-card className="bg-transparent backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  My Templates{" "}
                  {templates && (
                    <span className="text-muted-foreground font-normal">
                      ({templates.length})
                    </span>
                  )}
                </CardTitle>
              </div>
              {templates && templates.length > MAX_ITEMS && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/templates">
                    View all
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <div className="space-y-2">
                  {templates.slice(0, MAX_ITEMS).map((t) => (
                    <Link
                      key={t.id}
                      to="/templates/$templateId"
                      params={{ templateId: t.id }}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No templates yet. Create one from the Templates page.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description="This action is permanent and cannot be undone. All your data will be deleted."
        confirmLabel="Delete Account"
        onConfirm={handleDelete}
      />
    </PageWrapper>
  );
}

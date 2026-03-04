import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { AnimatedBackground } from "@/components/layout/animated-background";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { ClipboardCheck, Github, Mail } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const { signUp, signIn, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <ThemeProvider>
      <AnimatedBackground />
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="bg-gradient-to-r from-indigo-500 to-teal-400 bg-clip-text text-2xl font-bold text-transparent">
              UX Testing
            </CardTitle>
            <CardDescription>
              Sign in to manage your testing sessions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "signin" | "signup")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <SignInForm
                  signIn={signIn}
                  redirectTo={redirectTo}
                  navigate={navigate}
                  setError={setError}
                />
              </TabsContent>

              <TabsContent value="signup">
                <SignUpForm
                  signUp={signUp}
                  setError={setError}
                  setMode={setMode}
                />
              </TabsContent>
            </Tabs>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuth("google")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuth("github")}
              >
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

// ── Sign In Form ──────────────────────────────────────

interface SignInFormValues {
  email: string;
  password: string;
}

function SignInForm({
  signIn,
  redirectTo,
  navigate,
  setError,
}: {
  signIn: (email: string, password: string) => Promise<void>;
  redirectTo: string | undefined;
  navigate: ReturnType<typeof useNavigate>;
  setError: (error: string | null) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>();

  const onSubmit = async (data: SignInFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
      navigate({ to: redirectTo || "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="••••••••"
          {...register("password", {
            required: "Password is required",
          })}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-white hover:from-indigo-600 hover:to-teal-500"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

// ── Sign Up Form ──────────────────────────────────────

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function getEmailProviderUrl(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const providers: Record<string, string> = {
    "gmail.com": "https://mail.google.com",
    "googlemail.com": "https://mail.google.com",
    "outlook.com": "https://outlook.live.com",
    "hotmail.com": "https://outlook.live.com",
    "live.com": "https://outlook.live.com",
    "yahoo.com": "https://mail.yahoo.com",
    "protonmail.com": "https://mail.proton.me",
    "proton.me": "https://mail.proton.me",
    "icloud.com": "https://www.icloud.com/mail",
  };
  return providers[domain] ?? null;
}

function SignUpForm({
  signUp,
  setError,
  setMode,
}: {
  signUp: (email: string, password: string, metadata?: { first_name: string; last_name: string; phone: string }) => Promise<void>;
  setError: (error: string | null) => void;
  setMode: (mode: "signin" | "signup") => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SignUpFormValues>();

  const onSubmit = async (data: SignUpFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      });
      const providerUrl = getEmailProviderUrl(data.email);
      toast.success("Account created! Check your email to confirm your account.", {
        duration: 10000,
        action: providerUrl
          ? { label: "Open email", onClick: () => window.open(providerUrl, "_blank") }
          : undefined,
      });
      reset();
      setMode("signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signup-first-name">First Name</Label>
          <Input
            id="signup-first-name"
            placeholder="John"
            {...register("firstName", {
              required: "First name is required",
            })}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last-name">Last Name</Label>
          <Input
            id="signup-last-name"
            placeholder="Doe"
            {...register("lastName", {
              required: "Last name is required",
            })}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">Phone Number</Label>
        <Input
          id="signup-phone"
          type="tel"
          placeholder="911584192"
          {...register("phone", {
            required: "Phone number is required",
          })}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="••••••••"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) =>
              value === watch("password") || "Passwords do not match",
          })}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-white hover:from-indigo-600 hover:to-teal-500"
      >
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}

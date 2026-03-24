import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: { first_name: string; last_name: string; phone: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { first_name: string; last_name: string; phone: string; avatar_url?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  inviteParticipant: (email: string, participantId: string, name: string) => Promise<{ email: string; password: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { first_name: string; last_name: string; phone: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (data: { first_name: string; last_name: string; phone: string; avatar_url?: string }) => {
    const { error } = await supabase.auth.updateUser({ data });
    if (error) throw error;
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc("delete_own_account");
    if (error) throw error;
    await supabase.auth.signOut();
  };

  const inviteParticipant = async (email: string, participantId: string, name: string) => {
    const password = generatePassword();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: name,
        },
      },
    });
    if (signUpError) throw signUpError;

    const newUserId = signUpData.user?.id;
    if (!newUserId) throw new Error("Failed to create participant account");

    // Link auth account to participant record
    const { error: updateError } = await supabase
      .from("participants")
      .update({ auth_user_id: newUserId })
      .eq("id", participantId);
    if (updateError) throw updateError;

    return { email, password };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        updateProfile,
        deleteAccount,
        inviteParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useRouter, useSegments } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';

// Module-level variable — synchronous reads/writes, no React render cycle dependency.
// Set by handleDeepLink (app killed → reopened) and by join.tsx (app already running).
// Consumed by useProtectedRoute when the user lands in the auth group after sign-in.
let _pendingInvite: string | null = null;

export function setPendingInvite(code: string | null) {
  _pendingInvite = code;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    invite?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute(
  user: User | null,
  isLoading: boolean,
  isPasswordRecovery: boolean,
) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isPasswordRecovery) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      // Consume the module-level pending invite synchronously — no timing issues.
      const code = _pendingInvite;
      if (code) {
        _pendingInvite = null;
        router.replace({ pathname: '/group/join', params: { code } });
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading, isPasswordRecovery]);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const router = useRouter();
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        router.replace('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // When the app is opened via a deep link, the OS hands us the full URL.
  // - Invite links (ibblog://group/join?code=...): store the code in _pendingInvite.
  //   The code may also arrive here embedded in a Supabase email-confirmation redirect
  //   (ibblog://group/join?code=INVITE#access_token=...&type=signup), in which case we
  //   store the code AND process the auth tokens so the user is signed in automatically.
  // - Password recovery links (ibblog://reset-password#access_token=...): extract tokens
  //   and give them to Supabase, which fires the PASSWORD_RECOVERY event above.
  const handleDeepLink = useCallback(async (url: string) => {
    const parsed = Linking.parse(url);
    if (parsed.path === 'group/join' && parsed.queryParams?.code) {
      // Set the module-level variable synchronously so useProtectedRoute can
      // read it in the same render cycle after sign-in completes.
      _pendingInvite = parsed.queryParams.code as string;
      // Don't return — fall through to process auth tokens if this is a confirmation redirect.
    }

    const fragment = url.split('#')[1];
    if (!fragment) return;

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (
      accessToken &&
      refreshToken &&
      (type === 'recovery' || type === 'signup')
    ) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (type === 'recovery') {
        setIsPasswordRecovery(true);
        router.replace('/reset-password');
      }
      // For signup: onAuthStateChange fires SIGNED_IN → useProtectedRoute handles navigation.
    }
  }, []);

  useEffect(() => {
    // Case 1: app was closed — the link that opened it is the "initial URL"
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Case 2: app was backgrounded — the link arrives as a live event
    const subscription = Linking.addEventListener('url', ({ url }) =>
      handleDeepLink(url),
    );

    return () => subscription.remove();
  }, [handleDeepLink]);

  useProtectedRoute(session?.user ?? null, isLoading, isPasswordRecovery);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    invite?: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: invite
          ? `ibblog://group/join?code=${encodeURIComponent(invite)}`
          : 'ibblog://',
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ibblog://reset-password',
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsPasswordRecovery(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { getProfiles } from '../lib/api';
import { useFamilyStore } from '../store/familyStore';

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);
  const { setUser, setActiveProfile } = useUserStore();
  const { setMembers } = useFamilyStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user.id);
        try {
          const profiles = await getProfiles(session.user.id);
          if (profiles.length > 0) {
            setMembers(profiles);
            const primary = profiles.find((p: any) => p.is_primary) ?? profiles[0];
            setActiveProfile(primary.id, primary.name);
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding/welcome');
          }
        } catch {
          router.replace('/onboarding/welcome');
        }
      } else {
        router.replace('/onboarding/welcome');
      }
      setLoaded(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user.id);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="meds" />
      <Stack.Screen name="family" />
    </Stack>
  );
}

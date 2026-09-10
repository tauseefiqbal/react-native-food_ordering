import { create } from 'zustand';
import {User} from "@/type";
import {getCurrentUser} from "@/lib/appwrite";

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => set({ user }),
    setLoading: (value) => set({isLoading: value}),

    fetchAuthenticatedUser: async () => {
        set({ isLoading: true });

        try {
            // Timeout after 10 seconds so the app never hangs on launch
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 10000)
            );

            const user = await Promise.race([
                getCurrentUser(),
                timeoutPromise
            ]);

            if (user) {
                set({ isAuthenticated: true, user: user as User });
            } else {
                set({ isAuthenticated: false, user: null });
            }
        } catch (e) {
            console.log('fetchAuthenticatedUser error:', e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    }
}))

export default useAuthStore;

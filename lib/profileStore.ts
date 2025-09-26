import { create } from "zustand";
import type { Profile } from "./types";

type State = {
    profile: Profile | null;
    setProfile: (p: Profile | null) => void;
};

export const useProfileStore = create<State>((set) => ({
    profile: null,
    setProfile: (p) => set({ profile: p }),
}));

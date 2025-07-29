import { create } from 'zustand';
import { Drive } from '@pagespace/lib/client';
export type { Drive };

interface DriveState {
  drives: Drive[];
  currentDriveId: string | null;
  isLoading: boolean;
  fetchDrives: () => Promise<void>;
  addDrive: (drive: Drive) => void;
  setCurrentDrive: (driveId: string | null) => void;
}

export const useDriveStore = create<DriveState>((set) => ({
  drives: [],
  currentDriveId: null,
  isLoading: false,
  fetchDrives: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/drives');
      if (!response.ok) {
        throw new Error('Failed to fetch drives');
      }
      const drives = await response.json();
      set({ drives, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
  addDrive: (drive: Drive) => set((state) => ({ drives: [...state.drives, drive] })),
  setCurrentDrive: (driveId: string | null) => set({ currentDriveId: driveId }),
}));
import { create } from 'zustand';

const SELECTED_BRANCH_KEY = 'selected-branch-id';

interface BranchState {
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number | null) => void;
}

const readSelectedBranchId = (): number | null => {
  try {
    const raw = localStorage.getItem(SELECTED_BRANCH_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

export const useBranchStore = create<BranchState>((set) => ({
  selectedBranchId: readSelectedBranchId(),

  setSelectedBranchId: (id) => {
    if (id === null) {
      localStorage.removeItem(SELECTED_BRANCH_KEY);
    } else {
      localStorage.setItem(SELECTED_BRANCH_KEY, String(id));
    }
    set({ selectedBranchId: id });
  },
}));
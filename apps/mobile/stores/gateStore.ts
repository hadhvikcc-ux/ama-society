import { create } from 'zustand';

interface Visitor {
  id: string;
  name: string;
  flat: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  category: string;
}

interface GateState {
  activeVisitors: Visitor[];
  lastScanResult: any;
  setActiveVisitors: (visitors: Visitor[]) => void;
  setLastScanResult: (result: any) => void;
}

export const useGateStore = create<GateState>((set) => ({
  activeVisitors: [],
  lastScanResult: null,
  setActiveVisitors: (activeVisitors) => set({ activeVisitors }),
  setLastScanResult: (lastScanResult) => set({ lastScanResult }),
}));

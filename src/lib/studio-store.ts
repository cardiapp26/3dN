import { create } from "zustand";
import type { LayerId, StudioMode } from "./cranial-nerves";

export type ImagingPlane = "axial" | "coronal" | "sagittal";
export type ImagingModality = "MR" | "CT";
export type Side = "both" | "left" | "right";

type StudioState = {
  selectedId: number | null;
  hoveredId: number | null;
  mode: StudioMode;
  layers: Record<LayerId, boolean>;
  playing: boolean;
  signalSpeed: number;
  signalProgress: number;
  side: Side;
  showLabels: boolean;
  explode: boolean;
  imagingPlane: ImagingPlane;
  imagingSlice: number;
  imagingModality: ImagingModality;
  imagingSequence: "T1" | "T2" | "FLAIR" | "bone";
  welcome: boolean;
  setSelected: (id: number | null) => void;
  setHovered: (id: number | null) => void;
  setMode: (mode: StudioMode) => void;
  toggleLayer: (id: LayerId) => void;
  setPlaying: (v: boolean) => void;
  setSignalSpeed: (v: number) => void;
  setSignalProgress: (v: number) => void;
  setSide: (s: Side) => void;
  setShowLabels: (v: boolean) => void;
  setExplode: (v: boolean) => void;
  setImagingPlane: (p: ImagingPlane) => void;
  setImagingSlice: (n: number) => void;
  setImagingModality: (m: ImagingModality) => void;
  setImagingSequence: (s: StudioState["imagingSequence"]) => void;
  dismissWelcome: () => void;
};

const defaultLayers: Record<LayerId, boolean> = {
  skull: true,
  brain: false,
  brainstem: true,
  nerves: true,
  muscles: false,
  organs: false,
  nuclei: true,
};

export const useStudio = create<StudioState>((set) => ({
  selectedId: null,
  hoveredId: null,
  mode: "explore",
  layers: defaultLayers,
  playing: false,
  signalSpeed: 0.22,
  signalProgress: 0,
  side: "both",
  showLabels: true,
  explode: false,
  imagingPlane: "axial",
  imagingSlice: 10,
  imagingModality: "MR",
  imagingSequence: "T1",
  welcome: true,
  setSelected: (id) =>
    set({
      selectedId: id,
      signalProgress: 0,
      playing: id !== null,
    }),
  setHovered: (id) => set({ hoveredId: id }),
  setMode: (mode) =>
    set((s) => ({
      mode,
      playing: mode === "signal" ? s.selectedId !== null : false,
    })),
  toggleLayer: (id) =>
    set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setPlaying: (v) => set({ playing: v }),
  setSignalSpeed: (v) => set({ signalSpeed: v }),
  setSignalProgress: (v) => set({ signalProgress: v }),
  setSide: (side) => set({ side }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setExplode: (explode) => set({ explode }),
  setImagingPlane: (imagingPlane) => set({ imagingPlane }),
  setImagingSlice: (imagingSlice) => set({ imagingSlice }),
  setImagingModality: (imagingModality) =>
    set({
      imagingModality,
      imagingSequence: imagingModality === "CT" ? "bone" : "T1",
    }),
  setImagingSequence: (imagingSequence) => set({ imagingSequence }),
  dismissWelcome: () => set({ welcome: false }),
}));

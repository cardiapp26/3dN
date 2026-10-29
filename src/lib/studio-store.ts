import { create } from "zustand";
import type { LayerId, StudioMode } from "./cranial-nerves";

export type ImagingPlane = "axial" | "coronal" | "sagittal";
export type ImagingModality = "MR" | "CT";
export type Side = "both" | "left" | "right";

export type HoveredStructure = {
  id: string;
  nameLa: string;
  nameTr?: string;
  category?: string;
  point: [number, number, number];
};

export type FocusTarget = {
  position: [number, number, number];
  target: [number, number, number];
};

type StudioState = {
  selectedId: number | null;
  hoveredId: number | null;
  hoveredStructure: HoveredStructure | null;
  focusTarget: FocusTarget | null;
  activeWaypointId: string | null;
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
  setFocusTarget: (target: FocusTarget | null) => void;
  setActiveWaypointId: (id: string | null) => void;
  setSelected: (id: number | null) => void;
  setHovered: (id: number | null) => void;
  setHoveredStructure: (
    h: HoveredStructure | null | ((prev: HoveredStructure | null) => HoveredStructure | null),
  ) => void;
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
  hoveredStructure: null,
  focusTarget: null,
  activeWaypointId: null,
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
  setFocusTarget: (focusTarget) => set({ focusTarget }),
  setActiveWaypointId: (activeWaypointId) => set({ activeWaypointId }),
  setSelected: (id) =>
    set({
      selectedId: id,
      focusTarget: null,
      activeWaypointId: null,
      signalProgress: 0,
      playing: id !== null,
    }),
  setHovered: (id) => set({ hoveredId: id }),
  setHoveredStructure: (h) =>
    set((s) => ({
      hoveredStructure: typeof h === "function" ? h(s.hoveredStructure) : h,
    })),
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
}));

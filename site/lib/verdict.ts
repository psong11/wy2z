// Mirrors the JSON schema produced by pi5/analyze.py — the system prompt there
// is the source of truth. Keep these in sync.

export type PlantId = "zinnia_a" | "zinnia_b" | "tomato";
export type HealthColor = "green" | "yellow" | "red";
export type SoilMoisture = "wet" | "moist" | "dry" | "very_dry" | "unknown";
export type PlantAction = "none" | "water" | "inspect";

export type PlantVerdict = {
  plant: PlantId;
  visible: boolean;
  health: HealthColor;
  observations: string[];
  soil_moisture_guess: SoilMoisture;
  action: PlantAction;
  confidence: number;
};

export type Verdict = {
  plants: PlantVerdict[];
  scene_notes: string;
};

export const PLANT_LABEL: Record<PlantId, string> = {
  zinnia_a: "Zinnia A",
  zinnia_b: "Zinnia B",
  tomato: "Tomato",
};

export const PLANT_ORDER: readonly PlantId[] = ["zinnia_a", "zinnia_b", "tomato"];

export function findPlant(verdict: Verdict | null, id: PlantId): PlantVerdict | null {
  return verdict?.plants.find((p) => p.plant === id) ?? null;
}

import type { Verdict } from "./verdict";

/** Synthesize a single human-readable headline from the latest verdict
 *  and DHT11 reading. Lives in its own file because the rules will
 *  inevitably grow as more failure modes surface in production. */
export function buildHeroOneLiner(args: {
  verdict: Verdict | null;
  airTempC: number | null;
  airHumidityPct: number | null;
}): string {
  const { verdict, airTempC, airHumidityPct } = args;

  const tempPart =
    airTempC != null && airHumidityPct != null
      ? `${airTempC.toFixed(1)}°C / ${Math.round(airHumidityPct)}%`
      : null;

  if (!verdict || verdict.plants.length === 0) {
    return tempPart ? `Awaiting verdict. ${tempPart}.` : "Awaiting verdict.";
  }

  const visible = verdict.plants.filter((p) => p.visible);
  const reds = visible.filter((p) => p.health === "red");
  const yellows = visible.filter((p) => p.health === "yellow");
  const waters = visible.filter((p) => p.action === "water");
  const greenCount = visible.filter((p) => p.health === "green").length;

  const namesOf = (group: typeof visible) =>
    group
      .map((p) => p.plant.replace("zinnia_", "zinnia "))
      .join(" + ");

  let headline: string;
  if (reds.length > 0) {
    headline = `${namesOf(reds)} flagged red — needs attention`;
  } else if (waters.length > 0) {
    headline = `${namesOf(waters)} dry — flagged for water`;
  } else if (yellows.length > 0) {
    headline = `${namesOf(yellows)} worth a closer look`;
  } else if (greenCount === visible.length && visible.length > 0) {
    headline =
      visible.length === 3
        ? "Three healthy plants"
        : `${visible.length} healthy plants`;
  } else {
    headline = "Verdict logged";
  }

  return tempPart ? `${headline}. ${tempPart}.` : `${headline}.`;
}

export type Estado = 'logrado' | 'riesgo' | 'critico';

export function calcularCumplimiento(
  meta: number,
  real: number,
  inverso: boolean,
): number {
  if (real === 0) return 0;
  const pct = inverso ? (meta / real) * 100 : (real / meta) * 100;
  return Math.round(pct * 10) / 10;
}

export function clasificarEstado(pct: number): Estado {
  if (pct >= 90) return 'logrado';
  if (pct >= 75) return 'riesgo';
  return 'critico';
}

interface KpiLike {
  meta: number;
  real: number;
  inverso: boolean;
}

export function evaluar(kpi: KpiLike) {
  const cumplimiento = calcularCumplimiento(kpi.meta, kpi.real, kpi.inverso);
  return { ...kpi, cumplimiento, estado: clasificarEstado(cumplimiento) };
}

export function calcularIndice(evs: { cumplimiento: number }[]): number {
  return Math.round(
    (evs.reduce((acc, k) => acc + k.cumplimiento, 0) / (evs.length || 1)) * 10,
  ) / 10;
}

export function contarEstados(evs: { estado: Estado }[]) {
  return {
    logrado: evs.filter((k) => k.estado === 'logrado').length,
    riesgo: evs.filter((k) => k.estado === 'riesgo').length,
    critico: evs.filter((k) => k.estado === 'critico').length,
  };
}

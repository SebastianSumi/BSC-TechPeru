import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeftRight,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileBarChart,
  FileWarning,
  FolderKanban,
  GitBranch,
  Handshake,
  LayoutDashboard,
  LogOut,
  Network,
  Paperclip,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Target,
  Upload,
  Users as UsersIcon,
} from 'lucide-react'
import { AuthProvider, useAuth } from './store/useAuth'
import { useBsc } from './store/useBsc'
import { ESTADO_META, resumenPorPerspectiva } from './lib/bsc'
import { api } from './lib/api'
import { PERSPECTIVAS } from './data/kpis'
import { SemaforoDonut } from './components/SemaforoDonut'
import { RadarPerspectivas } from './components/RadarPerspectivas'
import { MetaRealChart } from './components/MetaRealChart'
import { KpiCard } from './components/KpiCard'
import { KpiModal } from './components/KpiModal'
import { SimuladorPanel } from './components/SimuladorPanel'
import { Login } from './components/Login'
import { Reportes } from './components/Reportes'
import { AdminPanel } from './components/AdminPanel'
import { PeriodoSelector } from './components/PeriodoSelector'
import { MapaEstrategicoView } from './components/MapaEstrategico'
import { ObjetivosPanel } from './components/ObjetivosPanel'
import { DiccionarioPanel } from './components/DiccionarioPanel'
import { IniciativasPanel } from './components/IniciativasPanel'
import { AlertasPanel } from './components/AlertasPanel'
import { DesviacionesPanel } from './components/DesviacionesPanel'
import { EvidenciasPanel } from './components/EvidenciasPanel'
import { CompromisosPanel } from './components/CompromisosPanel'
import { CalendarioPanel } from './components/CalendarioPanel'
import { VersionesPanel } from './components/VersionesPanel'
import { AprobacionesPanel } from './components/AprobacionesPanel'
import { ComparacionPanel } from './components/ComparacionPanel'
import { ImportPanel } from './components/ImportPanel'
import { ConfigPanel } from './components/ConfigPanel'
import { AuditoriaPanel } from './components/AuditoriaPanel'
import type { KpiEvaluado, Periodo, PerspectivaId } from './data/types'

type Tab =
  | 'dashboard'
  | PerspectivaId
  | 'simulador'
  | 'reportes'
  | 'mapa'
  | 'objetivos'
  | 'diccionario'
  | 'iniciativas'
  | 'alertas'
  | 'desviaciones'
  | 'evidencias'
  | 'compromisos'
  | 'calendario'
  | 'versiones'
  | 'aprobaciones'
  | 'comparacion'
  | 'importacion'
  | 'config'
  | 'auditoria'
  | 'admin'

function AppContent() {
  const { usuario, cargando, logout, puede } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [periodoId, setPeriodoId] = useState('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [sel, setSel] = useState<KpiEvaluado | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { kpis, evaluados, setReal, reset, dirty, resumenGlobal, source } =
    useBsc(periodoId || null)

  const resumenes = useMemo(() => resumenPorPerspectiva(kpis), [kpis])
  const selLive = sel ? evaluados.find((e) => e.id === sel.id) ?? null : null

  const cargarPeriodos = () => {
    api
      .listarPeriodos()
      .then((ps) => {
        setPeriodos(ps)
        if (!periodoId) {
          const activo = ps.find((p) => p.activo)
          if (activo) setPeriodoId(activo.id)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (usuario) cargarPeriodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Cargando…
      </div>
    )
  }

  if (!usuario) return <Login />

  const TABS: { id: Tab; label: string; icono?: string; icon?: React.ReactNode; roles?: ('ADMIN' | 'GERENTE')[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'financiera', label: 'Financiera', icono: '💰' },
    { id: 'clientes', label: 'Clientes', icono: '👥' },
    { id: 'procesos', label: 'Procesos', icono: '🔧' },
    { id: 'aprendizaje', label: 'Aprendizaje', icono: '📚' },
    { id: 'simulador', label: 'Simulador', icon: <SlidersHorizontal size={15} /> },
    { id: 'mapa', label: 'Mapa Estratégico', icon: <Network size={15} /> },
    { id: 'objetivos', label: 'Objetivos', icon: <Target size={15} /> },
    { id: 'diccionario', label: 'Diccionario KPI', icon: <BookOpen size={15} /> },
    { id: 'iniciativas', label: 'Iniciativas', icon: <FolderKanban size={15} /> },
    { id: 'alertas', label: 'Alertas', icon: <Bell size={15} /> },
    { id: 'desviaciones', label: 'Desviaciones', icon: <FileWarning size={15} /> },
    { id: 'evidencias', label: 'Evidencias', icon: <Paperclip size={15} /> },
    { id: 'compromisos', label: 'Compromisos', icon: <Handshake size={15} /> },
    { id: 'calendario', label: 'Calendario', icon: <CalendarClock size={15} /> },
    { id: 'versiones', label: 'Versiones', icon: <GitBranch size={15} /> },
    { id: 'aprobaciones', label: 'Aprobaciones', icon: <CheckCircle2 size={15} /> },
    { id: 'comparacion', label: 'Comparación', icon: <ArrowLeftRight size={15} /> },
    { id: 'importacion', label: 'Importar', icon: <Upload size={15} /> },
    { id: 'auditoria', label: 'Auditoría', icon: <ScrollText size={15} /> },
    { id: 'config', label: 'Configuración', icon: <Settings size={15} /> },
    { id: 'reportes', label: 'Reportes', icon: <FileBarChart size={15} /> },
    { id: 'admin', label: 'Administración', icon: <UsersIcon size={15} />, roles: ['ADMIN', 'GERENTE'] },
  ]

  const tabsVisibles = TABS.filter((t) => !t.roles || puede(...t.roles))
  const puedeGestionar = puede('ADMIN', 'GERENTE')

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6">
        <div className="relative overflow-hidden rounded-2xl border px-5 py-4 shadow-sm sm:px-6" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderColor: 'var(--border)' }}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08),transparent)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-sm">
                  <Activity size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Balanced Scorecard — TechPeru SAC</h1>
                  <p className="text-xs text-[var(--muted)]">
                    4 perspectivas · 12 objetivos · 36 KPIs · Gobierno, auditoría, alertas y trazabilidad
                  </p>
                </div>
              </div>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: source === 'api' ? '#22c55e' : '#f59e0b', boxShadow: source === 'api' ? '0 0 0 4px rgba(34,197,94,0.08)' : '0 0 0 4px rgba(245,158,11,0.08)' }}
                />
                {source === 'api' ? 'Conectado al API (PostgreSQL)' : 'Datos locales (API offline)'}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="rounded-xl border px-4 py-2 text-right shadow-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Índice global</p>
                <p className="text-2xl font-semibold tabular-nums">{resumenGlobal.indiceGlobal}%</p>
                {dirty && <span className="text-[10px] text-[#f59e0b]">escenario simulado</span>}
              </div>
              <div
                className="flex items-center gap-3 rounded-xl border px-3 py-2 shadow-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#eff6ff_0%,#e0f2fe_100%)] text-[#1d4ed8]">
                  <Shield size={16} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{usuario.nombre}</p>
                  <p className="text-[11px] text-[var(--muted)]">{usuario.rol}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#ef4444] transition hover:bg-[#fef2f2]"
                  title="Cerrar sesión"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1.5 overflow-x-auto pb-1">
          {tabsVisibles.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-medium transition-all hover:-translate-y-px hover:shadow-sm"
                style={{
                  background: active ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)' : 'var(--surface)',
                  borderColor: active ? '#1d4ed8' : 'var(--border)',
                  color: active ? '#fff' : 'var(--text)',
                  boxShadow: active ? '0 6px 18px -12px rgba(37, 99, 235, 0.9)' : 'none',
                }}
              >
                {t.icon}
                {t.icono} {t.label}
              </button>
            )
          })}
        </nav>
        <PeriodoSelector
          periodos={periodos}
          periodoId={periodoId}
          onCambiar={setPeriodoId}
          onRecargar={cargarPeriodos}
          puedeGestionar={puedeGestionar}
          usuarioRol={usuario.rol}
        />
      </div>

      {tab === 'dashboard' && (
        <Dashboard evaluados={evaluados} resumenes={resumenes} resumenGlobal={resumenGlobal} onOpen={setSel} />
      )}

      {tab !== 'dashboard' &&
        tab !== 'simulador' &&
        tab !== 'reportes' &&
        tab !== 'admin' &&
        tab !== 'mapa' &&
        tab !== 'objetivos' &&
        tab !== 'diccionario' &&
        tab !== 'iniciativas' &&
        tab !== 'alertas' &&
        tab !== 'desviaciones' &&
        tab !== 'evidencias' &&
        tab !== 'compromisos' &&
        tab !== 'calendario' &&
        tab !== 'versiones' &&
        tab !== 'aprobaciones' &&
        tab !== 'comparacion' &&
        tab !== 'importacion' &&
        tab !== 'config' &&
        tab !== 'auditoria' && (
          <PerspectivaView id={tab} evaluados={evaluados} onOpen={setSel} />
        )}

      {tab === 'simulador' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SimuladorPanel
            kpis={kpis}
            setReal={setReal}
            reset={reset}
            dirty={dirty}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          />
          <div className="space-y-6">
            <Card title="Índice global en vivo">
              <SemaforoDonut resumen={resumenGlobal} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
                <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
                <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
              </div>
            </Card>
            <Card title="Cumplimiento por perspectiva">
              <RadarPerspectivas resumenes={resumenes} />
            </Card>
          </div>
        </div>
      )}

      {tab === 'mapa' && <MapaEstrategicoView periodos={periodos} />}
      {tab === 'objetivos' && <ObjetivosPanel />}
      {tab === 'diccionario' && <DiccionarioPanel periodos={periodos} />}
      {tab === 'iniciativas' && <IniciativasPanel />}
      {tab === 'alertas' && <AlertasPanel periodos={periodos} />}
      {tab === 'desviaciones' && <DesviacionesPanel />}
      {tab === 'evidencias' && <EvidenciasPanel />}
      {tab === 'compromisos' && <CompromisosPanel />}
      {tab === 'calendario' && <CalendarioPanel periodos={periodos} />}
      {tab === 'versiones' && <VersionesPanel />}
      {tab === 'aprobaciones' && <AprobacionesPanel />}
      {tab === 'comparacion' && <ComparacionPanel periodos={periodos} />}
      {tab === 'importacion' && <ImportPanel periodos={periodos} />}
      {tab === 'config' && <ConfigPanel />}
      {tab === 'auditoria' && <AuditoriaPanel />}
      {tab === 'reportes' && <Reportes periodoId={periodoId || null} />}
      {tab === 'admin' && <AdminPanel />}

      {selLive && <KpiModal kpi={selLive} onClose={() => setSel(null)} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function Dashboard({
  evaluados,
  resumenes,
  resumenGlobal,
  onOpen,
}: {
  evaluados: KpiEvaluado[]
  resumenes: ReturnType<typeof resumenPorPerspectiva>
  resumenGlobal: ReturnType<typeof useBsc>['resumenGlobal']
  onOpen: (k: KpiEvaluado) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Semáforo ejecutivo">
          <SemaforoDonut resumen={resumenGlobal} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
            <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
            <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
          </div>
        </Card>
        <Card title="Cumplimiento por perspectiva">
          <RadarPerspectivas resumenes={resumenes} />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERSPECTIVAS.map((p) => {
          const r = resumenes[p.id]
          return (
            <button
              key={p.id}
              onClick={() => onOpen({
                id: '',
                perspectivaId: p.id,
                objetivo: '',
                nombre: '',
                unidad: '',
                meta: 0,
                real: 0,
                inverso: false,
                accion: '',
                cumplimiento: r.indiceGlobal,
                estado: 'logrado',
              })}
              className="rounded-2xl border p-4 text-left"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span>{p.icono}</span> {p.nombre}
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: p.color }}>
                {r.indiceGlobal}%
              </p>
              <div className="mt-2 flex gap-2 text-xs text-[var(--muted)]">
                <span>✅ {r.logrado}</span>
                <span>⚠️ {r.riesgo}</span>
                <span>❌ {r.critico}</span>
              </div>
            </button>
          )
        })}
      </div>

      <Card title="Meta vs Real — todos los KPIs">
        <MetaRealChart kpis={evaluados} />
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Explorador de KPIs (36)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evaluados.map((k) => (
            <KpiCard key={k.id} kpi={k} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PerspectivaView({
  id,
  evaluados,
  onOpen,
}: {
  id: PerspectivaId
  evaluados: KpiEvaluado[]
  onOpen: (k: KpiEvaluado) => void
}) {
  const p = PERSPECTIVAS.find((x) => x.id === id)!
  const list = evaluados.filter((k) => k.perspectivaId === id)
  const r = resumenPorPerspectiva(evaluados)[id]
  const objetivos = [...new Set(list.map((k) => k.objetivo))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">
          {p.icono} {p.nombre}
        </h2>
        <span className="text-sm font-bold tabular-nums" style={{ color: p.color }}>
          {r.indiceGlobal}%
        </span>
      </div>

      {objetivos.map((obj) => (
        <div key={obj}>
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            <ChevronRight size={14} /> {obj}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list
              .filter((k) => k.objetivo === obj)
              .map((k) => (
                <KpiCard key={k.id} kpi={k} onOpen={onOpen} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function Conteo({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div className="rounded-lg border py-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {valor}
      </p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  )
}

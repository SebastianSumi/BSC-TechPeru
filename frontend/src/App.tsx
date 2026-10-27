import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  FileBarChart,
  FileWarning,
  FolderKanban,
  GitBranch,
  Handshake,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Network,
  Paperclip,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Upload,
  Users as UsersIcon,
} from 'lucide-react'
import { AuthProvider, useAuth } from './store/useAuth'
import { useBsc } from './store/useBsc'
import { useEmpresa } from './store/useEmpresa'
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
import { PerspectivasPanel } from './components/PerspectivasPanel'
import { TareasPanel } from './components/TareasPanel'
import { RecomendacionesPanel } from './components/RecomendacionesPanel'
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
import { VisionMisionPanel } from './components/VisionMisionPanel'
import { AuditoriaPanel } from './components/AuditoriaPanel'
import type { KpiEvaluado, Periodo, PerspectivaId, RolNombre } from './data/types'

type Tab =
  | 'dashboard'
  | PerspectivaId
  | 'simulador'
  | 'reportes'
  | 'mapa'
  | 'objetivos'
  | 'vision'
  | 'perspectivas'
  | 'tareas'
  | 'recomendaciones'
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

type TabDef = {
  id: Tab
  label: string
  desc: string
  group: string
  icon: ReactNode
  roles?: RolNombre[]
}

const TABS: TabDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard ejecutivo',
    desc: 'Monitorea el desempeño de la estrategia, identifica desviaciones y prioriza acciones.',
    group: 'Estratégico',
    icon: <LayoutDashboard size={16} />,
  },
  {
    id: 'mapa',
    label: 'Mapa estratégico',
    desc: 'Explora cómo los objetivos se conectan a través de las cuatro perspectivas.',
    group: 'Estratégico',
    icon: <Network size={16} />,
  },
  {
    id: 'objetivos',
    label: 'Objetivos',
    desc: 'Define resultados prioritarios y alinea cada objetivo con su perspectiva.',
    group: 'Estratégico',
    icon: <Target size={16} />,
  },
  {
    id: 'vision',
    label: 'Visión y Misión',
    desc: 'Consulta y actualiza el propósito y la dirección de la compañía activa.',
    group: 'Estratégico',
    icon: <Compass size={16} />,
  },
  {
    id: 'perspectivas',
    label: 'Catálogo de perspectivas',
    desc: 'Administra las perspectivas del BSC y su vigencia.',
    group: 'Estratégico',
    icon: <Building2 size={16} />,
  },
  {
    id: 'tareas',
    label: 'Tareas y resultados',
    desc: 'Da seguimiento a las tareas, resultados y su validación contra los KPI.',
    group: 'Estratégico',
    icon: <ListChecks size={16} />,
  },
  {
    id: 'recomendaciones',
    label: 'Recomendaciones',
    desc: 'Registra recomendaciones y fija la vigente por objetivo o KPI.',
    group: 'Estratégico',
    icon: <MessageSquare size={16} />,
  },
  {
    id: 'diccionario',
    label: 'Diccionario KPI',
    desc: 'Consulta fórmulas, fuentes, metas y criterios de cada indicador.',
    group: 'Estratégico',
    icon: <BookOpen size={16} />,
  },
  {
    id: 'iniciativas',
    label: 'Iniciativas',
    desc: 'Convierte los objetivos en proyectos con responsables, presupuesto y avance.',
    group: 'Estratégico',
    icon: <FolderKanban size={16} />,
  },
  {
    id: 'financiera',
    label: 'Financiera',
    desc: 'Perspectiva financiera: rentabilidad, crecimiento y estructura de costos.',
    group: 'Perspectivas',
    icon: <span className="text-[14px] leading-none">💰</span>,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    desc: 'Perspectiva de clientes: satisfacción, retención y expansión de la base.',
    group: 'Perspectivas',
    icon: <span className="text-[14px] leading-none">👥</span>,
  },
  {
    id: 'procesos',
    label: 'Procesos internos',
    desc: 'Perspectiva de procesos: calidad, eficiencia operativa e innovación.',
    group: 'Perspectivas',
    icon: <span className="text-[14px] leading-none">🔧</span>,
  },
  {
    id: 'aprendizaje',
    label: 'Aprendizaje y crecimiento',
    desc: 'Perspectiva de aprendizaje: talento, cultura y capacidades estratégicas.',
    group: 'Perspectivas',
    icon: <span className="text-[14px] leading-none">📚</span>,
  },
  {
    id: 'simulador',
    label: 'Simulador',
    desc: 'Ajusta resultados reales y observa el impacto en el cumplimiento global.',
    group: 'Análisis',
    icon: <SlidersHorizontal size={16} />,
  },
  {
    id: 'reportes',
    label: 'Reportes',
    desc: 'Genera resúmenes de desempeño y exporta información para análisis.',
    group: 'Análisis',
    icon: <FileBarChart size={16} />,
  },
  {
    id: 'comparacion',
    label: 'Comparación',
    desc: 'Compara el desempeño entre períodos e identifica variaciones.',
    group: 'Análisis',
    icon: <ArrowLeftRight size={16} />,
  },
  {
    id: 'calendario',
    label: 'Calendario',
    desc: 'Programa hitos, revisiones y compromisos del ciclo estratégico.',
    group: 'Análisis',
    icon: <CalendarClock size={16} />,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    desc: 'Gestiona notificaciones generadas por desviaciones y umbrales.',
    group: 'Gobierno y control',
    icon: <Bell size={16} />,
  },
  {
    id: 'desviaciones',
    label: 'Desviaciones',
    desc: 'Registra brechas, causas y planes de acción sobre los indicadores.',
    group: 'Gobierno y control',
    icon: <FileWarning size={16} />,
  },
  {
    id: 'compromisos',
    label: 'Compromisos',
    desc: 'Da seguimiento a compromisos adquiridos y su nivel de cumplimiento.',
    group: 'Gobierno y control',
    icon: <Handshake size={16} />,
  },
  {
    id: 'evidencias',
    label: 'Evidencias',
    desc: 'Adjunta y consulta los respaldos de cada medición reportada.',
    group: 'Gobierno y control',
    icon: <Paperclip size={16} />,
  },
  {
    id: 'aprobaciones',
    label: 'Aprobaciones',
    desc: 'Revisa y valida mediciones según el flujo de aprobación definido.',
    group: 'Gobierno y control',
    icon: <CheckCircle2 size={16} />,
  },
  {
    id: 'versiones',
    label: 'Versiones',
    desc: 'Administra versiones del plan estratégico y su vigencia.',
    group: 'Gobierno y control',
    icon: <GitBranch size={16} />,
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    desc: 'Consulta el historial de acciones y cambios realizados en el sistema.',
    group: 'Gobierno y control',
    icon: <ScrollText size={16} />,
  },
  {
    id: 'importacion',
    label: 'Importar datos',
    desc: 'Carga mediciones y estructura desde archivos externos.',
    group: 'Sistema',
    icon: <Upload size={16} />,
  },
  {
    id: 'config',
    label: 'Configuración',
    desc: 'Ajusta parámetros de evaluación, umbrales y preferencias del BSC.',
    group: 'Sistema',
    icon: <Settings size={16} />,
  },
  {
    id: 'admin',
    label: 'Administración',
    desc: 'Gestiona usuarios, roles y consulta la matriz de permisos.',
    group: 'Sistema',
    icon: <UsersIcon size={16} />,
    roles: ['ADMIN', 'GERENTE'],
  },
]

const GROUPS = ['Estratégico', 'Perspectivas', 'Análisis', 'Gobierno y control', 'Sistema']

function initials(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() ?? '')
    .join('')
}

function AppContent() {
  const { usuario, cargando, logout, puede } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [periodoId, setPeriodoId] = useState('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [sel, setSel] = useState<KpiEvaluado | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [orgMenu, setOrgMenu] = useState(false)
  const [filtroDiccionario, setFiltroDiccionario] = useState('')

  const { empresas, activa, activaId, cambiar } = useEmpresa(!!usuario)

  const { kpis, evaluados, setReal, reset, dirty, resumenGlobal, source } =
    useBsc(periodoId || null, activaId)

  const resumenes = useMemo(() => resumenPorPerspectiva(kpis), [kpis])
  const selLive = sel ? evaluados.find((e) => e.id === sel.id) ?? null : null

  const cargarPeriodos = (forzar = false) => {
    api
      .listarPeriodos()
      .then((ps) => {
        setPeriodos(ps)
        setPeriodoId((prev) => {
          if (!forzar && prev) return prev
          return ps.find((p) => p.activo)?.id ?? ''
        })
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!usuario) return
    setSel(null)
    setExpandedId(null)
    setOrgMenu(false)
    cargarPeriodos(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, activaId])

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Cargando…
      </div>
    )
  }

  if (!usuario) return <Login />

  const tabsVisibles = TABS.filter((t) => !t.roles || puede(...t.roles))
  const puedeGestionar = puede('ADMIN', 'GERENTE')
  const meta = TABS.find((t) => t.id === tab) ?? TABS[0]
  const periodoActual = periodos.find((p) => p.id === periodoId)

  const navegar = (id: Tab) => {
    setTab(id)
    setSidebarAbierto(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bsc-shell">
      <aside className={`bsc-sidebar${sidebarAbierto ? ' open' : ''}`}>
        <div className="bsc-brand">
          <span className="bsc-brand-mark">
            <Activity size={19} />
          </span>
          <span>
            <strong>BSC Suite</strong>
            <small>Balanced Scorecard</small>
          </span>
        </div>

        <div className="bsc-org-wrap">
          <button
            type="button"
            className="bsc-org"
            onClick={() => setOrgMenu((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={orgMenu}
            title="Cambiar de compañía"
          >
            <span
              className="bsc-org-icon"
              style={{
                background: `${activa?.color ?? '#2563eb'}26`,
                color: activa?.color ?? '#93c5fd',
              }}
            >
              {activa?.sigla ?? 'TP'}
            </span>
            <span className="bsc-org-meta">
              <strong>{activa?.nombre ?? 'TechPeru SAC'}</strong>
              <small>{activa?.sector || 'Compañía'}</small>
            </span>
            <ChevronDown size={14} className={`bsc-org-caret${orgMenu ? ' open' : ''}`} />
          </button>

          {orgMenu && (
            <div className="bsc-org-menu" role="menu">
              <p className="bsc-org-menu-title">Compañías</p>
              {empresas.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  role="menuitem"
                  className={`bsc-org-option${e.id === activaId ? ' active' : ''}`}
                  onClick={() => {
                    cambiar(e.id)
                    setOrgMenu(false)
                  }}
                >
                  <span className="dot" style={{ background: e.color }} />
                  <span className="opt-meta">
                    <strong>{e.nombre}</strong>
                    <small>
                      {e.sector || 'Compañía'}
                      {e._count ? ` · ${e._count.objetivos} objetivos · ${e._count.kpis} KPIs` : ''}
                    </small>
                  </span>
                  {e.id === activaId && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          )}
          {orgMenu && <div className="bsc-org-scrim" onClick={() => setOrgMenu(false)} />}
        </div>

        <nav className="bsc-nav">
          {GROUPS.map((group) => {
            const items = tabsVisibles.filter((t) => t.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <p className="bsc-nav-label">{group}</p>
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navegar(t.id)}
                    className={`bsc-nav-link${tab === t.id ? ' active' : ''}`}
                    title={t.label}
                  >
                    <span className="bsc-nav-icon">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="bsc-sidebar-foot">
          <div className="bsc-side-user">
            <span className="bsc-avatar">{initials(usuario.nombre)}</span>
            <div className="bsc-user-meta">
              <strong>{usuario.nombre}</strong>
              <small>{usuario.rol}</small>
            </div>
            <button className="bsc-logout" onClick={logout} title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarAbierto && <div className="bsc-overlay" onClick={() => setSidebarAbierto(false)} />}

      <div className="bsc-main">
        <header className="bsc-topbar">
          <div className="flex items-center gap-2">
            <button
              className="bsc-logout text-[var(--muted)] lg:hidden"
              onClick={() => setSidebarAbierto(true)}
              title="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <div className="bsc-crumb">
              <span className="crumb-org">
                <Building2 size={13} />
                {activa?.nombre ?? 'TechPeru SAC'}
              </span>
              <span className="crumb-sep">/</span>
              <strong>{meta.label}</strong>
              {periodoActual && <span className="pill pill-blue pill-no-dot">{periodoActual.nombre}</span>}
            </div>
          </div>

          <div className="bsc-top-actions">
            <button
              onClick={() => navegar('alertas')}
              className="relative hidden h-8 w-8 items-center justify-center rounded-lg border text-[var(--muted)] transition hover:bg-[var(--surface-2)] sm:inline-flex"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              title="Alertas y notificaciones"
            >
              <Bell size={15} />
              {resumenGlobal.critico > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
              )}
            </button>
            <PeriodoSelector
              periodos={periodos}
              periodoId={periodoId}
              onCambiar={setPeriodoId}
              onRecargar={cargarPeriodos}
              puedeGestionar={puedeGestionar}
              usuarioRol={usuario.rol}
            />
            <div className="bsc-index-chip" title="Índice global de cumplimiento">
              <div>
                <p className="label">Índice global</p>
                <p className="value">{resumenGlobal.indiceGlobal}%</p>
              </div>
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: source === 'api' ? '#22c55e' : '#f59e0b',
                  boxShadow: source === 'api' ? '0 0 0 4px rgba(34,197,94,0.1)' : '0 0 0 4px rgba(245,158,11,0.1)',
                }}
                title={
                  source === 'api'
                    ? 'Conectado al API'
                    : source === 'sin-datos'
                      ? 'API no disponible'
                      : 'Datos locales'
                }
              />
            </div>
            <div className="bsc-top-user">
              <span className="bsc-avatar">{initials(usuario.nombre)}</span>
              <div className="meta">
                <p className="name">{usuario.nombre}</p>
                <p className="role">{usuario.rol}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="bsc-content">
          <Fragment key={activaId}>
          <PageHeader
            eyebrow={`${activa?.nombre ?? 'TechPeru SAC'} · ${meta.group}`}
            title={meta.label}
            desc={meta.desc}
            actions={
              tab === 'dashboard' ? (
                <>
                  <button className="btn-bsc" onClick={() => navegar('reportes')}>
                    <FileBarChart size={14} /> Ver reportes
                  </button>
                  <button className="btn-bsc btn-bsc-primary" onClick={() => navegar('simulador')}>
                    <SlidersHorizontal size={14} /> Registrar resultado
                  </button>
                </>
              ) : undefined
            }
          />

          {source !== 'api' && (
            <div
              className="mb-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px]"
              style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}
            >
              <AlertTriangle size={14} />
              {source === 'local'
                ? 'API no disponible: se muestran datos locales de demostración.'
                : 'API no disponible: no hay datos locales para esta compañía.'}
            </div>
          )}

          {dirty && tab === 'dashboard' && (
            <div
              className="mb-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px]"
              style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
            >
              <TrendingUp size={14} />
              Escenario simulado activo: los valores mostrados no corresponden a las mediciones guardadas.
            </div>
          )}

          {tab === 'dashboard' && (
            <Dashboard
              evaluados={evaluados}
              resumenes={resumenes}
              resumenGlobal={resumenGlobal}
              onOpen={setSel}
              onNavigate={navegar}
            />
          )}

          {tab !== 'dashboard' &&
            tab !== 'simulador' &&
            tab !== 'reportes' &&
            tab !== 'admin' &&
            tab !== 'mapa' &&
            tab !== 'objetivos' &&
            tab !== 'vision' &&
            tab !== 'perspectivas' &&
            tab !== 'tareas' &&
            tab !== 'recomendaciones' &&
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
            <div className="grid gap-5 lg:grid-cols-2">
              <SimuladorPanel
                kpis={kpis}
                setReal={setReal}
                reset={reset}
                dirty={dirty}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              />
              <div className="space-y-5">
                <Panel title="Índice global en vivo" subtitle="Impacto inmediato de los ajustes">
                  <SemaforoDonut resumen={resumenGlobal} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
                    <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
                    <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
                  </div>
                </Panel>
                <Panel title="Cumplimiento por perspectiva" subtitle="Comparación entre las cuatro perspectivas">
                  <RadarPerspectivas resumenes={resumenes} />
                </Panel>
              </div>
            </div>
          )}

          {tab === 'mapa' && <MapaEstrategicoView periodos={periodos} />}
          {tab === 'objetivos' && (
            <ObjetivosPanel
              onVerKpis={(objetivoId) => {
                setFiltroDiccionario(objetivoId)
                navegar('diccionario')
              }}
            />
          )}
          {tab === 'perspectivas' && <PerspectivasPanel />}
          {tab === 'tareas' && <TareasPanel />}
          {tab === 'recomendaciones' && <RecomendacionesPanel />}
          {tab === 'diccionario' && (
            <DiccionarioPanel
              periodos={periodos}
              filtroObjetivo={filtroDiccionario}
              onLimpiarFiltro={() => setFiltroDiccionario('')}
            />
          )}
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
          {tab === 'config' && (
            <ConfigPanel key={activaId} empresaId={activaId} />
          )}
          {tab === 'vision' && (
            <VisionMisionPanel key={activaId} empresaId={activaId} />
          )}
          {tab === 'auditoria' && <AuditoriaPanel />}
          {tab === 'reportes' && <Reportes periodoId={periodoId || null} />}
          {tab === 'admin' && <AdminPanel />}
          </Fragment>
        </main>

        <footer className="bsc-footer">
          <span>
            {activa?.nombre ?? 'TechPeru SAC'} · Balanced Scorecard {periodoActual?.anio ?? 2025}
          </span>
          <span>
            {source === 'api'
              ? 'Datos en vivo (PostgreSQL)'
              : source === 'local'
                ? 'Modo demostración local'
                : 'Sin conexión al API'} ·{' '}
            {usuario.rol}
          </span>
        </footer>
      </div>

      {selLive && (
        <KpiModal
          kpi={selLive}
          onClose={() => setSel(null)}
          onVerEnDiccionario={(objetivoId) => {
            setSel(null)
            if (objetivoId) setFiltroDiccionario(objetivoId)
            navegar('diccionario')
          }}
        />
      )}
    </div>
  )
}

function PageHeader({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow?: string
  title: string
  desc: string
  actions?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="page-head-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
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
  onNavigate,
}: {
  evaluados: KpiEvaluado[]
  resumenes: ReturnType<typeof resumenPorPerspectiva>
  resumenGlobal: ReturnType<typeof useBsc>['resumenGlobal']
  onOpen: (k: KpiEvaluado) => void
  onNavigate: (id: Tab) => void
}) {
  const objetivos = useMemo(() => new Set(evaluados.map((k) => k.objetivo)).size, [evaluados])
  const atencion = resumenGlobal.riesgo + resumenGlobal.critico

  return (
    <div className="space-y-5">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cumplimiento estratégico"
          value={`${resumenGlobal.indiceGlobal}%`}
          foot={
            <span className={resumenGlobal.indiceGlobal >= 90 ? 'trend-up' : resumenGlobal.indiceGlobal >= 75 ? '' : 'trend-down'}>
              {resumenGlobal.total} KPI evaluados
            </span>
          }
          icon={<TrendingUp size={17} />}
        />
        <MetricCard
          label="Objetivos estratégicos"
          value={String(objetivos)}
          foot={<span className="trend-up">4 perspectivas alineadas</span>}
          icon={<Target size={17} />}
          tone="green"
        />
        <MetricCard
          label="Indicadores KPI"
          value={String(resumenGlobal.total)}
          foot={<span className="trend-up">{resumenGlobal.logrado} cumplidos</span>}
          icon={<Activity size={17} />}
          tone="amber"
        />
        <MetricCard
          label="Requieren atención"
          value={String(atencion)}
          foot={<span className={atencion ? 'trend-down' : 'trend-up'}>{resumenGlobal.critico} críticos</span>}
          icon={<AlertTriangle size={17} />}
          tone="red"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Panel title="Semáforo ejecutivo" subtitle="Distribución de los indicadores por estado">
          <SemaforoDonut resumen={resumenGlobal} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
            <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
            <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
          </div>
        </Panel>
        <Panel title="Cumplimiento por perspectiva" subtitle="Índice ponderado según los KPI registrados">
          <RadarPerspectivas resumenes={resumenes} />
        </Panel>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {PERSPECTIVAS.map((p) => {
          const r = resumenes[p.id]
          return (
            <button
              key={p.id}
              onClick={() => onNavigate(p.id)}
              className="bsc-card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text)]">
                  <span>{p.icono}</span> {p.nombre}
                </p>
                <ChevronRight size={15} className="text-[var(--muted)] transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-[26px] font-extrabold tabular-nums" style={{ color: p.color }}>
                {r.indiceGlobal}%
              </p>
              <div className="bsc-progress mt-2">
                <span style={{ width: `${Math.min(100, r.indiceGlobal)}%`, background: p.color }} />
              </div>
              <div className="mt-2.5 flex gap-3 text-[10.5px] text-[var(--muted)]">
                <span className="text-[var(--green)]">● {r.logrado}</span>
                <span className="text-[var(--amber)]">● {r.riesgo}</span>
                <span className="text-[var(--red)]">● {r.critico}</span>
              </div>
            </button>
          )
        })}
      </div>

      <Panel title="Meta vs Real — todos los KPIs" subtitle="Comparación entre el objetivo planificado y el resultado reportado">
        <MetaRealChart kpis={evaluados} />
      </Panel>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-[15px] font-bold">Explorador de KPIs</h2>
            <p className="text-[10.5px] text-[var(--muted)]">
              Selecciona un indicador para ver su análisis y la acción recomendada.
            </p>
          </div>
          <span className="tag">{evaluados.length} indicadores</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
    <div className="space-y-5">
      <div className="bsc-card grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
          style={{ background: `${p.color}18`, color: p.color }}
        >
          {p.icono}
        </div>
        <div>
          <p className="text-sm font-bold">{p.nombre}</p>
          <p className="text-[11px] text-[var(--muted)]">
            {objetivos.length} objetivos · {list.length} indicadores en esta perspectiva
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: p.color }}>
            {r.indiceGlobal}%
          </p>
          <p className="text-[10px] text-[var(--muted)]">cumplimiento</p>
        </div>
      </div>

      {objetivos.map((obj) => {
        const items = list.filter((k) => k.objetivo === obj)
        return (
          <div key={obj}>
            <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]">
              <ChevronRight size={14} /> {obj}
              <span className="tag">{items.length} KPI</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((k) => (
                <KpiCard key={k.id} kpi={k} onOpen={onOpen} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetricCard({
  label,
  value,
  foot,
  icon,
  tone = 'blue',
}: {
  label: string
  value: string
  foot: ReactNode
  icon: ReactNode
  tone?: 'blue' | 'green' | 'amber' | 'red'
}) {
  const tones: Record<string, { bg: string; color: string }> = {
    blue: { bg: '#eff6ff', color: '#2869d9' },
    green: { bg: '#eaf8f1', color: '#16845b' },
    amber: { bg: '#fff5dd', color: '#b97708' },
    red: { bg: '#ffebed', color: '#c23a42' },
  }
  const t = tones[tone]
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon" style={{ background: t.bg, color: t.color }}>
          {icon}
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{foot}</div>
    </article>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="bsc-card bsc-panel">
      <div className="bsc-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
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

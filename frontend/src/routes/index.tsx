import { createBrowserRouter, Link } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold">Página não encontrada</p>
      <Link to="/" className="mt-2 inline-block text-sm text-primary hover:underline">
        Voltar ao dashboard
      </Link>
    </div>
  )
}

/** Páginas carregadas sob demanda para reduzir o carregamento inicial. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    hydrateFallbackElement: <div className="p-8 text-sm text-slate-500">Carregando…</div>,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/pages/DashboardPage')).DashboardPage }) },
      { path: 'projetos', lazy: async () => ({ Component: (await import('@/pages/ProjectsPage')).ProjectsPage }) },
      { path: 'projetos/:id', lazy: async () => ({ Component: (await import('@/pages/ProjectDetailPage')).ProjectDetailPage }) },
      { path: 'tarefas', lazy: async () => ({ Component: (await import('@/pages/TasksPage')).TasksPage }) },
      { path: 'portfolio', lazy: async () => ({ Component: (await import('@/pages/PortfolioPage')).PortfolioPage }) },
      { path: 'riscos', lazy: async () => ({ Component: (await import('@/pages/RisksPage')).RisksPage }) },
      { path: 'testes', lazy: async () => ({ Component: (await import('@/pages/TestsPage')).TestsPage }) },
      { path: 'documentos', lazy: async () => ({ Component: (await import('@/pages/DocumentsPage')).DocumentsPage }) },
      { path: 'atualizacoes', lazy: async () => ({ Component: (await import('@/pages/UpdatesPage')).UpdatesPage }) },
      { path: 'configuracoes', lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }) },
      { path: '*', element: <NotFound /> },
    ],
  },
])

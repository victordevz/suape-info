import Link from 'next/link';

type DashboardShellProps = {
  activeNav: 'overview' | 'documents' | 'licenses';
  children: React.ReactNode;
  subtitle?: string;
};

const operationNav = [
  { key: 'overview', label: 'Visão geral', href: '/dashboard' },
  { key: 'documents', label: 'Documentos no Drive', href: '/' },
  {
    key: 'licenses',
    label: 'Licenças em triagem',
    href: '/dashboard/licencas/triagem',
  },
  { key: 'evidence', label: 'Evidências anexadas' },
  { key: 'pending', label: 'Pendências e conflitos' },
];

const agentNav = [
  'Leitura de PDF',
  'Planilhas de controle',
  'Imagem e OCR',
];

export function DashboardShell({
  activeNav,
  children,
}: DashboardShellProps) {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Navegação do dashboard">
        <Link className="dashboard-brand sidebar-brand" href="/dashboard">
          <span className="dashboard-brand-symbol" aria-hidden="true">
            <img src="/suape-logo.png" alt="" />
          </span>
          <span>
            <strong>Central de Dados e Evidências</strong>
            <small>Governança documental</small>
            {isMockMode ? <small>Modo demo ativo</small> : null}
          </span>
        </Link>

        <section className="dashboard-nav-section">
          <span className="dashboard-nav-title">Operação</span>
          <nav className="dashboard-nav-list" aria-label="Operação">
            {operationNav.map((item) => {
              const isActive = item.key === activeNav;

              if (!item.href) {
                return (
                  <span className="dashboard-nav-item muted" key={item.key}>
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  className={isActive ? 'dashboard-nav-item active' : 'dashboard-nav-item'}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </section>

        <section className="dashboard-nav-section">
          <span className="dashboard-nav-title">Micro agentes</span>
          <div className="dashboard-nav-list">
            {agentNav.map((item) => (
              <span className="dashboard-nav-item muted" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

      </aside>

      <section className="dashboard-main">{children}</section>
    </main>
  );
}

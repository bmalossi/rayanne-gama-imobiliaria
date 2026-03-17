import { useQuery } from "@tanstack/react-query";
import { Home, Users, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import * as dashboardService from "@/modules/dashboard/services/dashboard.service";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id, isAdmin],
    queryFn: () => dashboardService.fetchDashboardStats(user!.id, isAdmin),
    enabled: Boolean(user?.id),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["dashboard-recent-leads", user?.id, isAdmin],
    queryFn: () => dashboardService.fetchRecentLeads(user!.id, isAdmin),
    enabled: Boolean(user?.id),
  });

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="gold-label">Overview</p>
          <h1 className="mt-2 text-4xl">Painel do Corretor</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/imoveis" className="rounded-md bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80">
            Gerenciar Imóveis
          </Link>
          <Link to="/dashboard/leads" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Gerenciar Leads
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Imóveis cadastrados" value={stats?.propertiesCount ?? 0} icon={Home} />
        <StatCard label="Leads recebidos" value={stats?.leadsCount ?? 0} icon={Users} />
        <StatCard label="Novos leads (7 dias)" value={stats?.newLeads7d ?? 0} icon={TrendingUp} highlight="Atualizado" />
        <StatCard label="Imóveis ativos" value={stats?.activeProperties ?? 0} icon={CheckCircle} />
      </section>

      <section className="luxury-surface overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-2xl">Leads Recentes</h2>
          <Link to="/dashboard/leads" className="gold-label hover:text-foreground">
            Ver todos
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Contato</th>
                <th className="px-6 py-3">Imóvel</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">Nenhum lead recebido.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/40 text-sm transition-colors hover:bg-secondary/40">
                    <td className="px-6 py-4 text-foreground">{lead.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.email} · {lead.phone}</td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.property?.title ?? "-"}</td>
                    <td className="px-6 py-4"><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary">{lead.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;


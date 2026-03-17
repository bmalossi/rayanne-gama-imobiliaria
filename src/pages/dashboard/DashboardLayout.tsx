import { Outlet, useLocation } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const titleByPath: Record<string, string> = {
  "/dashboard": "Visão geral",
  "/dashboard/imoveis": "Meus imóveis",
  "/dashboard/leads": "Leads",
  "/dashboard/chatbot": "Configurações do Chatbot",
  "/dashboard/distribuicao": "Roleta de Leads",
  "/dashboard/perfil": "Meu perfil",
  "/dashboard/usuarios": "Gerenciamento de Usuários",
};

const DashboardLayout = () => {
  const location = useLocation();
  const currentTitle =
    location.pathname.includes("/dashboard/imoveis/") && location.pathname.includes("/editar")
      ? "Editar imóvel"
      : location.pathname.includes("/dashboard/imoveis/novo")
        ? "Novo imóvel"
        : titleByPath[location.pathname] ?? "Painel do corretor";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="border border-border text-primary" />
              <p className="gold-label hidden sm:block">{currentTitle}</p>
            </div>
          </header>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

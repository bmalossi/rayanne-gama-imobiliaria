import { LayoutDashboard, Home, Users, LogOut, UserCircle, UserPlus, BotMessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/modules/auth/hooks/useAuth";

const links = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Meus Imóveis", url: "/dashboard/imoveis", icon: Home },
  { title: "Leads", url: "/dashboard/leads", icon: Users },
  { title: "Configurações Chatbot", url: "/dashboard/chatbot", icon: BotMessageSquare, adminOnly: true },
  { title: "Distribuição (Roleta)", url: "/dashboard/distribuicao", icon: Users, adminOnly: true },
  { title: "Gerenciar Usuários", url: "/dashboard/usuarios", icon: UserPlus, adminOnly: true },
  { title: "Meu Perfil", url: "/dashboard/perfil", icon: UserCircle },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { signOut, isAdmin } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <div className="px-4 py-3">
          <p className="text-lg italic text-sidebar-primary">Rayanne Gama</p>
          {!collapsed && <p className="gold-label text-[10px] text-sidebar-foreground/50">PAINEL DO CORRETOR</p>}
        </div>
        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.filter(item => !item.adminOnly || isAdmin).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="text-sidebar-foreground/70"
                      activeClassName="border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                      end={item.url === "/dashboard"}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-3 pb-5">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}


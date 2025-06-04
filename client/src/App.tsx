import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Categories from "@/pages/Categories";
import VideoClasses from "@/pages/VideoClasses";
import More from "@/pages/More";
import ArtworkDetail from "@/pages/ArtworkDetail";
import ArtDetailPage from "@/pages/ArtDetailPage";
import AuthPage from "@/pages/auth-page";
import ImageUploadDemo from "@/pages/ImageUploadDemo";
import SocialSharingDemo from "@/pages/SocialSharingDemo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useMobileMenuProvider } from "@/hooks/use-mobile-menu";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Página pública de planos
import PlansPage from "@/pages/PlansPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import PostagensPage from "@/pages/admin/PostagensPage";
import CategoriasPage from "@/pages/admin/CategoriasPage";
import PlanosPage from "@/pages/admin/PlanosPage";
import FileFormatsPage from "@/pages/admin/gerenciamento/FileFormatsPage";
import PostFormatsPage from "@/pages/admin/gerenciamento/PostFormatsPage";
import TagsPage from "@/pages/admin/gerenciamento/TagsPage";
import UsuariosPage from "@/pages/admin/gerenciamento/UsuariosPage";
import AssinantesPage from "@/pages/admin/gerenciamento/AssinantesPage";
import ProfilePage from "@/pages/account/ProfilePage";

function Router() {
  const [location] = useLocation();
  const isAuthPage = location.startsWith("/auth");

  return (
    <Switch>
      {/* Rotas Públicas */}
      <Route path="/" component={Home} />
      <Route path="/categorias" component={Categories} />
      <Route path="/video-aulas" component={VideoClasses} />
      <Route path="/mais" component={More} />
      <Route path="/artwork/:id" component={ArtworkDetail} />
      <Route path="/artes/:slug" component={ArtDetailPage} />
      <Route path="/preview/:id" component={ArtDetailPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/planos" component={PlansPage} />
      <Route path="/demo/upload" component={ImageUploadDemo} />
      <Route path="/demo/sharing" component={SocialSharingDemo} />
      
      {/* Rotas de Conta do Usuário */}
      <Route path="/perfil">
        <ProtectedRoute path="/perfil" component={ProfilePage} requireAdmin={false} />
      </Route>
      
      {/* Rotas Administrativas */}
      <Route path="/admin/postagens">
        <ProtectedRoute path="/admin/postagens" component={PostagensPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/categorias">
        <ProtectedRoute path="/admin/categorias" component={CategoriasPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/planos">
        <ProtectedRoute path="/admin/planos" component={PlanosPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/gerenciamento/formatos">
        <ProtectedRoute path="/admin/gerenciamento/formatos" component={FileFormatsPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/gerenciamento/formatos-post">
        <ProtectedRoute path="/admin/gerenciamento/formatos-post" component={PostFormatsPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/gerenciamento/tags">
        <ProtectedRoute path="/admin/gerenciamento/tags" component={TagsPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/gerenciamento/usuarios">
        <ProtectedRoute path="/admin/gerenciamento/usuarios" component={UsuariosPage} requireAdmin={true} />
      </Route>
      <Route path="/admin/gerenciamento/assinantes">
        <ProtectedRoute path="/admin/gerenciamento/assinantes" component={AssinantesPage} requireAdmin={true} />
      </Route>
      <Route path="/admin">
        {location === "/admin" && <ProtectedRoute path="/admin" component={AdminDashboard} requireAdmin={true} />}
      </Route>
      
      {/* Rota 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const mobileMenuState = useMobileMenuProvider();
  const { Context, value } = mobileMenuState;
  const [location] = useLocation();
  const isAuthPage = location.startsWith("/auth");
  const isAdminPage = location.startsWith("/admin");
  const showHeaderFooter = !isAuthPage && !isAdminPage;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Context.Provider value={value}>
          <div className="flex flex-col min-h-screen">
            {showHeaderFooter && <Header />}
            <main className={`flex-grow ${showHeaderFooter ? "pt-16" : ""}`}>
              <Router />
            </main>
            {showHeaderFooter && <Footer />}
          </div>
          <Toaster />
        </Context.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

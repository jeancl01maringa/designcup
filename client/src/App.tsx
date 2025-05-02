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
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useMobileMenuProvider } from "@/hooks/use-mobile-menu";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [location] = useLocation();
  const isAuthPage = location.startsWith("/auth");

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categorias" component={Categories} />
      <Route path="/video-aulas" component={VideoClasses} />
      <Route path="/mais" component={More} />
      <Route path="/artwork/:id" component={ArtworkDetail} />
      <Route path="/auth/*" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const mobileMenuState = useMobileMenuProvider();
  const { Context, value } = mobileMenuState;
  const [location] = useLocation();
  const isAuthPage = location.startsWith("/auth");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Context.Provider value={value}>
          <div className="flex flex-col min-h-screen">
            {!isAuthPage && <Header />}
            <main className={`flex-grow ${isAuthPage ? "" : "pt-16"}`}>
              <Router />
            </main>
            {!isAuthPage && <Footer />}
          </div>
          <Toaster />
        </Context.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Categories from "@/pages/Categories";
import VideoClasses from "@/pages/VideoClasses";
import More from "@/pages/More";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useMobileMenuProvider } from "@/hooks/use-mobile-menu";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categorias" component={Categories} />
      <Route path="/video-aulas" component={VideoClasses} />
      <Route path="/mais" component={More} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const mobileMenuState = useMobileMenuProvider();
  const { Context, value } = mobileMenuState;

  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={value}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </Context.Provider>
    </QueryClientProvider>
  );
}

export default App;

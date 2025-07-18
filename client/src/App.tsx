import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PWAInstallBanner from "@/components/pwa-install-banner";
import { Suspense, Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RegisterAnimal from "@/pages/register-animal";
import AnimalProfile from "@/pages/animal-profile";
import Search from "@/pages/search";
import Helplines from "@/pages/helplines";


// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading StreetPaws</h2>
          <p className="text-sm text-gray-600 text-center">
            Please wait while we prepare the animal management system...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Error boundary class component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                The application encountered an error. Please try refreshing the page.
              </p>
              <div className="space-y-2 w-full">
                <Button onClick={() => this.setState({ hasError: false, error: null })} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 w-full">
                  <summary className="text-xs text-gray-500 cursor-pointer">Error Details</summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/register" component={RegisterAnimal} />
          <Route path="/animal/:animalId" component={AnimalProfile} />
          <Route path="/search" component={Search} />
          <Route path="/helplines" component={Helplines} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <PWAInstallBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

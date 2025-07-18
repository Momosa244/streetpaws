import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Automatically redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      setLocation("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Redirecting to StreetPaws</h1>
            <p className="text-sm text-gray-600 mb-4">
              Taking you to the main website...
            </p>
            <Button 
              onClick={() => setLocation("/")}
              size="sm"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

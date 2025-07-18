import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = () => {
    const instructions = `
Install StreetPaws as an App:

📱 On Android (Chrome):
1. Tap the menu (three dots ⋮)
2. Select "Add to Home screen"
3. Confirm installation

📱 On iPhone (Safari):
1. Tap the Share button
2. Select "Add to Home Screen"
3. Tap "Add" to confirm

💻 On Desktop (Chrome/Edge):
1. Look for install icon in address bar
2. Click and follow prompts
3. Or use browser menu → "Install StreetPaws"

The app works offline and provides a native app experience!
    `;
    alert(instructions);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (dismissed || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-gradient-to-r from-primary to-green-600 text-white border-0 shadow-lg animate-in slide-in-from-bottom-5 duration-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                Install StreetPaws
              </h4>
              <p className="text-white/90 text-xs mb-3">
                Get quick access to animal management tools. Works offline and updates automatically.
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstall}
                  className="bg-white text-primary hover:bg-white/90 h-8 px-3 text-xs font-medium"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/10 h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
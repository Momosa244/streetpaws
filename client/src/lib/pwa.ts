// PWA registration and install prompt handling

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;

// Register service worker
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('[PWA] New content available, refreshing...');
              window.location.reload();
            }
          });
        }
      });
      
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
}

// Handle install prompt
export function setupInstallPrompt(): void {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    console.log('[PWA] Install prompt available');
    
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    
    // Store the event for later use
    deferredPrompt = event as BeforeInstallPromptEvent;
    
    // Show custom install button
    showInstallButton();
  });

  // Listen for app install
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    isInstalled = true;
    hideInstallButton();
    
    // Clear the deferred prompt
    deferredPrompt = null;
  });

  // Check if app is already installed
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[PWA] App is already installed');
    isInstalled = true;
  }
}

// Show install button
function showInstallButton(): void {
  // Create install button if it doesn't exist
  let installButton = document.getElementById('pwa-install-button');
  
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Install App
    `;
    installButton.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: #22c55e;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('mouseenter', () => {
      installButton!.style.transform = 'scale(1.05)';
      installButton!.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
    });
    
    installButton.addEventListener('mouseleave', () => {
      installButton!.style.transform = 'scale(1)';
      installButton!.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
    });
    
    installButton.addEventListener('click', promptInstall);
    document.body.appendChild(installButton);
  }
  
  installButton.style.display = 'flex';
}

// Hide install button
function hideInstallButton(): void {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Prompt user to install
export async function promptInstall(): Promise<void> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
    hideInstallButton();
    
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
  }
}

// Check if app can be installed
export function canInstall(): boolean {
  return !!deferredPrompt && !isInstalled;
}

// Check if app is installed
export function getInstallStatus(): boolean {
  return isInstalled;
}

// Check PWA installation requirements
function checkPWASupport(): void {
  console.log('[PWA] Checking installation support...');
  
  const manifestLink = document.querySelector('link[rel="manifest"]');
  const hasServiceWorker = 'serviceWorker' in navigator;
  const isSecure = window.isSecureContext;
  const hasInstallPrompt = 'onbeforeinstallprompt' in window;
  
  console.log('[PWA] Requirements:', {
    manifest: !!manifestLink,
    serviceWorker: hasServiceWorker,
    secure: isSecure,
    installPrompt: hasInstallPrompt
  });
}



// Initialize PWA features
export function initializePWA(): void {
  console.log('[PWA] Initializing StreetPaws PWA');
  
  checkPWASupport();
  registerServiceWorker();
  setupInstallPrompt();
  
  // Add PWA-specific styles
  const style = document.createElement('style');
  style.textContent = `
    /* PWA specific styles */
    @media (display-mode: standalone) {
      body {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Hide scrollbars in standalone mode */
      ::-webkit-scrollbar {
        width: 0px;
        background: transparent;
      }
    }
    
    /* Install button animations */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    #pwa-install-button:active {
      transform: scale(0.95) !important;
    }
  `;
  document.head.appendChild(style);
}
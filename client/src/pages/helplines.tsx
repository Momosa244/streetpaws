import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, Clock, MapPin, AlertTriangle, UserCheck, Stethoscope, Heart, Info } from "lucide-react";
import type { Helpline } from "@shared/schema";

export default function Helplines() {
  const [selectedHelpline, setSelectedHelpline] = useState<Helpline | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const { data: helplines = [], isLoading } = useQuery<Helpline[]>({
    queryKey: ['/api/helplines'],
  });

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleShowInfo = (helpline: Helpline) => {
    setSelectedHelpline(helpline);
    setShowInfoDialog(true);
  };

  const getHelplineIcon = (type: string) => {
    if (type.includes('Emergency')) return <Phone className="text-white text-xl" />;
    if (type.includes('Medical') || type.includes('Veterinary')) return <Stethoscope className="text-white text-xl" />;
    if (type.includes('Rescue') || type.includes('Volunteer')) return <Heart className="text-white text-xl" />;
    return <UserCheck className="text-white text-xl" />;
  };

  const getHelplineColor = (type: string) => {
    if (type.includes('Emergency')) return 'bg-primary';
    if (type.includes('Medical') || type.includes('Veterinary')) return 'bg-secondary';
    if (type.includes('Rescue') || type.includes('Volunteer')) return 'bg-accent';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Animal Control Helplines</h1>
            <p className="text-xl text-gray-600">24/7 support for animal emergencies and welfare concerns</p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Skeleton className="w-12 h-12 rounded-lg mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {helplines.map((helpline) => (
                <Card key={helpline.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${getHelplineColor(helpline.type)} rounded-lg flex items-center justify-center mr-4`}>
                        {getHelplineIcon(helpline.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{helpline.name}</h3>
                        <p className="text-sm text-gray-600">{helpline.type}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-700">
                        <Phone className="text-primary mr-3 w-4 h-4" />
                        <span className="font-semibold text-lg">{helpline.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="text-primary mr-3 w-4 h-4" />
                        <span>{helpline.hours}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <MapPin className="text-primary mr-3 w-4 h-4" />
                        <span>{helpline.coverage}</span>
                      </div>
                      {helpline.description && (
                        <p className="text-sm text-gray-600 mt-2">{helpline.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCall(helpline.phone)}
                        className={`flex-1 ${getHelplineColor(helpline.type)} hover:opacity-90`}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleShowInfo(helpline)}
                      >
                        <Info className="mr-2 h-4 w-4" />
                        Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Emergency Information */}
          <Card className="bg-red-50 border-red-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="text-red-600 text-2xl mr-4" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800 mb-2">Emergency Animal Situations</h2>
                  <p className="text-red-700 mb-4">
                    If you encounter an injured, aggressive, or distressed animal, please call the emergency hotline immediately. 
                    Do not attempt to handle the situation yourself.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">When to Call Emergency Services:</h3>
                      <ul className="text-red-700 text-sm space-y-1">
                        <li>• Injured or bleeding animals</li>
                        <li>• Aggressive or dangerous animals</li>
                        <li>• Animals in immediate danger</li>
                        <li>• Large animals blocking traffic</li>
                        <li>• Animals showing signs of rabies</li>
                        <li>• Emergency rescue situations</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Before Help Arrives:</h3>
                      <ul className="text-red-700 text-sm space-y-1">
                        <li>• Keep a safe distance</li>
                        <li>• Note the animal's exact location</li>
                        <li>• Take photos if safely possible</li>
                        <li>• Direct traffic if needed</li>
                        <li>• Stay on the line with dispatch</li>
                        <li>• Do not attempt to feed or touch</li>
                      </ul>
                    </div>
                  </div>
                  
                  {helplines.find(h => h.type.includes('Emergency')) && (
                    <div className="mt-6 p-4 bg-red-100 rounded-lg border border-red-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-red-800">Emergency Hotline</h4>
                          <p className="text-red-700 text-lg font-bold">
                            {helplines.find(h => h.type.includes('Emergency'))?.phone}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleCall(helplines.find(h => h.type.includes('Emergency'))?.phone || '')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Emergency
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className={`w-8 h-8 ${getHelplineColor(selectedHelpline?.type || '')} rounded-lg flex items-center justify-center mr-3`}>
                {getHelplineIcon(selectedHelpline?.type || '')}
              </div>
              {selectedHelpline?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this helpline service
            </DialogDescription>
          </DialogHeader>
          
          {selectedHelpline && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="text-primary mr-3 w-5 h-5" />
                    <div>
                      <p className="font-semibold text-lg">{selectedHelpline.phone}</p>
                      <p className="text-sm text-gray-600">{selectedHelpline.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="text-primary mr-3 w-5 h-5" />
                    <div>
                      <p className="font-medium">Operating Hours</p>
                      <p className="text-sm text-gray-600">{selectedHelpline.hours}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="text-primary mr-3 w-5 h-5" />
                    <div>
                      <p className="font-medium">Coverage Area</p>
                      <p className="text-sm text-gray-600">{selectedHelpline.coverage}</p>
                    </div>
                  </div>
                  
                  {selectedHelpline.description && (
                    <div className="pt-2 border-t">
                      <p className="font-medium mb-2">About This Service</p>
                      <p className="text-sm text-gray-600">{selectedHelpline.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleCall(selectedHelpline.phone)}
                  className={`flex-1 ${getHelplineColor(selectedHelpline.type)} hover:opacity-90`}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInfoDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

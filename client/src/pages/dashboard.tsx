import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, PawPrint } from "lucide-react";
import { type Animal } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    registeredAnimals: number;
    vaccinated: number;
    qrCodes: number;
    helplines: number;
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: recentAnimals, isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Digital Registry for Stray Animal Welfare</h2>
              <p className="text-xl text-green-100 mb-8">
                Track vaccinations, medical records, and support networks for stray animals through QR-coded identification tags.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-50 font-semibold">
                    <Plus className="mr-2 h-5 w-5" />
                    Register New Animal
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                alt="Stray dogs being cared for" 
                className="rounded-xl shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                alt="Veterinary vaccination" 
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-species-dog mb-2">
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.registeredAnimals || 0}
              </div>
              <div className="text-gray-600">Registered Animals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.vaccinated || 0}
              </div>
              <div className="text-gray-600">Vaccinated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.qrCodes || 0}
              </div>
              <div className="text-gray-600">QR Codes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.helplines || 0}
              </div>
              <div className="text-gray-600">Helplines Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Animals */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Recently Registered Animals</h3>
            <Link href="/search">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {animalsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(recentAnimals || []).slice(0, 6).map((animal: any) => (
                <Card key={animal.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      {animal.photoUrl ? (
                        <img 
                          src={animal.photoUrl} 
                          alt={`${animal.species} ${animal.animalId}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <div className="text-4xl mb-2">🐾</div>
                          <div className="text-sm">No photo</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{animal.animalId}</h4>
                      <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                        <PawPrint className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div>Species: <span className="font-medium text-gray-900 capitalize">{animal.species}</span></div>
                      <div>Breed: <span className="font-medium text-gray-900">{animal.breed || 'Unknown'}</span></div>
                      <div>Location: <span className="font-medium text-gray-900">{animal.area || 'Unknown'}</span></div>
                    </div>
                    <Link href={`/animal/${animal.animalId}`}>
                      <Button className="w-full bg-primary hover:bg-green-700">
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!animalsLoading && (!recentAnimals || recentAnimals.length === 0) && (
            <div className="text-center py-12">
              <PawPrint className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No animals registered yet</h3>
              <p className="text-gray-500 mb-4">Get started by registering your first animal.</p>
              <Link href="/register">
                <Button className="bg-primary hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Register First Animal
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Link href="/register">
          <Button size="lg" className="w-14 h-14 rounded-full bg-primary hover:bg-green-700 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

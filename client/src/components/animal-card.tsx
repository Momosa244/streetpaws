import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Animal } from "@shared/schema";
import { useLocation } from "wouter";
import { PawPrint } from "lucide-react";

interface AnimalCardProps {
  animal: Animal;
}

export default function AnimalCard({ animal }: AnimalCardProps) {
  const [, setLocation] = useLocation();

  const getSpeciesColor = (species: string) => {
    switch (species) {
      case 'dog': return 'species-dog';
      case 'cat': return 'species-cat';
      case 'bird': return 'species-bird';
      default: return 'species-other';
    }
  };

  const getVaccinationColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-success text-white';
      case 'partial': return 'bg-accent text-white';
      case 'not-vaccinated': return 'bg-destructive text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getVaccinationLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Vaccinated';
      case 'partial': return 'Partial';
      case 'not-vaccinated': return 'Not Vaccinated';
      default: return 'Unknown';
    }
  };

  const handleViewProfile = () => {
    setLocation(`/animal/${animal.animalId}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
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
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">No photo</div>
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <Badge className={`${getSpeciesColor(animal.species)} text-white capitalize`}>
            {animal.species}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={getVaccinationColor(animal.vaccinationStatus || 'unknown')}>
            {getVaccinationLabel(animal.vaccinationStatus || 'unknown')}
          </Badge>
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
          <div>
            Breed: <span className="font-medium text-gray-900">{animal.breed || 'Unknown'}</span>
          </div>
          <div>
            Location: <span className="font-medium text-gray-900">{animal.area || 'Unknown'}</span>
          </div>
          <div>
            Health: <span className="font-medium text-gray-900 capitalize">{animal.healthStatus || 'Unknown'}</span>
          </div>
        </div>
        <Button 
          onClick={handleViewProfile}
          className="w-full bg-primary hover:bg-green-700"
        >
          View Full Profile
        </Button>
      </CardContent>
    </Card>
  );
}

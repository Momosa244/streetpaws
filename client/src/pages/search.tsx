import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import AnimalCard from "@/components/animal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Filter } from "lucide-react";
import type { Animal } from "@shared/schema";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    species: "",
    vaccinationStatus: "",
    area: "",
    healthStatus: "",
  });

  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals/search', searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.species) params.append('species', filters.species);
      if (filters.vaccinationStatus) params.append('vaccinationStatus', filters.vaccinationStatus);
      if (filters.area) params.append('area', filters.area);
      if (filters.healthStatus) params.append('healthStatus', filters.healthStatus);

      const response = await fetch(`/api/animals/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search animals');
      }
      return response.json();
    },
  });

  const handleSearch = () => {
    // Trigger search by updating query key dependencies
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      species: "",
      vaccinationStatus: "",
      area: "",
      healthStatus: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Animals</h1>
          
          {/* Search Bar */}
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <SearchIcon className="mr-2 h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by ID, location, breed, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="bg-primary hover:bg-green-700"
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={filters.species} onValueChange={(value) => handleFilterChange('species', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    <SelectItem value="dog">Dogs</SelectItem>
                    <SelectItem value="cat">Cats</SelectItem>
                    <SelectItem value="bird">Birds</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.vaccinationStatus} onValueChange={(value) => handleFilterChange('vaccinationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vaccination Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="complete">Fully Vaccinated</SelectItem>
                    <SelectItem value="partial">Partially Vaccinated</SelectItem>
                    <SelectItem value="not-vaccinated">Not Vaccinated</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.area} onValueChange={(value) => handleFilterChange('area', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="Jayanagar">Jayanagar</SelectItem>
                    <SelectItem value="Koramangala">Koramangala</SelectItem>
                    <SelectItem value="BTM Layout">BTM Layout</SelectItem>
                    <SelectItem value="Electronic City">Electronic City</SelectItem>
                    <SelectItem value="Whitefield">Whitefield</SelectItem>
                    <SelectItem value="Malleshwaram">Malleshwaram</SelectItem>
                    <SelectItem value="Rajajinagar">Rajajinagar</SelectItem>
                    <SelectItem value="Banashankari">Banashankari</SelectItem>
                    <SelectItem value="Indiranagar">Indiranagar</SelectItem>
                    <SelectItem value="HSR Layout">HSR Layout</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.healthStatus} onValueChange={(value) => handleFilterChange('healthStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Health Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health Statuses</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || Object.values(filters).some(f => f)) && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {isLoading ? 'Searching...' : `${animals.length} animals found`}
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : animals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No animals found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || Object.values(filters).some(f => f)
                  ? "Try adjusting your search criteria or filters"
                  : "Start by searching for animals by ID, location, or characteristics"
                }
              </p>
              {(searchQuery || Object.values(filters).some(f => f)) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Search & Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navigation from "@/components/navigation";
import QRCodeGenerator from "@/components/qr-code-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Syringe, Share, MapPin, Calendar, User, Ruler, Heart, Plus, Trash2 } from "lucide-react";
import { insertAnimalSchema, insertVaccinationSchema, type Animal, type Vaccination, type InsertVaccination } from "@shared/schema";
import { z } from "zod";

// Update animal schema for editing (optional fields)
const updateAnimalSchema = insertAnimalSchema.partial();

export default function AnimalProfile() {
  const { animalId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { data: animal, isLoading: animalLoading, error: animalError } = useQuery<Animal>({
    queryKey: [`/api/animals/lookup/${animalId}`],
    enabled: !!animalId,
  });

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery<Vaccination[]>({
    queryKey: [`/api/animals/${animal?.id}/vaccinations`],
    enabled: !!animal?.id,
  });

  // Update animal form
  const updateForm = useForm({
    resolver: zodResolver(updateAnimalSchema),
    defaultValues: {
      species: animal?.species || "",
      breed: animal?.breed || "",
      gender: animal?.gender || "",
      age: animal?.age || "",
      size: animal?.size || "",
      foundLocation: animal?.foundLocation || "",
      area: animal?.area || "",
      healthStatus: animal?.healthStatus || "healthy",
      vaccinationStatus: animal?.vaccinationStatus || "not-vaccinated",
      medicalNotes: animal?.medicalNotes || "",
    },
  });

  // Vaccination form
  const vaccinationForm = useForm<InsertVaccination>({
    resolver: zodResolver(insertVaccinationSchema),
    defaultValues: {
      animalId: animal?.id || 0,
      vaccineName: "",
      vaccinationDate: "",
      veterinarian: "",
      nextDueDate: "",
      notes: "",
    },
  });

  // Update animal mutation
  const updateAnimalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/animals/${animal?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/lookup/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setShowUpdateDialog(false);
      toast({
        title: "Record updated successfully!",
        description: "The animal information has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update animal record. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add vaccination mutation
  const addVaccinationMutation = useMutation({
    mutationFn: async (data: InsertVaccination) => {
      const response = await apiRequest("POST", `/api/animals/${animal?.id}/vaccinations`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animal?.id}/vaccinations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/animals/lookup/${animalId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setShowVaccinationDialog(false);
      vaccinationForm.reset();
      toast({
        title: "Vaccination added!",
        description: "The vaccination record has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add vaccination",
        description: "Please check the information and try again.",
        variant: "destructive",
      });
    },
  });

  // Delete animal mutation
  const deleteAnimalMutation = useMutation({
    mutationFn: async () => {
      if (!animal?.id) throw new Error("Animal ID not found");
      const response = await apiRequest("DELETE", `/api/animals/${animal.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Animal deleted",
        description: "The animal profile has been permanently deleted.",
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Failed to delete animal",
        description: "An error occurred while deleting the animal profile.",
        variant: "destructive",
      });
    },
  });

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update animal with new photo URL
        const updateResponse = await apiRequest("PATCH", `/api/animals/${animal?.id}`, {
          photoUrl: data.photoUrl
        });
        
        if (updateResponse.ok) {
          queryClient.invalidateQueries({ queryKey: [`/api/animals/lookup/${animalId}`] });
          queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          setShowPhotoDialog(false);
          setPhotoPreview("");
          toast({
            title: "Photo updated!",
            description: "The profile picture has been updated successfully.",
          });
        } else {
          const errorData = await updateResponse.json();
          throw new Error(errorData.message || 'Failed to update animal record');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      setPhotoPreview("");
      toast({
        title: "Photo update failed",
        description: "Please try a different image file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getSpeciesColor = (species: string) => {
    switch (species) {
      case 'dog': return 'from-species-dog to-blue-600';
      case 'cat': return 'from-species-cat to-purple-600';
      case 'bird': return 'from-species-bird to-yellow-600';
      default: return 'from-species-other to-amber-600';
    }
  };

  const getVaccinationStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-success text-white">Fully Vaccinated</Badge>;
      case 'partial':
        return <Badge className="bg-accent text-white">Partially Vaccinated</Badge>;
      case 'not-vaccinated':
        return <Badge className="bg-destructive text-white">Not Vaccinated</Badge>;
      default:
        return <Badge variant="secondary">Unknown Status</Badge>;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-700 bg-green-50 border-green-200';
      case 'injured': return 'text-red-700 bg-red-50 border-red-200';
      case 'sick': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'recovering': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getVaccinationColor = (vaccineName: string) => {
    if (vaccineName.toLowerCase().includes('rabies')) return 'text-green-800 bg-green-50 border-green-200';
    if (vaccineName.toLowerCase().includes('dhpp') || vaccineName.toLowerCase().includes('distemper')) return 'text-blue-800 bg-blue-50 border-blue-200';
    return 'text-purple-800 bg-purple-50 border-purple-200';
  };

  if (animalLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (animalError || !animal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Animal Not Found</h2>
          <p className="text-gray-600 mb-4">
            The animal with ID "{animalId}" could not be found in our database.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className={`bg-gradient-to-r ${getSpeciesColor(animal.species)} text-white p-6`}>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 relative group">
                <div 
                  className="cursor-pointer relative"
                  onClick={() => setShowPhotoDialog(true)}
                >
                  {animal.photoUrl ? (
                    <img 
                      src={animal.photoUrl} 
                      alt={`${animal.species} ${animal.animalId}`}
                      className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-white/20 border-4 border-white shadow-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <div className="text-4xl">🐾</div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded-lg px-3 py-1 text-white text-sm">
                      Change Photo
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold">{animal.animalId}</h1>
                  {getVaccinationStatusBadge(animal.vaccinationStatus || 'unknown')}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-white/70 flex items-center mb-1">
                      <User className="w-4 h-4 mr-1" />
                      Species
                    </div>
                    <div className="font-semibold capitalize">{animal.species}</div>
                  </div>
                  <div>
                    <div className="text-white/70 flex items-center mb-1">
                      <User className="w-4 h-4 mr-1" />
                      Breed
                    </div>
                    <div className="font-semibold">{animal.breed || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-white/70 flex items-center mb-1">
                      <User className="w-4 h-4 mr-1" />
                      Gender
                    </div>
                    <div className="font-semibold capitalize">{animal.gender || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-white/70 flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      Age
                    </div>
                    <div className="font-semibold capitalize">{animal.age || 'Unknown'}</div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <QRCodeGenerator 
                  animalId={animal.animalId}
                  qrText={animal.qrCode || `${window.location.origin}/animal/${animal.animalId}`}
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Medical Records */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Syringe className="w-5 h-5 mr-2" />
                  Medical Records
                </h2>
                <div className="space-y-4">
                  {vaccinationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : vaccinations.length > 0 ? (
                    vaccinations.map((vaccination) => (
                      <Card key={vaccination.id} className={`border ${getVaccinationColor(vaccination.vaccineName)}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{vaccination.vaccineName}</h3>
                            <Badge variant="outline">Complete</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Date: <span className="font-medium">{vaccination.vaccinationDate}</span></div>
                            {vaccination.veterinarian && (
                              <div>Veterinarian: <span className="font-medium">{vaccination.veterinarian}</span></div>
                            )}
                            {vaccination.nextDueDate && (
                              <div>Next Due: <span className="font-medium">{vaccination.nextDueDate}</span></div>
                            )}
                            {vaccination.notes && (
                              <div>Notes: <span className="font-medium">{vaccination.notes}</span></div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Syringe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No vaccination records yet</p>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-primary hover:bg-green-700"
                    onClick={() => {
                      vaccinationForm.setValue("animalId", animal?.id || 0);
                      setShowVaccinationDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vaccination Record
                  </Button>
                </div>
              </div>

              {/* Location & Care History */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location & Details
                </h2>
                <div className="space-y-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location Information
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {animal.foundLocation && (
                          <div>Found: <span className="font-medium text-gray-900">{animal.foundLocation}</span></div>
                        )}
                        {animal.area && (
                          <div>District: <span className="font-medium text-gray-900">{animal.area}</span></div>
                        )}
                        <div>Registered: <span className="font-medium text-gray-900">
                          {animal.registeredAt ? new Date(animal.registeredAt).toLocaleDateString() : 'Unknown'}
                        </span></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Ruler className="w-4 h-4 mr-2" />
                        Physical Details
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {animal.size && (
                          <div>Size: <span className="font-medium text-gray-900 capitalize">{animal.size}</span></div>
                        )}
                        <div>Gender: <span className="font-medium text-gray-900 capitalize">{animal.gender || 'Unknown'}</span></div>
                        <div>Age Group: <span className="font-medium text-gray-900 capitalize">{animal.age || 'Unknown'}</span></div>
                      </div>
                    </CardContent>
                  </Card>

                  {animal.healthStatus && (
                    <Card className={`border ${getHealthStatusColor(animal.healthStatus)}`}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Health Status
                        </h3>
                        <div className="text-sm">
                          <div className="font-medium capitalize mb-2">{animal.healthStatus}</div>
                          {animal.medicalNotes && (
                            <p className="text-sm">{animal.medicalNotes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-primary hover:bg-green-700"
                  onClick={() => {
                    updateForm.reset({
                      species: animal?.species || "",
                      breed: animal?.breed || "",
                      gender: animal?.gender || "",
                      age: animal?.age || "",
                      size: animal?.size || "",
                      foundLocation: animal?.foundLocation || "",
                      area: animal?.area || "",
                      healthStatus: animal?.healthStatus || "healthy",
                      vaccinationStatus: animal?.vaccinationStatus || "not-vaccinated",
                      medicalNotes: animal?.medicalNotes || "",
                    });
                    setShowUpdateDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Update Record
                </Button>
                <Button 
                  className="bg-secondary hover:bg-blue-700"
                  onClick={() => {
                    vaccinationForm.setValue("animalId", animal?.id || 0);
                    setShowVaccinationDialog(true);
                  }}
                >
                  <Syringe className="mr-2 h-4 w-4" />
                  Add Vaccination
                </Button>
                <Button variant="outline">
                  <Share className="mr-2 h-4 w-4" />
                  Share Record
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Animal
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Animal Profile</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this animal profile? This action cannot be undone and will remove all associated vaccination records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAnimalMutation.mutate()}
                        disabled={deleteAnimalMutation.isPending}
                      >
                        {deleteAnimalMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Animal Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Animal Information</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit((data) => updateAnimalMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                          <SelectItem value="bird">Bird</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mixed breed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={updateForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="puppy">Puppy/Kitten (0-1 year)</SelectItem>
                          <SelectItem value="young">Young (1-3 years)</SelectItem>
                          <SelectItem value="adult">Adult (3-7 years)</SelectItem>
                          <SelectItem value="senior">Senior (7+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="extra-large">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="foundLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Found Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street address or landmark" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area/District</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Neighborhood or district" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="healthStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="injured">Injured</SelectItem>
                          <SelectItem value="sick">Sick</SelectItem>
                          <SelectItem value="recovering">Recovering</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="vaccinationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccination Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not-vaccinated">Not Vaccinated</SelectItem>
                          <SelectItem value="partial">Partially Vaccinated</SelectItem>
                          <SelectItem value="complete">Fully Vaccinated</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={updateForm.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Any medical conditions, treatments, or observations..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateAnimalMutation.isPending}
                  className="flex-1 bg-primary hover:bg-green-700"
                >
                  {updateAnimalMutation.isPending ? "Updating..." : "Update Information"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUpdateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Photo Change Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {photoPreview && (
              <div className="flex justify-center">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Select New Photo</Label>
              <div className="relative">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-sm text-gray-500">
                JPG, PNG or GIF up to 10MB
              </p>
            </div>
            {uploading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vaccination Dialog */}
      <Dialog open={showVaccinationDialog} onOpenChange={setShowVaccinationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vaccination Record</DialogTitle>
          </DialogHeader>
          <Form {...vaccinationForm}>
            <form onSubmit={vaccinationForm.handleSubmit((data) => addVaccinationMutation.mutate(data))} className="space-y-4">
              <FormField
                control={vaccinationForm.control}
                name="vaccineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vaccine Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Rabies, DHPP, FVRCP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vaccinationForm.control}
                name="vaccinationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vaccination Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vaccinationForm.control}
                name="veterinarian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinarian</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Dr. Smith or Clinic Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vaccinationForm.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due Date</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vaccinationForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        name={field.name}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        rows={2} 
                        placeholder="Any additional information..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={addVaccinationMutation.isPending}
                  className="flex-1 bg-primary hover:bg-green-700"
                >
                  {addVaccinationMutation.isPending ? "Adding..." : "Add Vaccination"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowVaccinationDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

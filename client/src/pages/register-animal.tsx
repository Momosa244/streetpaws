import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAnimalSchema, type InsertAnimal } from "@shared/schema";
import { Save, X, Upload } from "lucide-react";

export default function RegisterAnimal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const form = useForm<InsertAnimal>({
    resolver: zodResolver(insertAnimalSchema),
    defaultValues: {
      species: "",
      breed: "",
      gender: "",
      age: "",
      size: "",
      foundLocation: "",
      area: "",
      healthStatus: "healthy",
      vaccinationStatus: "not-vaccinated",
      medicalNotes: "",
      photoUrl: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertAnimal) => {
      const response = await apiRequest("POST", "/api/animals", data);
      return response.json();
    },
    onSuccess: (animal) => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Animal Registered Successfully!",
        description: `${animal.animalId} has been registered and QR code generated.`,
      });
      setLocation(`/animal/${animal.animalId}`);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register animal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAnimal) => {
    console.log("Submitting animal data:", data);
    console.log("Form errors:", form.formState.errors);
    registerMutation.mutate(data);
  };

  const [uploading, setUploading] = useState(false);

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

    // Upload file to server
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        form.setValue("photoUrl", data.photoUrl);
        toast({
          title: "Photo uploaded!",
          description: "Your animal photo is ready.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      setPhotoPreview("");
      toast({
        title: "Upload failed",
        description: "Please try a different image file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Register New Animal</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Animal Photo Upload */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <FormLabel>Animal Photo</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        {photoPreview ? (
                          <div className="relative">
                            <img 
                              src={photoPreview} 
                              alt="Animal preview" 
                              className="w-full h-32 object-cover rounded-lg mb-4"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoPreview("");
                                form.setValue("photoUrl", "");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Upload photo from gallery or camera</p>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-green-700 disabled:opacity-50"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = (e) => {
                                  const target = e.target as HTMLInputElement;
                                  if (target.files?.[0]) {
                                    const event = {
                                      target: { files: target.files }
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    handlePhotoUpload(event);
                                  }
                                };
                                input.click();
                              }}
                              disabled={uploading}
                              className="text-xs"
                            >
                              📷 Camera
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const target = e.target as HTMLInputElement;
                                  if (target.files?.[0]) {
                                    const event = {
                                      target: { files: target.files }
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    handlePhotoUpload(event);
                                  }
                                };
                                input.click();
                              }}
                              disabled={uploading}
                              className="text-xs"
                            >
                              🖼️ Gallery
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 text-center">
                            Use the buttons above or choose file to upload a photo
                          </p>
                          {uploading && (
                            <p className="text-xs text-blue-600">Uploading photo...</p>
                          )}
                          {photoPreview && !uploading && (
                            <p className="text-xs text-green-600">Photo ready!</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-6">
                      {/* Basic Information */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="species"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Species *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Species" />
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
                          control={form.control}
                          name="breed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breed (if known)</FormLabel>
                              <FormControl>
                                <Input placeholder="Mixed breed" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
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
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estimated Age</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Age Range" />
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
                      </div>

                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Size" />
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
                  </div>

                  {/* Location Information */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="foundLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Found Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address or landmark" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area/District</FormLabel>
                            <FormControl>
                              <Input placeholder="Neighborhood or district" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h4>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="healthStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Health Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={(field.value as string) || ""}>
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
                          control={form.control}
                          name="vaccinationStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vaccination Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={(field.value as string) || ""}>
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
                        control={form.control}
                        name="medicalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={3}
                                placeholder="Any medical conditions, treatments, or observations..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Registration Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        type="submit" 
                        disabled={registerMutation.isPending || uploading}
                        className="flex-1 bg-primary hover:bg-green-700 text-lg py-3"
                      >
                        <Save className="mr-2 h-5 w-5" />
                        {registerMutation.isPending ? "Registering..." : "Register Animal & Generate QR"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation("/")}
                        className="flex-1 text-lg py-3"
                        disabled={registerMutation.isPending}
                      >
                        <X className="mr-2 h-5 w-5" />
                        Cancel
                      </Button>
                    </div>
                    {registerMutation.isPending && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">Creating animal profile and generating QR code...</p>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

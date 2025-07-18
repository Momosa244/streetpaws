import { animals, vaccinations, helplines, type Animal, type InsertAnimal, type Vaccination, type InsertVaccination, type Helpline, type InsertHelpline } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and, sql } from "drizzle-orm";

export interface IStorage {
  // Animals
  getAnimal(id: number): Promise<Animal | undefined>;
  getAnimalByAnimalId(animalId: string): Promise<Animal | undefined>;
  getAllAnimals(): Promise<Animal[]>;
  searchAnimals(query: string, filters?: {
    species?: string;
    vaccinationStatus?: string;
    area?: string;
    healthStatus?: string;
  }): Promise<Animal[]>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  
  // Vaccinations
  getVaccinationsByAnimalId(animalId: number): Promise<Vaccination[]>;
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  
  // Helplines
  getAllHelplines(): Promise<Helpline[]>;
  createHelpline(helpline: InsertHelpline): Promise<Helpline>;
  
  // Stats
  getStats(): Promise<{
    registeredAnimals: number;
    vaccinated: number;
    qrCodes: number;
    helplines: number;
  }>;
}

export class MemStorage implements IStorage {
  private animals: Map<number, Animal>;
  private vaccinations: Map<number, Vaccination>;
  private helplines: Map<number, Helpline>;
  private currentAnimalId: number;
  private currentVaccinationId: number;
  private currentHelplineId: number;

  constructor() {
    this.animals = new Map();
    this.vaccinations = new Map();
    this.helplines = new Map();
    this.currentAnimalId = 1;
    this.currentVaccinationId = 1;
    this.currentHelplineId = 1;
    
    // Initialize with Bengaluru helplines
    this.initializeHelplines();
  }

  private initializeHelplines() {
    const bengaluruHelplines = [
      {
        name: "BBMP Animal Control Center",
        type: "24/7 Emergency Response",
        phone: "+91 80 2222 5384",
        hours: "Available 24/7",
        coverage: "Bengaluru City Corporation",
        description: "Official BBMP animal control for emergency response to injured, dangerous, or distressed animals across Bengaluru"
      },
      {
        name: "Cessna Lifeline Veterinary Hospital",
        type: "Medical Emergency Support",
        phone: "+91 80 2845 5555",
        hours: "Daily 9AM - 9PM",
        coverage: "Sarjapur Road, Electronic City",
        description: "24/7 emergency veterinary care and treatment for stray animals with specialized trauma unit"
      },
      {
        name: "Karuna Animal Shelter",
        type: "Rescue & Rehabilitation",
        phone: "+91 98450 44444",
        hours: "Daily 8AM - 6PM",
        coverage: "Peenya, Rajajinagar, Malleshwaram",
        description: "Non-profit animal rescue organization providing shelter, rehabilitation and adoption services"
      },
      {
        name: "CUPA Animal Ambulance",
        type: "Mobile Emergency Unit",
        phone: "+91 99000 25000",
        hours: "Available 24/7",
        coverage: "All Bengaluru Districts",
        description: "Compassion Unlimited Plus Action (CUPA) mobile veterinary services and emergency animal transport"
      },
      {
        name: "Krupa Animal Hospital",
        type: "Veterinary Medical Care",
        phone: "+91 80 2334 4321",
        hours: "Daily 10AM - 8PM",
        coverage: "Jayanagar, BTM Layout, Koramangala",
        description: "Full-service veterinary hospital offering medical care, surgery, and vaccination services for stray animals"
      }
    ];

    bengaluruHelplines.forEach(helpline => {
      const id = this.currentHelplineId++;
      this.helplines.set(id, { 
        ...helpline, 
        id,
        description: helpline.description || null
      });
    });
  }

  async getAnimal(id: number): Promise<Animal | undefined> {
    return this.animals.get(id);
  }

  async getAnimalByAnimalId(animalId: string): Promise<Animal | undefined> {
    return Array.from(this.animals.values()).find(
      (animal) => animal.animalId === animalId,
    );
  }

  async getAllAnimals(): Promise<Animal[]> {
    return Array.from(this.animals.values());
  }

  async searchAnimals(query: string, filters?: {
    species?: string;
    vaccinationStatus?: string;
    area?: string;
    healthStatus?: string;
  }): Promise<Animal[]> {
    let results = Array.from(this.animals.values());

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(animal =>
        animal.animalId.toLowerCase().includes(lowerQuery) ||
        animal.species.toLowerCase().includes(lowerQuery) ||
        animal.breed?.toLowerCase().includes(lowerQuery) ||
        animal.foundLocation?.toLowerCase().includes(lowerQuery) ||
        animal.area?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters) {
      if (filters.species) {
        results = results.filter(animal => animal.species === filters.species);
      }
      if (filters.vaccinationStatus) {
        results = results.filter(animal => animal.vaccinationStatus === filters.vaccinationStatus);
      }
      if (filters.area) {
        results = results.filter(animal => animal.area === filters.area);
      }
      if (filters.healthStatus) {
        results = results.filter(animal => animal.healthStatus === filters.healthStatus);
      }
    }

    return results;
  }

  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const id = this.currentAnimalId++;
    const animalId = `SP-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`;
    const qrCode = null; // QR code URL will be generated dynamically on the frontend
    
    const animal: Animal = {
      ...insertAnimal,
      id,
      animalId,
      qrCode,
      registeredAt: new Date(),
      area: insertAnimal.area || null,
      size: insertAnimal.size || null,
      breed: insertAnimal.breed || null,
      gender: insertAnimal.gender || null,
      age: insertAnimal.age || null,
      foundLocation: insertAnimal.foundLocation || null,
      healthStatus: insertAnimal.healthStatus || null,
      vaccinationStatus: insertAnimal.vaccinationStatus || null,
      medicalNotes: insertAnimal.medicalNotes || null,
      photoUrl: insertAnimal.photoUrl || null,
    };
    
    this.animals.set(id, animal);
    return animal;
  }

  async updateAnimal(id: number, updateData: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const animal = this.animals.get(id);
    if (!animal) return undefined;

    const updatedAnimal = { ...animal, ...updateData };
    this.animals.set(id, updatedAnimal);
    return updatedAnimal;
  }

  async deleteAnimal(id: number): Promise<boolean> {
    const animal = this.animals.get(id);
    if (!animal) return false;

    // Delete associated vaccinations first
    const vaccinationsToDelete = Array.from(this.vaccinations.entries())
      .filter(([_, vaccination]) => vaccination.animalId === id)
      .map(([vaccinationId, _]) => vaccinationId);
    
    vaccinationsToDelete.forEach(vaccinationId => {
      this.vaccinations.delete(vaccinationId);
    });

    // Delete the animal
    this.animals.delete(id);
    return true;
  }

  async getVaccinationsByAnimalId(animalId: number): Promise<Vaccination[]> {
    return Array.from(this.vaccinations.values()).filter(
      (vaccination) => vaccination.animalId === animalId,
    );
  }

  async createVaccination(insertVaccination: InsertVaccination): Promise<Vaccination> {
    const id = this.currentVaccinationId++;
    const vaccination: Vaccination = { 
      ...insertVaccination, 
      id,
      veterinarian: insertVaccination.veterinarian || null,
      nextDueDate: insertVaccination.nextDueDate || null,
      notes: insertVaccination.notes || null,
    };
    this.vaccinations.set(id, vaccination);
    return vaccination;
  }

  async getAllHelplines(): Promise<Helpline[]> {
    return Array.from(this.helplines.values());
  }

  async createHelpline(insertHelpline: InsertHelpline): Promise<Helpline> {
    const id = this.currentHelplineId++;
    const helpline: Helpline = { 
      ...insertHelpline, 
      id,
      description: insertHelpline.description || null,
    };
    this.helplines.set(id, helpline);
    return helpline;
  }

  async getStats(): Promise<{
    registeredAnimals: number;
    vaccinated: number;
    qrCodes: number;
    helplines: number;
  }> {
    const animals = Array.from(this.animals.values());
    const vaccinated = animals.filter(animal => 
      animal.vaccinationStatus === 'complete' || animal.vaccinationStatus === 'partial'
    ).length;

    return {
      registeredAnimals: animals.length,
      vaccinated,
      qrCodes: animals.length,
      helplines: this.helplines.size,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getAnimal(id: number): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.id, id));
    return animal || undefined;
  }

  async getAnimalByAnimalId(animalId: string): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.animalId, animalId));
    return animal || undefined;
  }

  async getAllAnimals(): Promise<Animal[]> {
    return await db.select().from(animals);
  }

  async searchAnimals(query: string, filters?: {
    species?: string;
    vaccinationStatus?: string;
    area?: string;
    healthStatus?: string;
  }): Promise<Animal[]> {
    let whereConditions = [];

    if (query) {
      // Sanitize the query to prevent SQL injection
      const sanitizedQuery = `%${query.replace(/[%_\\]/g, '\\$&')}%`;
      whereConditions.push(
        or(
          like(animals.animalId, sanitizedQuery),
          like(animals.species, sanitizedQuery),
          like(animals.breed, sanitizedQuery),
          like(animals.foundLocation, sanitizedQuery),
          like(animals.area, sanitizedQuery)
        )
      );
    }

    if (filters?.species) {
      whereConditions.push(eq(animals.species, filters.species));
    }
    if (filters?.vaccinationStatus) {
      whereConditions.push(eq(animals.vaccinationStatus, filters.vaccinationStatus));
    }
    if (filters?.area) {
      whereConditions.push(eq(animals.area, filters.area));
    }
    if (filters?.healthStatus) {
      whereConditions.push(eq(animals.healthStatus, filters.healthStatus));
    }

    if (whereConditions.length === 0) {
      return await db.select().from(animals);
    }

    return await db.select().from(animals).where(and(...whereConditions));
  }

  async createAnimal(insertAnimal: InsertAnimal): Promise<Animal> {
    const animalId = `SP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const qrCode = null; // QR code URL will be generated dynamically on the frontend
    
    const [animal] = await db
      .insert(animals)
      .values({
        ...insertAnimal,
        animalId,
        qrCode,
      })
      .returning();
    return animal;
  }

  async updateAnimal(id: number, updateData: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const [animal] = await db
      .update(animals)
      .set(updateData)
      .where(eq(animals.id, id))
      .returning();
    return animal || undefined;
  }

  async deleteAnimal(id: number): Promise<boolean> {
    try {
      // Delete associated vaccinations first
      await db.delete(vaccinations).where(eq(vaccinations.animalId, id));
      
      // Delete the animal
      const result = await db.delete(animals).where(eq(animals.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting animal:', error);
      return false;
    }
  }

  async getVaccinationsByAnimalId(animalId: number): Promise<Vaccination[]> {
    return await db.select().from(vaccinations).where(eq(vaccinations.animalId, animalId));
  }

  async createVaccination(insertVaccination: InsertVaccination): Promise<Vaccination> {
    const [vaccination] = await db
      .insert(vaccinations)
      .values(insertVaccination)
      .returning();
    return vaccination;
  }

  async getAllHelplines(): Promise<Helpline[]> {
    return await db.select().from(helplines);
  }

  async createHelpline(insertHelpline: InsertHelpline): Promise<Helpline> {
    const [helpline] = await db
      .insert(helplines)
      .values(insertHelpline)
      .returning();
    return helpline;
  }

  async getStats(): Promise<{
    registeredAnimals: number;
    vaccinated: number;
    qrCodes: number;
    helplines: number;
  }> {
    const [animalCount] = await db.select({ count: sql<number>`count(*)` }).from(animals);
    const [helplineCount] = await db.select({ count: sql<number>`count(*)` }).from(helplines);
    
    const vaccinatedAnimals = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(
        or(
          eq(animals.vaccinationStatus, 'complete'),
          eq(animals.vaccinationStatus, 'partial')
        )
      );

    return {
      registeredAnimals: animalCount.count,
      vaccinated: vaccinatedAnimals[0].count,
      qrCodes: animalCount.count,
      helplines: helplineCount.count,
    };
  }

  async initializeData(): Promise<void> {
    try {
      // Try to query helplines table - if it fails, tables don't exist
      const existingHelplines = await db.select().from(helplines);
      if (existingHelplines.length === 0) {
        await this.seedHelplines();
      }
    } catch (error) {
      console.log('Database tables may not exist, attempting to create them...');
      try {
        // Try to create tables by running a simple insert and catching the error
        await this.seedHelplines();
      } catch (seedError) {
        console.error('Failed to initialize database:', seedError);
        throw seedError;
      }
    }
  }

  private async seedHelplines(): Promise<void> {
      const bengaluruHelplines = [
        {
          name: "BBMP Animal Control Center",
          type: "24/7 Emergency Response",
          phone: "+91 80 2222 5384",
          hours: "Available 24/7",
          coverage: "Bengaluru City Corporation",
          description: "Official BBMP animal control for emergency response to injured, dangerous, or distressed animals across Bengaluru"
        },
        {
          name: "Cessna Lifeline Veterinary Hospital",
          type: "Medical Emergency Support",
          phone: "+91 80 2845 5555",
          hours: "Daily 9AM - 9PM",
          coverage: "Sarjapur Road, Electronic City",
          description: "24/7 emergency veterinary care and treatment for stray animals with specialized trauma unit"
        },
        {
          name: "Karuna Animal Shelter",
          type: "Rescue & Rehabilitation",
          phone: "+91 98450 44444",
          hours: "Daily 8AM - 6PM",
          coverage: "Peenya, Rajajinagar, Malleshwaram",
          description: "Non-profit animal rescue organization providing shelter, rehabilitation and adoption services"
        },
        {
          name: "CUPA Animal Ambulance",
          type: "Mobile Emergency Unit",
          phone: "+91 99000 25000",
          hours: "Available 24/7",
          coverage: "All Bengaluru Districts",
          description: "Compassion Unlimited Plus Action (CUPA) mobile veterinary services and emergency animal transport"
        },
        {
          name: "Krupa Animal Hospital",
          type: "Veterinary Medical Care",
          phone: "+91 80 2334 4321",
          hours: "Daily 10AM - 8PM",
          coverage: "Jayanagar, BTM Layout, Koramangala",
          description: "Full-service veterinary hospital offering medical care, surgery, and vaccination services for stray animals"
        }
      ];

      for (const helpline of bengaluruHelplines) {
        await db.insert(helplines).values(helpline);
      }
      console.log('Helplines data seeded successfully');
    }
}

export const storage = new DatabaseStorage();
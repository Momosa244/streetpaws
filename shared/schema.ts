import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  animalId: text("animal_id").notNull().unique(),
  species: text("species").notNull(), // dog, cat, bird, other
  breed: text("breed"),
  gender: text("gender"), // male, female, unknown
  age: text("age"), // puppy, young, adult, senior
  size: text("size"), // small, medium, large, extra-large
  foundLocation: text("found_location"),
  area: text("area"),
  healthStatus: text("health_status"), // healthy, injured, sick, recovering
  vaccinationStatus: text("vaccination_status"), // not-vaccinated, partial, complete, unknown
  medicalNotes: text("medical_notes"),
  photoUrl: text("photo_url"),
  qrCode: text("qr_code"),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull(),
  vaccineName: text("vaccine_name").notNull(),
  vaccinationDate: text("vaccination_date").notNull(),
  veterinarian: text("veterinarian"),
  nextDueDate: text("next_due_date"),
  notes: text("notes"),
});

export const helplines = pgTable("helplines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  phone: text("phone").notNull(),
  hours: text("hours").notNull(),
  coverage: text("coverage").notNull(),
  description: text("description"),
});

export const insertAnimalSchema = z.object({
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  size: z.string().optional(),
  foundLocation: z.string().optional(),
  area: z.string().optional(),
  healthStatus: z.string().optional(),
  vaccinationStatus: z.string().optional(),
  medicalNotes: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
});

export const insertHelplineSchema = createInsertSchema(helplines).omit({
  id: true,
});

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertHelpline = z.infer<typeof insertHelplineSchema>;
export type Helpline = typeof helplines.$inferSelect;

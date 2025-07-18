import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertAnimalSchema, insertVaccinationSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'animal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint with file system validation
  app.get("/api/health", async (req, res) => {
    try {
      // Check if uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const uploadsExist = fs.existsSync(uploadsDir);
      
      // Count files in uploads directory
      let fileCount = 0;
      if (uploadsExist) {
        const files = fs.readdirSync(uploadsDir);
        fileCount = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')).length;
      }
      
      res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        uploads: {
          directoryExists: uploadsExist,
          imageCount: fileCount
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Serve uploaded files statically with explicit path handling
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      // Set proper content type for images
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
      // Disable caching during development
      res.setHeader('Cache-Control', 'no-cache');
    }
  }));

  // Debug endpoint for checking specific images
  app.get("/uploads/:filename", (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    console.log(`[uploads] Requesting file: ${filename}`);
    console.log(`[uploads] Full path: ${filePath}`);
    console.log(`[uploads] File exists: ${fs.existsSync(filePath)}`);
    
    // Let express.static handle the actual file serving
    next();
  });

  // Photo upload endpoint with validation
  app.post("/api/upload", upload.single('photo'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Verify file was actually saved to disk
      const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
      if (!fs.existsSync(filePath)) {
        console.error(`[upload] File not found after upload: ${filePath}`);
        return res.status(500).json({ message: "File upload failed - file not saved" });
      }
      
      const photoUrl = `/uploads/${req.file.filename}`;
      console.log(`[upload] Successfully uploaded file: ${req.file.filename}`);
      res.json({ photoUrl });
    } catch (error) {
      console.error(`[upload] Upload error:`, error);
      // Clean up any partial files
      if (req.file?.filename) {
        const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(500).json({ message: "File upload failed" });
    }
  });
  // Get all animals
  app.get("/api/animals", async (req, res) => {
    try {
      const animals = await storage.getAllAnimals();
      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch animals" });
    }
  });

  // Search animals
  app.get("/api/animals/search", async (req, res) => {
    try {
      const { q, species, vaccinationStatus, area, healthStatus } = req.query;
      const animals = await storage.searchAnimals(q as string || "", {
        species: species as string,
        vaccinationStatus: vaccinationStatus as string,
        area: area as string,
        healthStatus: healthStatus as string,
      });
      res.json(animals);
    } catch (error) {
      res.status(500).json({ message: "Failed to search animals" });
    }
  });

  // Get animal by ID
  app.get("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const animal = await storage.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch animal" });
    }
  });

  // Get animal by animal ID (for QR code lookup)
  app.get("/api/animals/lookup/:animalId", async (req, res) => {
    try {
      const animalId = req.params.animalId;
      const animal = await storage.getAnimalByAnimalId(animalId);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch animal" });
    }
  });

  // Create new animal
  app.post("/api/animals", async (req, res) => {
    try {
      console.log("[create] Received data:", JSON.stringify(req.body, null, 2));
      
      const validatedData = insertAnimalSchema.parse(req.body);
      console.log("[create] Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Validate photo URL if provided
      if (validatedData.photoUrl) {
        const photoPath = validatedData.photoUrl.replace('/uploads/', '');
        const filePath = path.join(process.cwd(), 'uploads', photoPath);
        
        if (!fs.existsSync(filePath)) {
          console.error(`[create] Photo file not found: ${filePath}`);
          return res.status(400).json({ 
            message: "Photo file does not exist", 
            photoUrl: validatedData.photoUrl 
          });
        }
        console.log(`[create] Photo file validated: ${photoPath}`);
      }
      
      const animal = await storage.createAnimal(validatedData);
      console.log("[create] Animal created successfully:", animal.animalId);
      res.status(201).json(animal);
    } catch (error) {
      console.error("[create] Error creating animal:", error);
      if (error instanceof z.ZodError) {
        console.error("[create] Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create animal" });
    }
  });

  // Update animal
  app.patch("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAnimalSchema.partial().parse(req.body);
      
      // Validate photo URL if provided
      if (validatedData.photoUrl) {
        const photoPath = validatedData.photoUrl.replace('/uploads/', '');
        const filePath = path.join(process.cwd(), 'uploads', photoPath);
        
        if (!fs.existsSync(filePath)) {
          console.error(`[update] Photo file not found: ${filePath}`);
          return res.status(400).json({ 
            message: "Photo file does not exist", 
            photoUrl: validatedData.photoUrl 
          });
        }
        console.log(`[update] Photo file validated: ${photoPath}`);
      }
      
      const animal = await storage.updateAnimal(id, validatedData);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update animal" });
    }
  });

  // Delete animal
  app.delete("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get animal data before deletion to clean up photo file
      const animal = await storage.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      
      const success = await storage.deleteAnimal(id);
      if (!success) {
        return res.status(404).json({ message: "Animal not found" });
      }
      
      // Clean up associated photo file if exists
      if (animal.photoUrl) {
        const photoPath = animal.photoUrl.replace('/uploads/', '');
        const filePath = path.join(process.cwd(), 'uploads', photoPath);
        
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[delete] Cleaned up photo file: ${photoPath}`);
          } catch (error) {
            console.error(`[delete] Failed to cleanup photo file: ${photoPath}`, error);
          }
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`[delete] Delete animal error:`, error);
      res.status(500).json({ message: "Failed to delete animal" });
    }
  });

  // Get vaccinations for animal
  app.get("/api/animals/:id/vaccinations", async (req, res) => {
    try {
      const animalId = parseInt(req.params.id);
      const vaccinations = await storage.getVaccinationsByAnimalId(animalId);
      res.json(vaccinations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vaccinations" });
    }
  });

  // Add vaccination for animal
  app.post("/api/animals/:id/vaccinations", async (req, res) => {
    try {
      const animalId = parseInt(req.params.id);
      const validatedData = insertVaccinationSchema.parse({
        ...req.body,
        animalId,
      });
      const vaccination = await storage.createVaccination(validatedData);
      res.status(201).json(vaccination);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create vaccination" });
    }
  });

  // Get all helplines
  app.get("/api/helplines", async (req, res) => {
    try {
      const helplines = await storage.getAllHelplines();
      res.json(helplines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helplines" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Catch-all for undefined API routes - redirect to main website
  app.use("/api/*", (req, res) => {
    res.redirect("/");
  });

  const httpServer = createServer(app);
  return httpServer;
}

import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Incident } from "./models/Incident.js";
import { Resource } from "./models/Resource.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();

const allowedOrigins = ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const mongoURL = process.env.MONGO_URI || process.env.mongo_url || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sih-2k26";

const connectdb = async () => {
    try {
        await mongoose.connect(mongoURL);
        console.log("Database connected successfully");
    } catch (err) {
        console.error("Database connection failed:", err.message);
    }
};

const PORT = process.env.PORT || 5000;
const DISASTER_TYPES = [
    "Flood",
    "Landslide",
    "Cyclone",
    "Earthquake",
    "Fire",
    "Building Collapse",
    "Industrial Accident",
    "Other",
];
const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];
const RESOURCE_TYPES = [
    "Ambulance",
    "Rescue Team",
    "Fire & Rescue",
    "Boat",
    "Hospital",
    "Shelter",
    "Supply Point",
    "Medical Supply",
    "Relief Vehicle",
    "Other",
];
const RESOURCE_STATUS = ["AVAILABLE", "BUSY", "UNAVAILABLE"];

const normalizeMedia = (media) => {
    if (!media) return [];
    const list = Array.isArray(media) ? media : [media];
    return list
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 5);
};

const demoResources = [
    { name: "Ambulance Unit 1", type: "Ambulance", latitude: 22.2528, longitude: 84.9018, capacity: 2, status: "AVAILABLE" },
    { name: "Rescue Team Alpha", type: "Rescue Team", latitude: 22.2556, longitude: 84.9064, capacity: 8, status: "AVAILABLE" },
    { name: "Fire Station 2", type: "Fire & Rescue", latitude: 22.2472, longitude: 84.8987, capacity: 6, status: "BUSY" },
    { name: "River Patrol Boat", type: "Boat", latitude: 22.2497, longitude: 84.9128, capacity: 4, status: "AVAILABLE" },
    { name: "Rourkela Medical Center", type: "Hospital", latitude: 22.2564, longitude: 84.9047, capacity: 20, status: "AVAILABLE" },
    { name: "North Shelter Hub", type: "Shelter", latitude: 22.2612, longitude: 84.9078, capacity: 40, status: "AVAILABLE" },
    { name: "Supply Point East", type: "Supply Point", latitude: 22.2508, longitude: 84.9112, capacity: 30, status: "BUSY" },
    { name: "Medical Supply Depot", type: "Medical Supply", latitude: 22.2489, longitude: 84.8965, capacity: 25, status: "AVAILABLE" },
    { name: "Relief Van 3", type: "Relief Vehicle", latitude: 22.2544, longitude: 84.9146, capacity: 12, status: "UNAVAILABLE" },
];

const ensureDemoResources = async () => {
    try {
        const existingCount = await Resource.countDocuments();
        if (existingCount > 0) return;

        const seedResources = demoResources.map((resource) => ({
            ...resource,
            resourceId: Resource.generateResourceId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const created = await Resource.insertMany(seedResources);
        console.log(`[Demo Resources Seeded] ${created.length} resources added to database.`);
    } catch (err) {
        console.error("Error seeding demo resources:", err.message);
    }
};

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.get("/api/incidents", async (req, res) => {
    try {
        const { mobileNumber } = req.query;
        const filter = mobileNumber ? { mobileNumber: String(mobileNumber).trim() } : {};
        const incidents = await Incident.find(filter).sort({ createdAt: -1 });
        res.status(200).json(incidents);
    } catch (err) {
        console.error("Error retrieving incidents:", err);
        res.status(500).json({ error: "Failed to retrieve incidents" });
    }
});

app.post("/api/incidents", async (req, res) => {
    try {
        const {
            name,
            latitude,
            longitude,
            locationAccuracy,
            disasterType,
            peopleAffected,
            severity,
            description,
            media,
            image,
            mobileNumber,
            notes,
        } = req.body;

        if (!name || latitude === undefined || longitude === undefined || !mobileNumber) {
            return res.status(400).json({ error: "Name, latitude, longitude, and mobileNumber are required fields" });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const accuracy = locationAccuracy === undefined ? 0 : Number(locationAccuracy);
        const affectedCount = peopleAffected === undefined ? 0 : Number(peopleAffected);
        const normalizedType = disasterType || "Other";
        const normalizedSeverity = severity || "Medium";
        const normalizedDescription = (description || notes || "").trim();
        const normalizedMedia = normalizeMedia(media || image);

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ error: "GPS latitude must be a valid coordinate between -90 and 90." });
        }

        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ error: "GPS longitude must be a valid coordinate between -180 and 180." });
        }

        if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 10000) {
            return res.status(400).json({ error: "Location accuracy must be a non-negative number in meters." });
        }

        if (!DISASTER_TYPES.includes(normalizedType)) {
            return res.status(400).json({ error: "Invalid disaster type provided." });
        }

        if (!Number.isFinite(affectedCount) || affectedCount < 0 || !Number.isInteger(affectedCount)) {
            return res.status(400).json({ error: "People affected must be a non-negative integer." });
        }

        if (!SEVERITY_LEVELS.includes(normalizedSeverity)) {
            return res.status(400).json({ error: "Invalid severity level provided." });
        }

        if (!normalizedDescription || normalizedDescription.length < 5 || normalizedDescription.length > 1000) {
            return res.status(400).json({ error: "Description is required and must be between 5 and 1000 characters." });
        }

        if (normalizedMedia.length > 5) {
            return res.status(400).json({ error: "A maximum of 5 media files can be attached to a report." });
        }

        const newIncident = new Incident({
            incidentId: Incident.generateIncidentId(),
            name: String(name).trim(),
            latitude: lat,
            longitude: lng,
            locationAccuracy: accuracy,
            disasterType: normalizedType,
            peopleAffected: affectedCount,
            severity: normalizedSeverity,
            description: normalizedDescription,
            media: normalizedMedia,
            image: image || (normalizedMedia[0] || null),
            mobileNumber: String(mobileNumber).trim(),
            notes: notes || normalizedDescription,
            status: "UNASSIGNED",
            updatedAt: new Date(),
        });

        await newIncident.save();
        console.log(`[Incident Reported] ${newIncident.incidentId} | ${name} | ${mobileNumber} | ${normalizedType}`);
        res.status(201).json({ success: true, data: newIncident });
    } catch (err) {
        console.error("Error creating incident:", err);
        res.status(500).json({ error: "Failed to save incident report" });
    }
});

app.delete("/api/incidents/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Incident.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: "Incident report not found" });
        }
        console.log(`[Incident Deleted] ID: ${id}`);
        res.status(200).json({ success: true, message: "Incident report deleted successfully" });
    } catch (err) {
        console.error("Error deleting incident:", err);
        res.status(500).json({ error: "Failed to delete incident report" });
    }
});

app.get("/api/resources", async (req, res) => {
    try {
        const resources = await Resource.find({}).sort({ createdAt: -1 });
        res.status(200).json(resources);
    } catch (err) {
        console.error("Error retrieving resources:", err);
        res.status(500).json({ error: "Failed to retrieve resources" });
    }
});

app.post("/api/resources", async (req, res) => {
    try {
        const { name, type, latitude, longitude, capacity, status } = req.body;

        if (!name || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: "Name, latitude, and longitude are required." });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const normalizedType = type || "Other";
        const normalizedStatus = status || "AVAILABLE";
        const normalizedCapacity = capacity === undefined ? 0 : Number(capacity);

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ error: "Latitude must be between -90 and 90." });
        }

        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ error: "Longitude must be between -180 and 180." });
        }

        if (!RESOURCE_TYPES.includes(normalizedType)) {
            return res.status(400).json({ error: "Invalid resource type provided." });
        }

        if (!RESOURCE_STATUS.includes(normalizedStatus)) {
            return res.status(400).json({ error: "Invalid resource status provided." });
        }

        if (!Number.isFinite(normalizedCapacity) || normalizedCapacity < 0) {
            return res.status(400).json({ error: "Capacity must be a non-negative number." });
        }

        const newResource = new Resource({
            resourceId: Resource.generateResourceId(),
            name: String(name).trim(),
            type: normalizedType,
            latitude: lat,
            longitude: lng,
            capacity: Math.round(normalizedCapacity),
            status: normalizedStatus,
            updatedAt: new Date(),
        });

        await newResource.save();
        res.status(201).json({ success: true, data: newResource });
    } catch (err) {
        console.error("Error creating resource:", err);
        res.status(500).json({ error: "Failed to create resource" });
    }
});

app.put("/api/resources/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, latitude, longitude, capacity, status } = req.body;

        const updatePayload = {};
        if (name !== undefined) updatePayload.name = String(name).trim();
        if (type !== undefined) {
            if (!RESOURCE_TYPES.includes(type)) {
                return res.status(400).json({ error: "Invalid resource type provided." });
            }
            updatePayload.type = type;
        }
        if (latitude !== undefined) {
            const lat = Number(latitude);
            if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({ error: "Latitude must be between -90 and 90." });
            }
            updatePayload.latitude = lat;
        }
        if (longitude !== undefined) {
            const lng = Number(longitude);
            if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
                return res.status(400).json({ error: "Longitude must be between -180 and 180." });
            }
            updatePayload.longitude = lng;
        }
        if (capacity !== undefined) {
            const cap = Number(capacity);
            if (!Number.isFinite(cap) || cap < 0) {
                return res.status(400).json({ error: "Capacity must be a non-negative number." });
            }
            updatePayload.capacity = Math.round(cap);
        }
        if (status !== undefined) {
            if (!RESOURCE_STATUS.includes(status)) {
                return res.status(400).json({ error: "Invalid resource status provided." });
            }
            updatePayload.status = status;
        }

        updatePayload.updatedAt = new Date();

        const updatedResource = await Resource.findByIdAndUpdate(id, updatePayload, { new: true });
        if (!updatedResource) {
            return res.status(404).json({ error: "Resource not found" });
        }

        res.status(200).json({ success: true, data: updatedResource });
    } catch (err) {
        console.error("Error updating resource:", err);
        res.status(500).json({ error: "Failed to update resource" });
    }
});

app.delete("/api/resources/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Resource.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: "Resource not found" });
        }
        res.status(200).json({ success: true, message: "Resource deleted successfully" });
    } catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

app.listen(PORT, async () => {
    await connectdb();
    await ensureDemoResources();
    console.log(`Server started on port ${PORT}`);
});
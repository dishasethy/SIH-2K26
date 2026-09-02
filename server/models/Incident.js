import mongoose from "mongoose";

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
const INCIDENT_STATUS = ["UNASSIGNED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const IncidentSchema = new mongoose.Schema({
    incidentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    locationAccuracy: {
        type: Number,
        default: 0,
        min: 0
    },
    disasterType: {
        type: String,
        enum: DISASTER_TYPES,
        required: true,
        default: "Other"
    },
    peopleAffected: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    severity: {
        type: String,
        enum: SEVERITY_LEVELS,
        required: true,
        default: "Medium"
    },
    description: {
        type: String,
        required: true,
        trim: true,
        default: ""
    },
    media: [{
        type: String,
        default: []
    }],
    image: {
        type: String,
        required: false
    },
    mobileNumber: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: INCIDENT_STATUS,
        default: "UNASSIGNED"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

IncidentSchema.statics.generateIncidentId = function () {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INC-${datePart}-${randomPart}`;
};

export const Incident = mongoose.model("Incident", IncidentSchema);

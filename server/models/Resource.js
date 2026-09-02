import mongoose from "mongoose";

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

const ResourceSchema = new mongoose.Schema({
    resourceId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: RESOURCE_TYPES,
        required: true,
        default: "Other",
    },
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
    },
    capacity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    status: {
        type: String,
        enum: RESOURCE_STATUS,
        required: true,
        default: "AVAILABLE",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

ResourceSchema.statics.generateResourceId = function () {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RES-${datePart}-${randomPart}`;
};

export const Resource = mongoose.model("Resource", ResourceSchema);

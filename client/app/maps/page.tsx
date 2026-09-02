"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DashboardLayout from "@/app/components/dash_user/DashboardLayout";
import { MapPin, RefreshCw, AlertTriangle, Clock3 } from "lucide-react";
import { apiUrl } from "@/lib/api";

// Dynamically import map component with no SSR to support browser window APIs
const MapComponent = dynamic(
  () => import("@/app/components/dash_user/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-300 rounded-3xl space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold animate-pulse">Initializing GIS Maps...</p>
      </div>
    ),
  }
);

interface IncidentReport {
  _id: string;
  incidentId?: string;
  name: string;
  mobileNumber: string;
  latitude: number;
  longitude: number;
  locationAccuracy?: number;
  disasterType?: string;
  peopleAffected?: number;
  severity?: string;
  description?: string;
  notes?: string;
  image?: string;
  media?: string[];
  status?: string;
  createdAt: string;
}

export default function MapsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/incidents"));
      if (!response.ok) {
        throw new Error("Failed to load map incidents.");
      }
      const data = await response.json();
      setIncidents(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to database API. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getSeverityStyles = (severity?: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "High":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase mb-1 flex items-center gap-2">
              <MapPin className="h-7 w-7 text-emerald-600" /> GIS Coordinates Map
            </h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Interactive map overlays of all incident reports and emergency markers.
            </p>
          </div>
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-slate-600 hover:text-emerald-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Map</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-semibold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Map Rendering Container */}
        <div className="relative">
          <MapComponent incidents={incidents} />
        </div>

      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/dash_user/DashboardLayout";
import { Bell, User, Phone, MapPin, Calendar, FileText, RefreshCw, Eye } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface IncidentReport {
  _id: string;
  name: string;
  mobileNumber: string;
  latitude: number;
  longitude: number;
  notes?: string;
  image?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/incidents"));
      if (!response.ok) {
        throw new Error("Failed to retrieve coordination data.");
      }

      const data = await response.json();
      setIncidents(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to coordination API. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase mb-1 flex items-center gap-2">
              <Bell className="h-7 w-7 text-emerald-600 animate-bounce" /> Notifications
            </h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Real-time feed of reported incidents and responder updates.
            </p>
          </div>
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-slate-600 hover:text-emerald-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-semibold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Synchronizing Command Log...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="neu-flat p-12 rounded-3xl text-center">
            <p className="text-slate-500 text-sm font-semibold">No incident alerts reported yet.</p>
            <p className="text-slate-400 text-xs mt-1">New coordination updates will appear in this feed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {incidents.map((incident) => (
              <div
                key={incident._id}
                className="neu-flat p-6 rounded-3xl relative overflow-hidden group transition-all duration-300 hover:scale-[1.005] hover:shadow-lg flex flex-col md:flex-row gap-6"
              >
                {/* Image Section */}
                {incident.image && (
                  <div className="md:w-48 shrink-0 relative rounded-2xl overflow-hidden shadow-inner bg-slate-900 flex items-center justify-center min-h-35">
                    <img
                      src={incident.image}
                      alt="Incident scene"
                      className="w-full h-full object-cover max-h-40 cursor-zoom-in"
                      onClick={() => setSelectedImage(incident.image || null)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Eye className="text-white h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Detail Section */}
                <div className="flex-1 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                        <User className="h-4.5 w-4.5 text-emerald-600" /> {incident.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(incident.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{incident.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        Lat: {incident.latitude.toFixed(4)}, Lon: {incident.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {incident.notes && (
                    <div className="neu-sunken p-4 rounded-xl text-slate-600 text-xs leading-relaxed flex items-start gap-2">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{incident.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 p-2 shadow-2xl relative">
            <img
              src={selectedImage}
              alt="Enlarged incident photograph"
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

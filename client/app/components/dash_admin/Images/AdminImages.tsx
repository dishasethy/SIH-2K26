"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Eye, AlertTriangle, MapPin, Calendar } from "lucide-react";
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

export default function AdminImages() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/incidents"));
      if (!response.ok) {
        throw new Error("Failed to load images");
      }

      const data = await response.json();
      const reportsWithImages = (data || []).filter((report: IncidentReport) => report.image);
      setReports(reportsWithImages);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load report images. Please check the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between border-b border-green-200/55 pb-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Eye className="h-5 w-5 text-emerald-600" /> Submitted Incident Images
        </h3>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-flat-interactive text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Loading images...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="neu-flat p-12 rounded-3xl text-center">
          <p className="text-slate-500 text-sm font-semibold">No incident photos available.</p>
          <p className="text-slate-400 text-xs mt-1 uppercase">Images from user reports will show here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report._id}
              className="neu-flat rounded-3xl overflow-hidden group transition-all duration-300 hover:shadow-md"
            >
              <div className="relative h-60 overflow-hidden bg-slate-900">
                <img
                  src={report.image}
                  alt={`${report.name} report`}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setSelectedImage(report.image || null)}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-7 w-7 text-white" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold uppercase text-slate-800">{report.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                    </span>
                  </div>
                  {report.notes && (
                    <p className="line-clamp-3 text-slate-500 leading-relaxed">{report.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { User, Phone, MapPin, Calendar, FileText, Trash2, RefreshCw, Eye, Search, AlertCircle } from "lucide-react";
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

export default function AdminUserReports() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/incidents"));
      if (!response.ok) {
        throw new Error("Failed to load user reports");
      }
      const data = await response.json();
      setReports(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to database. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to dismiss and delete this report from the database?")) return;

    setActionStatus("Processing deletion...");
    try {
      const response = await fetch(apiUrl(`/api/incidents/${id}`), {
        method: "DELETE",
      });

      if (response.ok) {
        setActionStatus("Report deleted successfully!");
        setReports((prev) => prev.filter((r) => r._id !== id));
        setTimeout(() => setActionStatus(null), 2000);
      } else {
        const errData = await response.json();
        alert(errData.error || "Failed to delete report.");
        setActionStatus(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error: Could not complete deletion.");
      setActionStatus(null);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.mobileNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800 flex items-center gap-2">
            <AlertCircle className="h-5.5 w-5.5 text-emerald-600 animate-pulse" /> User Submissions
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            Review and manage reports received from coordination units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="neu-sunken rounded-xl flex items-center px-3 py-2 w-full max-w-[240px]">
            <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs placeholder-slate-400 font-medium w-full text-foreground"
            />
          </div>

          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-slate-600 hover:text-emerald-700 shrink-0"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl uppercase tracking-wider animate-pulse">
          {actionStatus}
        </div>
      )}

      {/* Error block */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider border border-red-200">
          {error}
        </div>
      )}

      {/* Reports Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Retrieving submissions...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="neu-flat p-12 rounded-3xl text-center">
          <p className="text-slate-500 text-sm font-semibold">No incident alerts logged.</p>
          <p className="text-slate-400 text-xs mt-1 uppercase">Any submissions will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="neu-flat p-6 rounded-3xl relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Image Section */}
                {report.image && (
                  <div className="w-full h-48 relative rounded-2xl overflow-hidden shadow-inner bg-slate-900 flex items-center justify-center">
                    <img
                      src={report.image}
                      alt="Submitted scene"
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setSelectedImage(report.image || null)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Eye className="text-white h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Submitter Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                      <User className="h-4.5 w-4.5 text-emerald-600" /> {report.name}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Core parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <a
                    href={`tel:${report.mobileNumber}`}
                    className="flex items-center gap-2 text-slate-500 font-medium hover:text-emerald-700 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{report.mobileNumber}</span>
                  </a>
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {report.notes && (
                  <div className="neu-sunken p-4 rounded-xl text-slate-600 text-xs leading-relaxed flex items-start gap-2">
                    <FileText className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{report.notes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200/50 flex justify-end">
                <button
                  onClick={() => handleDelete(report._id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Dismiss Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
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

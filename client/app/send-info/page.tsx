"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/app/components/dash_user/DashboardLayout";
import { Send, MapPin, Upload, Phone, User, FileText, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { apiUrl } from "@/lib/api";

const disasterOptions = [
  "Flood",
  "Landslide",
  "Cyclone",
  "Earthquake",
  "Fire",
  "Building Collapse",
  "Industrial Accident",
  "Other",
];

const severityOptions = ["Low", "Medium", "High", "Critical"];

export default function SendInfoPage() {
  const { data: session } = useSession();
  const sessionPhone = (session?.user as any)?.phone || "";
  const sessionName = session?.user?.name || "";

  const [formData, setFormData] = useState({
    name: sessionName,
    mobileNumber: sessionPhone,
    latitude: "",
    longitude: "",
    locationAccuracy: "",
    disasterType: "Flood",
    peopleAffected: "0",
    severity: "Medium",
    description: "",
  });
  const [mediaFiles, setMediaFiles] = useState<Array<{ type: "image" | "video"; url: string }>>([]);
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message: string }>({
    type: null,
    message: "",
  });

  useEffect(() => {
    if (sessionName) {
      setFormData((prev) => ({ ...prev, name: sessionName }));
    }
    if (sessionPhone) {
      setFormData((prev) => ({ ...prev, mobileNumber: sessionPhone }));
    }
  }, [sessionName, sessionPhone]);

  const detectedLocationText = useMemo(() => {
    if (!formData.latitude || !formData.longitude) return "No location captured yet";
    return `${formData.latitude}, ${formData.longitude}${formData.locationAccuracy ? ` • ±${formData.locationAccuracy} m` : ""}`;
  }, [formData.latitude, formData.longitude, formData.locationAccuracy]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStatus({ type: "error", message: "Geolocation is not supported by your browser." });
      return;
    }

    setStatus({ type: "loading", message: "Detecting emergency location..." });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          locationAccuracy: Math.round(position.coords.accuracy).toString(),
        }));
        setStatus({ type: "success", message: "GPS location captured successfully." });
        setTimeout(() => setStatus({ type: null, message: "" }), 2200);
      },
      (error) => {
        console.error("Location error:", error);
        setStatus({ type: "error", message: "Unable to fetch GPS location. Please allow location access." });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/", "video/"];
    if (!allowedTypes.some((prefix) => file.type.startsWith(prefix))) {
      setStatus({ type: "error", message: "Please upload an image or video only." });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatus({ type: "error", message: "Uploaded file must be 10MB or smaller." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const nextEntry: { type: "image" | "video"; url: string } = {
        type: file.type.startsWith("video/") ? "video" : "image",
        url: base64String,
      };

      setMediaFiles((prev) => [nextEntry, ...prev].slice(0, 2));
      setStatus({ type: "success", message: "Evidence attached successfully." });
      setTimeout(() => setStatus({ type: null, message: "" }), 1500);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      name,
      mobileNumber,
      latitude,
      longitude,
      locationAccuracy,
      disasterType,
      peopleAffected,
      severity,
      description,
    } = formData;

    if (!name || !mobileNumber) {
      setStatus({ type: "error", message: "Reporter name and contact are required." });
      return;
    }

    if (!latitude || !longitude) {
      setStatus({ type: "error", message: "Your GPS location is required before submitting." });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const affectedCount = Number(peopleAffected);
    const accuracy = Number(locationAccuracy || 0);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setStatus({ type: "error", message: "Latitude is invalid." });
      return;
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setStatus({ type: "error", message: "Longitude is invalid." });
      return;
    }

    if (!Number.isInteger(affectedCount) || affectedCount < 0) {
      setStatus({ type: "error", message: "People affected must be a non-negative number." });
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setStatus({ type: "error", message: "Please add a brief description of the emergency." });
      return;
    }

    if (accuracy < 0 || accuracy > 10000) {
      setStatus({ type: "error", message: "Location accuracy is invalid." });
      return;
    }

    setStatus({ type: "loading", message: "Submitting emergency report..." });

    const mediaUrls = mediaFiles.map((item) => item.url);

    try {
      const response = await fetch(apiUrl("/api/incidents"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobileNumber,
          latitude: lat,
          longitude: lng,
          locationAccuracy: accuracy,
          disasterType,
          peopleAffected: affectedCount,
          severity,
          description: description.trim(),
          media: mediaUrls,
          image: mediaUrls[0] || null,
          notes: description.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({ type: "success", message: "Emergency report submitted successfully." });
        setFormData({
          name: sessionName,
          mobileNumber: sessionPhone,
          latitude: "",
          longitude: "",
          locationAccuracy: "",
          disasterType: "Flood",
          peopleAffected: "0",
          severity: "Medium",
          description: "",
        });
        setMediaFiles([]);
      } else {
        setStatus({ type: "error", message: result.error || "Failed to submit emergency report." });
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus({ type: "error", message: "Network connection to backend failed." });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight uppercase mb-2">Citizen Emergency Report</h2>
          <p className="text-slate-500 text-xs">Share critical local conditions with the coordination command center.</p>
        </div>

        {status.type && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 transition-all duration-300 animate-pulse ${
              status.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800"
                : status.type === "error"
                ? "bg-red-500/10 border border-red-500/30 text-red-800"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-800"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <div className="text-xs font-semibold uppercase tracking-wider">{status.message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="neu-flat p-6 md:p-8 rounded-3xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Full Name <span className="text-red-500">*</span>
              </label>
              <div className="neu-sunken neu-sunken-focus rounded-xl flex items-center px-3 py-2.5">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-slate-400 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Contact Number <span className="text-red-500">*</span>
              </label>
              <div className="neu-sunken neu-sunken-focus rounded-xl flex items-center px-3 py-2.5">
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder={sessionPhone ? "Using your account phone number" : "Enter mobile number"}
                  readOnly={!!sessionPhone}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-slate-400 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Location <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-slate-600 hover:text-emerald-700"
              >
                <MapPin className="h-3.5 w-3.5" /> Auto-detect GPS
              </button>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 font-medium">
              {detectedLocationText}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Disaster Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.disasterType}
                onChange={(e) => setFormData((prev) => ({ ...prev, disasterType: e.target.value }))}
                className="w-full rounded-xl neu-sunken py-2.5 px-3 text-sm text-slate-200 outline-none border border-slate-700/50 bg-slate-950/40"
              >
                {disasterOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-900 text-white">{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> People Affected <span className="text-red-500">*</span>
              </label>
              <div className="neu-sunken neu-sunken-focus rounded-xl flex items-center px-3 py-2.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.peopleAffected}
                  onChange={(e) => setFormData((prev) => ({ ...prev, peopleAffected: e.target.value }))}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder-slate-400 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData((prev) => ({ ...prev, severity: e.target.value }))}
                className="w-full rounded-xl neu-sunken py-2.5 px-3 text-sm text-slate-200 outline-none border border-slate-700/50 bg-slate-950/40"
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-900 text-white">{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Accuracy
              </label>
              <div className="neu-sunken neu-sunken-focus rounded-xl flex items-center px-3 py-2.5 text-sm text-slate-200">
                {formData.locationAccuracy ? `±${formData.locationAccuracy} m` : "Not yet detected"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Description <span className="text-red-500">*</span>
            </label>
            <div className="neu-sunken neu-sunken-focus rounded-xl p-3">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Briefly describe what is happening and any immediate danger."
                className="w-full bg-transparent border-none outline-none text-sm placeholder-slate-400 font-medium resize-none text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Evidence (Optional)
            </label>
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {mediaFiles.map((entry, index) => (
                    <div key={`${entry.type}-${index}`} className="rounded-xl overflow-hidden border border-slate-300 bg-slate-950/30">
                      {entry.type === "image" ? (
                        <img src={entry.url} alt="Evidence preview" className="max-h-56 w-full object-cover" />
                      ) : (
                        <video src={entry.url} controls className="max-h-56 w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl neu-green-flat text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Submit Emergency Report</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Clock3, Info, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface IncidentReport {
  _id: string;
  incidentId?: string;
  name: string;
  mobileNumber: string;
  latitude: number;
  longitude: number;
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

interface ResourceEntry {
  _id: string;
  resourceId?: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

const resourceTypes = [
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

const severityLevels = ["Low", "Medium", "High", "Critical"];
const incidentStatuses = ["UNASSIGNED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const resourceStatuses = ["AVAILABLE", "BUSY", "UNAVAILABLE"];

const MapComponent = dynamic(() => import("@/app/components/dash_user/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-300 rounded-2xl space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold animate-pulse">Initializing GIS Maps...</p>
    </div>
  ),
});

const defaultResourceForm = {
  name: "",
  type: "Ambulance",
  latitude: 22.2525,
  longitude: 84.9035,
  capacity: 4,
  status: "AVAILABLE",
};

export default function AdminMap() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [disasterFilter, setDisasterFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [resourceForm, setResourceForm] = useState(defaultResourceForm);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const response = await fetch(apiUrl("/api/incidents"));
      if (!response.ok) throw new Error("Failed to load incidents");
      const data = await response.json();
      setIncidents(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the incidents API.");
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(apiUrl("/api/resources"));
      if (!response.ok) throw new Error("Failed to load resources");
      const data = await response.json();
      setResources(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the resources API.");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchIncidents(), fetchResources()]);
    setLoading(false);
  };

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

  const getResourceStatusStyles = (status?: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      case "BUSY":
        return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "UNAVAILABLE":
        return "bg-slate-500/10 text-slate-700 border-slate-200";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-200";
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const severityMatch = severityFilter === "All" || incident.severity === severityFilter;
      const disasterMatch = disasterFilter === "All" || incident.disasterType === disasterFilter;
      const statusMatch = statusFilter === "All" || incident.status === statusFilter;
      return severityMatch && disasterMatch && statusMatch;
    });
  }, [incidents, severityFilter, disasterFilter, statusFilter]);

  const stats = useMemo(() => {
    const criticalIncidents = incidents.filter((incident) => incident.severity === "Critical").length;
    const activeIncidents = incidents.filter((incident) => !["RESOLVED", "CLOSED"].includes(incident.status || "")).length;
    const availableResources = resources.filter((resource) => resource.status === "AVAILABLE").length;
    return {
      criticalIncidents,
      activeIncidents,
      availableResources,
      totalResources: resources.length,
    };
  }, [incidents, resources]);

  useEffect(() => {
    loadAllData();
  }, []);

  const resetForm = () => {
    setResourceForm(defaultResourceForm);
    setEditingResourceId(null);
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setResourceForm((prev) => ({ ...prev, latitude: Number(latlng.lat.toFixed(5)), longitude: Number(latlng.lng.toFixed(5)) }));
  };

  const handleSubmitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...resourceForm,
      latitude: Number(resourceForm.latitude),
      longitude: Number(resourceForm.longitude),
      capacity: Number(resourceForm.capacity),
    };

    const url = editingResourceId ? apiUrl(`/api/resources/${editingResourceId}`) : apiUrl("/api/resources");
    const method = editingResourceId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save resource");
      }

      resetForm();
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Unable to save resource.");
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const response = await fetch(apiUrl(`/api/resources/${id}`), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete resource");
      if (selectedResourceId === id) setSelectedResourceId(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || "Unable to delete resource.");
    }
  };

  const handleEditResource = (resource: ResourceEntry) => {
    setEditingResourceId(resource._id);
    setSelectedResourceId(resource._id);
    setResourceForm({
      name: resource.name,
      type: resource.type,
      latitude: resource.latitude,
      longitude: resource.longitude,
      capacity: resource.capacity,
      status: resource.status,
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl w-full mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="neu-flat p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Critical Incidents</p>
          <p className="mt-2 text-3xl font-black text-red-600">{stats.criticalIncidents}</p>
        </div>
        <div className="neu-flat p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Active Incidents</p>
          <p className="mt-2 text-3xl font-black text-amber-500">{stats.activeIncidents}</p>
        </div>
        <div className="neu-flat p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Available Resources</p>
          <p className="mt-2 text-3xl font-black text-emerald-500">{stats.availableResources}</p>
        </div>
        <div className="neu-flat p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Total Resources</p>
          <p className="mt-2 text-3xl font-black text-sky-500">{stats.totalResources}</p>
        </div>
      </div>

      <div className="w-full neu-flat p-6 rounded-3xl relative flex flex-col justify-between min-h-[650px]">
        <div className="flex items-center justify-between border-b border-green-200/55 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Unified Authority Control Center</h4>
          </div>
          <button
            onClick={loadAllData}
            className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider neu-flat-interactive cursor-pointer text-slate-500 hover:text-emerald-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider border border-red-200">
            {error}
          </div>
        )}

        <div className="relative flex-1 neu-sunken rounded-2xl min-h-[480px] z-10 overflow-hidden">
          {loading ? (
            <div className="h-[480px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Loading live GIS data...</p>
            </div>
          ) : (
            <MapComponent
              incidents={filteredIncidents}
              resources={resources}
              selectedIncidentId={selectedIncidentId}
              selectedResourceId={selectedResourceId}
              onIncidentSelect={setSelectedIncidentId}
              onResourceSelect={setSelectedResourceId}
              onMapClick={handleMapClick}
            />
          )}
        </div>

        <div className="flex gap-4 items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider border-t border-green-200/55 pt-3.5 mt-4">
          <div className="flex gap-3 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Incident</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Available Resource</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Busy Resource</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span> Unavailable Resource</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[8px] text-slate-400">
            <Info className="h-3 w-3" /> Map centered on NIT Rourkela Grid
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-8 w-full">
        <div className="neu-flat rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Incidents</h3>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
              {filteredIncidents.length} shown
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All severities</option>
              {severityLevels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <select
              value={disasterFilter}
              onChange={(e) => setDisasterFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All types</option>
              {[...new Set(incidents.map((incident) => incident.disasterType).filter(Boolean))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All status</option>
              {incidentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No incidents match the applied filters.</div>
            ) : (
              filteredIncidents.map((incident) => (
                <button
                  key={incident._id}
                  type="button"
                  onClick={() => setSelectedIncidentId(incident._id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${selectedIncidentId === incident._id ? "border-emerald-300 bg-emerald-50/80" : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-800">
                        {incident.disasterType || "Emergency Incident"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(incident.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${getSeverityStyles(incident.severity)}`}>
                      {incident.severity || "Medium"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                    <div><span className="text-slate-500">Affected:</span> <strong>{incident.peopleAffected ?? 0}</strong></div>
                    <div><span className="text-slate-500">Status:</span> <strong>{incident.status || "UNASSIGNED"}</strong></div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="neu-flat rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-2 mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Resource Management</h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-emerald-700"
            >
              Reset
            </button>
          </div>

          <form onSubmit={handleSubmitResource} className="space-y-3">
            <input
              value={resourceForm.name}
              onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
              placeholder="Resource name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={resourceForm.type}
                onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>

              <select
                value={resourceForm.status}
                onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                {resourceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={resourceForm.capacity}
                onChange={(e) => setResourceForm({ ...resourceForm, capacity: Number(e.target.value) })}
                min={0}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                placeholder="Capacity"
              />
              <input
                type="number"
                step="0.0001"
                value={resourceForm.latitude}
                onChange={(e) => setResourceForm({ ...resourceForm, latitude: Number(e.target.value) })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                placeholder="Lat"
              />
            </div>

            <input
              type="number"
              step="0.0001"
              value={resourceForm.longitude}
              onChange={(e) => setResourceForm({ ...resourceForm, longitude: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              placeholder="Longitude"
            />

            <p className="text-[10px] text-slate-500">Tip: click the map to set the resource location quickly.</p>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingResourceId ? "Update Resource" : "Add Resource"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {resources.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">No resources available.</div>
            ) : (
              resources.map((resource) => (
                <div key={resource._id} className={`rounded-2xl border p-3 ${selectedResourceId === resource._id ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-slate-50/70"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{resource.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{resource.type}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${getResourceStatusStyles(resource.status)}`}>
                      {resource.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                    <span>Capacity: <strong>{resource.capacity}</strong></span>
                    <span>Lat: <strong>{resource.latitude.toFixed(4)}</strong></span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditResource(resource)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(resource._id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-red-500 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

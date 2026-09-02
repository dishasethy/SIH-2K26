"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapComponentProps {
  incidents: IncidentReport[];
  resources?: ResourceEntry[];
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
  onIncidentSelect?: (id: string) => void;
  onResourceSelect?: (id: string) => void;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
}

const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case "Critical": return "#ef4444";
    case "High": return "#f97316";
    case "Medium": return "#facc15";
    default: return "#22c55e";
  }
};

const getResourceStatusColor = (status?: string) => {
  switch (status) {
    case "UNAVAILABLE": return "#64748b";
    case "BUSY": return "#f59e0b";
    default: return "#10b981";
  }
};

const createIncidentMarkerIcon = (severity?: string) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    className: "custom-emergency-marker",
    html: `
      <div style="position:relative; width:18px; height:18px; border-radius:50%; background:${color}; border:3px solid white; box-shadow:0 0 0 6px rgba(255,255,255,0.2), 0 0 18px ${color}; animation:pulseMarker 1.8s infinite;">
        <div style="position:absolute; inset:-10px; border:2px solid ${color}; border-radius:50%; opacity:0.8; animation:radarPulse 2s infinite ease-out;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
};

const createResourceMarkerIcon = (type: string, status?: string) => {
  const color = getResourceStatusColor(status);
  const initial = type.charAt(0).toUpperCase();
  return L.divIcon({
    className: "custom-resource-marker",
    html: `
      <div style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${color}; border:3px solid white; box-shadow:0 0 0 6px rgba(255,255,255,0.15), 0 0 18px ${color}; font-size:10px; font-weight:800; color:white;">
        ${initial}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

function MapFocusController({
  selectedIncidentId,
  selectedResourceId,
}: {
  selectedIncidentId?: string | null;
  selectedResourceId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncidentId) {
      const incident = (window as any).__lastIncidents?.find((item: any) => item._id === selectedIncidentId);
      if (incident) {
        map.flyTo([incident.latitude, incident.longitude], 16, { duration: 1.2 });
      }
      return;
    }

    if (selectedResourceId) {
      const resource = (window as any).__lastResources?.find((item: any) => item._id === selectedResourceId);
      if (resource) {
        map.flyTo([resource.latitude, resource.longitude], 15, { duration: 1.2 });
      }
    }
  }, [selectedIncidentId, selectedResourceId, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (event) => {
      onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export default function MapComponent({
  incidents,
  resources = [],
  selectedIncidentId,
  selectedResourceId,
  onIncidentSelect,
  onResourceSelect,
  onMapClick,
}: MapComponentProps) {
  const centerPosition: [number, number] = [22.2525, 84.9035];
  const zoomLevel = 15;

  (globalThis as any).__lastIncidents = incidents;
  (globalThis as any).__lastResources = resources;

  const nitRourkelaBounds: [number, number][] = [
    [22.2590, 84.8910],
    [22.2590, 84.9130],
    [22.2420, 84.9130],
    [22.2420, 84.8910],
  ];

  return (
    <div className="h-[600px] w-full rounded-3xl overflow-hidden neu-flat border border-slate-200 z-10">
      <style jsx>{`
        @keyframes pulseMarker {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes radarPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={centerPosition}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocusController selectedIncidentId={selectedIncidentId} selectedResourceId={selectedResourceId} />
        <MapClickHandler onMapClick={onMapClick} />
        <Polygon
          positions={nitRourkelaBounds}
          pathOptions={{
            color: "#dc2626",
            dashArray: "10, 10",
            fillColor: "#dc2626",
            fillOpacity: 0.05,
          }}
        />

        {incidents.map((incident) => {
          const firstMedia = incident.media?.[0] || incident.image;
          return (
            <Marker
              key={incident._id}
              position={[incident.latitude, incident.longitude]}
              icon={createIncidentMarkerIcon(incident.severity)}
              eventHandlers={{
                click: () => onIncidentSelect?.(incident._id),
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-foreground font-sans max-w-[220px]">
                  <div>
                    <h4 className="font-bold text-xs uppercase text-emerald-800 m-0 leading-tight">
                      {incident.disasterType || "Emergency Incident"}
                    </h4>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                      {incident.incidentId || "Incident"} • {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-[10px] space-y-1 rounded bg-slate-50 p-2 border border-slate-200">
                    <div><strong>Severity:</strong> {incident.severity || "Medium"}</div>
                    <div><strong>People Affected:</strong> {incident.peopleAffected ?? 0}</div>
                    <div><strong>Status:</strong> {incident.status || "UNASSIGNED"}</div>
                    <div><strong>Location:</strong> {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</div>
                    {incident.locationAccuracy ? <div><strong>Accuracy:</strong> ±{incident.locationAccuracy} m</div> : null}
                  </div>

                  {firstMedia && (
                    <div className="rounded overflow-hidden bg-slate-100 max-h-[90px] flex items-center justify-center">
                      {firstMedia.startsWith("data:video") ? (
                        <video src={firstMedia} className="max-h-[90px] w-full object-cover" controls />
                      ) : (
                        <img src={firstMedia} alt="Incident evidence" className="max-h-[90px] w-full object-cover" />
                      )}
                    </div>
                  )}

                  <div className="text-[10px] space-y-1">
                    <div className="font-semibold text-slate-600">
                      Reporter: <span className="text-slate-700">{incident.name}</span>
                    </div>
                    <div className="font-semibold text-slate-600">
                      Phone: <span className="text-slate-700">{incident.mobileNumber}</span>
                    </div>
                    {(incident.description || incident.notes) && (
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 leading-snug text-slate-600">
                        {incident.description || incident.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {resources.map((resource) => (
          <Marker
            key={resource._id}
            position={[resource.latitude, resource.longitude]}
            icon={createResourceMarkerIcon(resource.type, resource.status)}
            eventHandlers={{
              click: () => onResourceSelect?.(resource._id),
            }}
          >
            <Popup>
              <div className="p-1 space-y-2 text-foreground font-sans max-w-[220px]">
                <div>
                  <h4 className="font-bold text-xs uppercase text-emerald-800 m-0 leading-tight">
                    {resource.name}
                  </h4>
                  <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                    {resource.type} • {resource.resourceId || "Resource"}
                  </span>
                </div>
                <div className="text-[10px] space-y-1 rounded bg-slate-50 p-2 border border-slate-200">
                  <div><strong>Status:</strong> {resource.status}</div>
                  <div><strong>Capacity:</strong> {resource.capacity}</div>
                  <div><strong>Location:</strong> {resource.latitude.toFixed(5)}, {resource.longitude.toFixed(5)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

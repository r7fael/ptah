"use client";

import { useEffect, useRef } from "react";

type MapIncident = {
  id: string;
  area: string;
  type: string;
  reports: number;
  priority: "Crítica" | "Alta" | "Média";
  lat: number;
  lon: number;
  source?: "live";
};

export function InteractiveCityMap({ incidents, selectedId, setSelectedId }: {
  incidents: MapIncident[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const markerLayer = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let active = true;
    import("leaflet").then((L) => {
      if (!active || !mapElement.current || mapInstance.current) return;
      const map = L.map(mapElement.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([-8.055, -34.92], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      markerLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
      incidents.slice(0, 7).forEach((incident) => {
        const classes = ["native-pin", incident.priority === "Crítica" ? "native-critical" : "", incident.source ? "native-live" : "", selectedId === incident.id ? "native-selected" : ""].filter(Boolean).join(" ");
        const icon = L.divIcon({ className: "ptah-marker", html: `<div class="${classes}"><span><i>${incident.reports}</i></span><b>${incident.area}</b></div>`, iconSize: [104, 58], iconAnchor: [52, 30] });
        const marker = L.marker([incident.lat, incident.lon], { icon, title: `${incident.type} em ${incident.area}` }).addTo(markerLayer.current!);
        marker.on("click", () => setSelectedId(incident.id));
      });
    });

    return () => {
      active = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerLayer.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerLayer.current) return;
    let active = true;

    import("leaflet").then((L) => {
      if (!active || !markerLayer.current) return;
      markerLayer.current.clearLayers();

      incidents.slice(0, 7).forEach((incident) => {
        const classes = [
          "native-pin",
          incident.priority === "Crítica" ? "native-critical" : "",
          incident.source ? "native-live" : "",
          selectedId === incident.id ? "native-selected" : "",
        ].filter(Boolean).join(" ");

        const icon = L.divIcon({
          className: "ptah-marker",
          html: `<div class="${classes}"><span><i>${incident.reports}</i></span><b>${incident.area}</b></div>`,
          iconSize: [104, 58],
          iconAnchor: [52, 30],
        });

        const marker = L.marker([incident.lat, incident.lon], {
          icon,
          title: `${incident.type} em ${incident.area}`,
        }).addTo(markerLayer.current!);

        marker.on("click", () => setSelectedId(incident.id));
      });
    });

    return () => { active = false; };
  }, [incidents, selectedId, setSelectedId]);

  return (
    <section className="city-map">
      <div className="map-heading">
        <div><span>MAPA DA CIDADE</span><h2>Recife em tempo real</h2></div>
        <div className="map-legend"><span><i className="critical-dot" /> Crítica</span><span><i /> Alta/Média</span></div>
      </div>
      <div ref={mapElement} className="osm-wrap" aria-label="Mapa interativo do Recife com ocorrências" />
    </section>
  );
}

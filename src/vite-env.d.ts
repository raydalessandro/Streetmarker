/// <reference types="vite/client" />

// CSS modules
declare module '*.css' {
  const content: string;
  export default content;
}

// Leaflet CSS
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet.markercluster/dist/MarkerCluster.css';
declare module 'leaflet.markercluster/dist/MarkerCluster.Default.css';

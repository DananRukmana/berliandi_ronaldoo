// utils/map-utils.js
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Inisialisasi peta
export function initializeMap(containerId, defaultCenter, defaultZoom) {
  const defaultLayer = 'Google Satellite'; // Ganti dengan layer default yang diinginkan
  const savedLayer = localStorage.getItem('selectedMapLayer') || defaultLayer;

  const baseLayers = {
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Stories | Base map © OpenStreetMap',
    }),
    'Google Satellite': L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: 'Map data © Google',
    }),
    'Google Hybrid': L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: 'Map data © Google',
    }),
    'Google Terrain': L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      attribution: 'Map data © Google',
    }),
  };

  const selectedLayer = baseLayers[savedLayer];
  const map = L.map(containerId).setView(defaultCenter, defaultZoom);
  selectedLayer.addTo(map);
  const layerControl = L.control.layers(baseLayers).addTo(map);
  map.on('baselayerchange', (event) => {
    localStorage.setItem('selectedMapLayer', event.name);
  });
  return map;
}

// Tambahkan marker ke peta
export async function addMarkersToMap(map, reports) {
  reports.forEach(async (report) => {
    const { lat, lon, name } = report;

    if (lat && lon) {
      const customIcon = L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.marker([lat, lon], { icon: customIcon })
        .addTo(map)
        .bindTooltip(name)
        .bindPopup(`<b>${name}</b><br>${lat}, ${lon}`);
    } else {
      return 'Koordinat tidak ditemukan';
    }
  });
}

// Fungsi untuk mendapatkan alamat lengkap dari koordinat
export async function getLocationDetails(lat, lon) {
  if (!lat || !lon) {
    return 'Alamat tidak ditemukan';
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    );
    const data = await response.json();

    if (data.error) {
      return 'Alamat tidak ditemukan';
    }
    return data.display_name;
  } catch {
    return 'Alamat tidak ditemukan';
  }
}

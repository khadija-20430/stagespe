import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix : Leaflet + bundlers modernes (Vite) ne trouvent pas les icônes par défaut
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function PartnersMap({ partners }) {
  return (
    <MapContainer center={[36.75, 3.06]} zoom={3} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {partners
        .filter(p => p.latitude && p.longitude)
        .map(p => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>{p.name}</Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

export default PartnersMap;
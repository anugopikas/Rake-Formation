import { Boxes, MapPin, TrainFront, Zap } from 'lucide-react';

export default function AuthRailwayScene() {
  return (
    <div className="railway-scene" aria-label="Railway logistics network illustration">
      <div className="scene-sun" />
      <div className="scene-network">
        <span className="network-line network-line--one" />
        <span className="network-line network-line--two" />
        <span className="network-line network-line--three" />
        <span className="network-node network-node--one"><MapPin size={16} /></span>
        <span className="network-node network-node--two"><TrainFront size={16} /></span>
        <span className="network-node network-node--three"><Boxes size={16} /></span>
        <span className="network-node network-node--four"><Zap size={16} /></span>
      </div>
      <div className="railway-track railway-track--one" />
      <div className="railway-track railway-track--two" />
      <div className="freight-train">
        <div className="locomotive"><span /><i /><b /></div>
        <div className="freight-wagon freight-wagon--blue" />
        <div className="freight-wagon freight-wagon--cyan" />
        <div className="freight-wagon freight-wagon--navy" />
        <div className="freight-wagon freight-wagon--steel" />
      </div>
    </div>
  );
}

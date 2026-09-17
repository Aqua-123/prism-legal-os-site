import { assetUrl } from './assets';
import { TrailBackground } from './TrailBackground';

export function CommunityVisual() {
  return <div className="community-artwork">
    <TrailBackground community />
    <img className="community-foreground" src={assetUrl("community-foreground.svg")} alt="Three outlined shapes over an animated blue field." width="1600" height="627" loading="lazy" />
  </div>;
}

export interface CommunityField {
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly available: boolean;
  pause(): void;
  play(): void;
  replay(): void;
  destroy(): void;
}

export function createLightHeroBackground(canvas: HTMLCanvasElement, options?: {
  cell?: number;
  opacity?: number;
  speed?: number;
  shift?: number;
  entranceMs?: number;
  trailMs?: number;
  ink?: [number, number, number];
  trailColor?: [number, number, number];
}): CommunityField;

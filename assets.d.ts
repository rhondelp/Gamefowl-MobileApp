/**
 * Asset module declarations. Expo's bundler resolves these at build time;
 * TypeScript just needs to know they're importable values.
 */
declare module "*.png" {
  const value: number;
  export default value;
}

declare module "*.mp4" {
  const value: number;
  export default value;
}

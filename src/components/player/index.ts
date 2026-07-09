/**
 * CineSync — Player components barrel
 *
 * Re-export point for every reusable player building block. Pages import from
 * `@/components/player` so internal paths stay private.
 */

export { VideoPlayer } from "@/components/player/VideoPlayer";
export { UrlInputBar } from "@/components/player/UrlInputBar";
export { PlayerControls } from "@/components/player/PlayerControls";
export { SeekBar } from "@/components/player/SeekBar";
export { VolumeSlider } from "@/components/player/VolumeSlider";
export { PlaybackSpeedMenu } from "@/components/player/PlaybackSpeedMenu";
export { LoadingOverlay } from "@/components/player/LoadingOverlay";
export { ErrorOverlay } from "@/components/player/ErrorOverlay";
export { StreamPreparing } from "@/components/player/StreamPreparing";
export { StreamErrorCard } from "@/components/player/StreamErrorCard";

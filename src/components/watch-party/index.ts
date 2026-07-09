/**
 * CineSync — Watch Party components barrel
 *
 * Re-export point for every reusable watch-party building block. Pages import
 * from `@/components/watch-party` so internal paths stay private.
 */

export { RoomCard } from "@/components/watch-party/RoomCard";
export type { RoomCardProps } from "@/components/watch-party/RoomCard";
export { RoomHeader } from "@/components/watch-party/RoomHeader";
export { HostBadge } from "@/components/watch-party/HostBadge";
export { ConnectionStatus } from "@/components/watch-party/ConnectionStatus";
export { PlaybackStatus } from "@/components/watch-party/PlaybackStatus";
export { ParticipantCard } from "@/components/watch-party/ParticipantCard";
export { ParticipantList } from "@/components/watch-party/ParticipantList";
export { InviteCard } from "@/components/watch-party/InviteCard";
export { HostControls } from "@/components/watch-party/HostControls";
export { WatchPartyErrorCard } from "@/components/watch-party/WatchPartyErrorCard";
export { WatchPartyLobby } from "@/components/watch-party/WatchPartyLobby";
export type { WatchPartyLobbyProps } from "@/components/watch-party/WatchPartyLobby";
export { WatchPartyRoom } from "@/components/watch-party/WatchPartyRoom";

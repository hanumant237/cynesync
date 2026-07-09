/**
 * CineSync Backend — Services barrel
 *
 * Business-logic layer. Controllers depend on these; nothing here depends on
 * Express.
 */

export { Logger } from "./Logger.js";
export { MediaInspector, InspectionError } from "./MediaInspector.js";
export { FFmpegService, canPlayDirectly, FFmpegError } from "./FFmpegService.js";
export { CleanupService } from "./CleanupService.js";
export type { RegisteredSession } from "./CleanupService.js";
export { VideoService, VideoServiceError } from "./VideoService.js";

// Watch Party (realtime sync)
export { RoomManager } from "./RoomManager.js";
export { ROOM_ERROR_CODES } from "./RoomManager.js";
export type { RoomOpResult } from "./RoomManager.js";
export { UserManager } from "./UserManager.js";
export { PlaybackSync } from "./PlaybackSync.js";
export { SocketManager } from "./SocketManager.js";
export { RoomEvents } from "./RoomEvents.js";

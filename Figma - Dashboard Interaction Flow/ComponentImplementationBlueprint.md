# Dashboard Interaction Flow — Implementation Blueprint

This document reverse-engineers the existing React/Vite code so another coding agent can rebuild the UI and behaviour with functional parity. All components live under `src/` and rely on Tailwind utility classes plus shadcn-style UI primitives from `src/components/ui/*`.

## Application Skeleton (`src/App.tsx`)
- **Data models**
  ```ts
  interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number; // seconds
    url: string; // direct audio source
    coverArt?: string; // image URL
    uploadedAt: Date;
  }

  interface Playlist {
    id: string;
    name: string;
    description?: string;
    trackIds: string[]; // order matters
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **Root state**
  - `tracks` (`Track[]`): seeded with three mock records.
  - `playlists` (`Playlist[]`): two sample playlists referencing track IDs.
  - `activePlaylistId`: controls which playlist is shown in detail views.
  - `currentTrack`: track currently loaded in the audio player.
  - `isPlaying`: playback state shared with `<AudioPlayer />`.
  - `duplicateModalOpen`, `duplicateTrackTitle`: control `<DuplicateModal />` feedback.
  - `playlistSheetOpen`: toggles mobile bottom sheet that exposes playlist details.
- **Derived values**
  - `activePlaylist`: looked up by `activePlaylistId`.
  - `activePlaylistTracks`: ordered list of `Track` objects derived from `activePlaylist.trackIds`.
- **Event handlers** (passed to children)
  - `handlePlayTrack(track)`: sets `currentTrack` and `isPlaying = true`.
  - `handleAddToPlaylist(trackId, playlistId)`: pushes track onto playlist unless already present (triggers duplicate modal).
  - `handleRemoveFromPlaylist(trackId, playlistId)`: filters track out of playlist.
  - `handleReorderTracks(playlistId, trackIds)`: replaces playlist order after drag-and-drop.
  - `handleUpdatePlaylist(playlistId, updates)`: updates metadata with `updatedAt = new Date()`.
  - `handleUploadTrack(newTrack)`: generates `id` + `uploadedAt`, prepends to `tracks`.
  - `handleSelectPlaylist(playlistId)`: sets `activePlaylistId` and, on mobile, opens the sheet.
- **Layout logic**
  - Wrapper: `div.flex.flex-col.h-screen.bg-zinc-950.text-white`.
  - Mobile (`lg:hidden`): Three tab panes (`library`, `playlists`, `upload`) using `<Tabs />` from UI primitives. Playlist details rendered inside `<Sheet side="bottom" />` occupying 90% viewport height.
  - Desktop (`hidden lg:flex`):
    - Left column `w-80`: library (scrollable) + upload form (`h-64`).
    - Middle column `w-72`: playlists list.
    - Right column `flex-1`: playlist details or placeholder message.
  - Footer: `<AudioPlayer />` rendered regardless of layout.
  - `<DuplicateModal />` mounted last with controlled visibility.

## Library Panel (`src/components/LibraryPanel.tsx`)
- **Props**
  ```ts
  interface LibraryPanelProps {
    tracks: Track[];
    playlists: Playlist[];
    onPlayTrack(track: Track): void;
    onAddToPlaylist(trackId: string, playlistId: string): void;
  }
  ```
- **UI pattern**
  - Container padding `p-4 lg:p-6`.
  - Title row includes `Music2` icon tinted `text-blue-500`.
  - Track cards: `div.group.p-3.rounded-lg.bg-zinc-900` with hover/active states to lighten background.
  - Artwork: conditional `<img>` with `rounded` mask or fallback icon.
  - Metadata stack: title, artist, optional album, duration aligned right.
  - Actions row: primary `Play` button (`bg-blue-600`), secondary dropdown `Add to playlist` using `<DropdownMenu />` primitives.
  - Desktop-only hover behaviour: `lg:opacity-0 lg:group-hover:opacity-100` to hide buttons until hover.
- **Logic**
  - Local `formatDuration(seconds)` to display `M:SS`.
  - No component-level state; purely uses props and callbacks.
  - Dropdown lists `playlists.map` with `DropdownMenuItem` triggering `onAddToPlaylist`.

## Playlists Panel (`src/components/PlaylistsPanel.tsx`)
- **Props**
  ```ts
  interface PlaylistsPanelProps {
    playlists: Playlist[];
    activePlaylistId: string | null;
    onSelectPlaylist(playlistId: string): void;
  }
  ```
- **UI pattern**
  - Outer padding `p-4 lg:p-6`.
  - Header with `ListMusic` icon tinted `text-purple-500`.
  - Each playlist renders as `<button>` with full-width card styling:
    - Active state: `bg-purple-600 text-white` with description `text-purple-100/200`.
    - Inactive: `bg-zinc-900` with hover/active variations.
  - Displays name, optional description, and count of tracks.
- **Logic**
  - Stateless; `onClick` calls `onSelectPlaylist`.
  - Tracks pluralization handled inline.

## Playlist Details (`src/components/PlaylistDetails.tsx`)
- **Props** (extends track actions)
  ```ts
  interface PlaylistDetailsProps {
    playlist: Playlist;
    tracks: Track[]; // already ordered to match playlist.trackIds
    onPlayTrack(track: Track): void;
    onRemoveTrack(trackId: string, playlistId: string): void;
    onReorderTracks(playlistId: string, trackIds: string[]): void;
    onUpdatePlaylist(playlistId: string, updates: { name?: string; description?: string }): void;
  }
  ```
- **Local state**
  - `isEditingName`, `isEditingDescription`: toggles for inline editing.
  - `editedName`, `editedDescription`: form buffers.
  - Drag state: `draggedIndex`, `dragOverIndex` for DnD highlight.
- **UX flow**
  - Header: render name + pencil button. Editing mode replaces `h1` with `<Input>` and Save/Cancel buttons using `Check` and `X` icons.
  - Description: similar toggle with `<Textarea>`.
  - Metadata line: "{n} tracks • Updated {locale date}".
  - Track list: `tracks.map` with `div.group` rows containing drag handle (`GripVertical`), position index, artwork, metadata, duration, and action buttons.
    - Drag over highlight: `border-t-2 border-blue-500` when `dragOverIndex === index`.
    - Action buttons only visible on desktop hover (`lg:opacity-0` trick).
    - Remove button uses danger hover state `hover:bg-red-900`.
  - Empty state message when playlist has no tracks.
- **Logic**
  - `handleSaveName/Description` call `onUpdatePlaylist` with trimmed values and close edit mode.
  - Drag handlers: on drop, reorders `playlist.trackIds` array then calls `onReorderTracks`.
  - `formatDuration` duplicates logic from Library for local display.

## Upload Panel (`src/components/UploadPanel.tsx`)
- **Props**: `onUploadTrack(track: Omit<Track, 'id' | 'uploadedAt'>)`.
- **Local state**
  - Form fields: `title`, `artist`, `album`.
  - Status flags: `isUploading`, `uploadSuccess`.
- **Flow**
  - Form submission prevents default, validates required fields, sets `isUploading`, waits 1 second (`await new Promise(setTimeout)`), then constructs a mock `Track` payload (random duration + placeholder cover art URL) and calls `onUploadTrack`.
  - Resets form fields, toggles success state for 2 seconds, then clears.
- **UI details**
  - Form sits in flex column allowing stretch to fill parent.
  - Inputs styled with dark backgrounds (`bg-zinc-900 border-zinc-700`).
  - Submit button switches label among `Uploading...`, `Upload Track`, and success state `Uploaded!` with green background.
  - Footer note clarifies Supabase storage in production.

## Audio Player (`src/components/AudioPlayer.tsx`)
- **Props**
  ```ts
  interface AudioPlayerProps {
    track: Track | null;
    isPlaying: boolean;
    onPlayPause(): void;
    onNext(): void;
    onPrevious(): void;
  }
  ```
- **Internal state**
  - `currentTime`: seconds elapsed, synced via `<audio>` `onTimeUpdate`.
  - `volume`: 0–100 slider value (default 70).
  - `isMuted`: boolean toggled by volume icon.
- **Refs & effects**
  - `audioRef`: DOM reference to hidden `<audio>` element.
  - `useEffect` watches `isPlaying`/`track` to start/stop playback and load new source (set `audioRef.current.src = track.url`).
  - Another effect syncs `audioRef.current.volume` with `volume` and `isMuted`.
- **UI layout**
  - Wrapper: `fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800` to overlay entire width.
  - Mobile (`lg:hidden`): stacked progress slider followed by row containing cover art, track info, and playback buttons.
  - Desktop (`hidden lg:flex`): three segments — track info (left), controls + progress (center), volume (right). Play button is circular white.
  - Volume slider uses UI primitive `<Slider />`. Time displays show current/duration using `formatTime`.
  - When `track` is `null`, displays idle bar with "No track selected".
- **Behaviour**
  - `progress` computed as `(currentTime / track.duration) * 100` for slider.
  - `handleSeek` maps slider value back to `audioRef.current.currentTime`.
  - `onEnded` of `<audio>` triggers `onNext` to loop playlist.

## Duplicate Modal (`src/components/DuplicateModal.tsx`)
- **Props**: `isOpen`, `onClose`, `trackTitle`.
- **Implementation**
  - Wraps shadcn `AlertDialog` primitive.
  - Title: "Track Already in Playlist".
  - Description quotes `trackTitle` explicitly.
  - Single `OK` action button closes modal via `onClose`.
  - Styled with dark background `bg-zinc-900` and border `border-zinc-800` to match theme.

## Interaction Wiring
- **Add to playlist flow**
  1. User taps `Add to playlist` from library card.
  2. Parent handler checks for duplicates. On duplicate, opens modal; otherwise updates playlist array with new track ID and new `updatedAt`.
- **Playlist selection**
  - Desktop: click playlist button triggers `setActivePlaylistId`, instantly updates right pane details.
  - Mobile: same click also sets `playlistSheetOpen = true`, revealing bottom sheet with `<PlaylistDetails />`.
- **Playback controls**
  - `Play` buttons (library/detail) call `handlePlayTrack`, which assigns `currentTrack` and sets `isPlaying` true.
  - `<AudioPlayer />` invokes `onPlayPause`, `onNext`, `onPrevious` using parent-supplied callbacks. Parent uses `activePlaylistTracks` to determine next/previous indices (wrap-around behaviour).
- **Drag reorder**
  - Drag events maintained locally in `<PlaylistDetails />` but final order pushed up via `onReorderTracks`, ensuring `App` keeps authoritative playlist ordering.

## Theming & Styling
- Tailwind utilities applied directly in JSX, leveraging dark theme palette (`bg-zinc-*`, `text-zinc-*`) with accent hues (`blue`, `purple`, `green`).
- Responsive breakpoints hinge on `lg` (≈1024px). Mobile hides complex layouts and reveals tab navigation + modal sheet.
- Typography: default h1/h2 etc. rely on custom Tailwind base layer (see compiled `src/index.css` from Tailwind v4). Most text uses explicit classes or inherits root settings.
- Icons sourced from `lucide-react`, consistent sizing (`w-4 h-4`, etc.).

## Required Dependencies
- React + hooks (`useState`, `useEffect`, `useRef`).
- `lucide-react` for icons.
- shadcn/ui components under `src/components/ui/*` providing primitives such as `Tabs`, `Sheet`, `Button`, `Slider`, `DropdownMenu`, `AlertDialog`.
- Tailwind CSS (compiled into `src/index.css`).

## Rebuild Checklist
1. Recreate data interfaces (`Track`, `Playlist`) and seed data inside root component.
2. Implement `App` component replicating state variables and handlers exactly; respect immutability when updating arrays.
3. Mirror responsive layout: tabbed mobile with sheet; three-column desktop; fixed audio footer.
4. Port child components with identical prop contracts and visual class lists; ensure UI primitives match names and behaviours.
5. Restore drag-and-drop logic in `PlaylistDetails` (HTML5 DnD events with local indices).
6. Ensure audio playback uses native `<audio>` element controlled through refs and effects.
7. Add duplicate-protection modal using alert dialog primitive, driven by `duplicateModalOpen` and `duplicateTrackTitle`.
8. Import global CSS (Tailwind build) via `src/main.tsx` to match spacing, typography, and color tokens.

Following the above map allows a fresh implementation to recreate the same experience without inspecting the original source again.

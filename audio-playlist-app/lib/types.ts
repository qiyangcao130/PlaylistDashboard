export interface Track {
  id: string;
  username: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  coverArtUrl?: string | null;
  duration: number | null;
  url: string;
  contentType?: string | null;
  fileSize?: number | null;
  uploadedAt: string;
}

export interface Playlist {
  id: string;
  username: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  trackIds: string[];
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}

export interface DashboardData {
  tracks: Track[];
  playlists: PlaylistWithTracks[];
  canModify: boolean;
}

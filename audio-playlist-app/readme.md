# Audio Playlist Dashboard - Infrastructure Documentation

## Overview
A full-stack audio playlist management application built with Next.js 14, React, and Supabase. Users can upload audio files, organize them into playlists, and play them with a built-in audio player.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14.2.5 (App Router)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4.7
- **UI Components**: 
  - Radix UI (headless components)
  - shadcn/ui (pre-built components)
  - Lucide React (icons)
- **State Management**: React hooks (useState, useEffect, useRef)
- **Form Handling**: React Server Actions with Zod validation
- **Notifications**: Sonner (toast notifications)

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (for audio files and cover art)
- **Authentication**: Username-based (no passwords - simplified demo auth)
- **API Pattern**: Next.js Server Actions
- **ORM**: Direct Supabase client queries

### Infrastructure
- **Hosting**: Deployable to Vercel or any Next.js-compatible platform
- **Database Hosting**: Supabase Cloud
- **Storage**: Supabase Storage buckets
- **CDN**: Supabase CDN for static assets

---

## Architecture

### Application Structure
```
audio-playlist-app/
├── app/                        # Next.js App Router
│   ├── actions.ts             # Server Actions (API endpoints)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing/login page
│   └── globals.css            # Global styles
├── components/
│   ├── dashboard/             # Main dashboard components
│   │   ├── AudioPlayer.tsx    # Global audio player
│   │   ├── DashboardClient.tsx # Main dashboard orchestrator
│   │   ├── DuplicateModal.tsx  # Duplicate track handler
│   │   ├── LibraryPanel.tsx   # Track library view
│   │   ├── LoginForm.tsx      # Username login
│   │   ├── PlaylistDetails.tsx # Playlist detail view
│   │   ├── PlaylistsPanel.tsx  # Playlists list
│   │   └── UploadPanel.tsx    # File upload interface
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── data.ts                # Data fetching layer
│   ├── database.types.ts      # Generated Supabase types
│   ├── env.ts                 # Environment configuration
│   ├── permissions.ts         # Permission checking
│   ├── supabase-server.ts     # Supabase client
│   ├── types.ts               # Application types
│   └── utils.ts               # Utility functions
└── supabase/
    └── migrations/
        └── 0001_audio_playlist.sql  # Database schema
```

### Key Design Patterns

#### 1. Server Components + Server Actions
- Pages and layouts are React Server Components
- Data mutations use Next.js Server Actions
- Client components only where interactivity is needed

#### 2. Progressive Enhancement
- Works without JavaScript for basic navigation
- Enhanced with client-side interactions
- Optimistic UI updates for better UX

#### 3. Type Safety
- TypeScript throughout the application
- Database types generated from Supabase schema
- Zod schemas for runtime validation

---

## Database Schema

### Tables

#### `username`
User accounts (simplified authentication)
```sql
- username (text, PK)        # Unique username
- displayname (text)         # Display name
- created_at (timestamptz)   # Account creation
```

#### `audio_files`
Audio track metadata and storage references
```sql
- id (uuid, PK)              # Unique identifier
- username (text, FK)        # Owner
- title (text)               # Track title
- artist (text, nullable)    # Artist name
- album (text, nullable)     # Album name
- cover_art_url (text, nullable) # Cover art URL
- storage_path (text, unique) # Supabase Storage path
- content_type (text)        # MIME type
- file_size (bigint)         # File size in bytes
- duration_seconds (double)  # Audio duration
- created_at (timestamptz)   # Upload timestamp
```

**Indexes:**
- `audio_files_username_idx` on `username`
- `audio_files_created_at_idx` on `created_at DESC`

#### `playlists`
User-created playlists
```sql
- id (uuid, PK)              # Unique identifier
- username (text, FK)        # Owner
- name (text)                # Playlist name
- description (text, nullable) # Description
- created_at (timestamptz)   # Creation timestamp
- updated_at (timestamptz)   # Last update
```

**Indexes:**
- `playlists_username_idx` on `username`
- `playlists_updated_at_idx` on `updated_at DESC`

**Triggers:**
- Auto-update `updated_at` on modifications

#### `playlist_items`
Many-to-many relationship between playlists and tracks
```sql
- id (uuid, PK)              # Unique identifier
- playlist_id (uuid, FK)     # Playlist reference
- audio_id (uuid, FK)        # Audio file reference
- position (integer)         # Track order in playlist
- created_at (timestamptz)   # Addition timestamp
```

**Indexes:**
- `playlist_items_playlist_idx` on `(playlist_id, position)`
- `playlist_items_audio_idx` on `audio_id`
- `playlist_items_position_idx` unique on `(playlist_id, position)`

**Constraints:**
- Unique `(playlist_id, audio_id)` - no duplicate tracks in playlist
- Unique `(playlist_id, position)` - no position conflicts

---

## Storage Architecture

### Supabase Storage Buckets

#### Audio Files
- **Path Pattern**: `{username}/{timestamp}_{filename}.{ext}`
- **Supported Formats**: MP3, M4A, WAV, FLAC, OGG
- **Max File Size**: 50MB
- **Access**: Public read, authenticated write

#### Cover Art
- **Path Pattern**: `{username}/covers/{timestamp}_{filename}.{ext}`
- **Supported Formats**: JPG, JPEG, PNG, WebP, GIF
- **Max File Size**: 5MB
- **Access**: Public read, authenticated write

### Storage Flow
1. Client selects file
2. Client extracts audio duration (HTML5 Audio API)
3. Server validates file type and size
4. Server generates unique storage path
5. Server uploads to Supabase Storage
6. Server creates database record with metadata
7. Public URL returned for playback

---

## Authentication & Authorization

### Authentication
- **Type**: Username-only (no passwords)
- **Method**: Cookie-based session
- **Implementation**: Custom auth in `lib/auth.ts`
- **Session Storage**: HTTP-only cookies

### Authorization (Permissions)

#### Read-Only Users
Configured via environment variable `READ_ONLY_USERS`:
```env
READ_ONLY_USERS=demo,guest,readonly
```

**Restrictions:**
- Cannot upload tracks
- Cannot create/delete playlists
- Cannot modify playlist contents
- Cannot delete tracks
- Can view all content and play audio

**Implementation:**
- Client-side: UI elements disabled
- Server-side: All mutations protected with `requireModifyPermission()`
- Double protection ensures security

---

## API Layer (Server Actions)

All data mutations happen through Server Actions in `app/actions.ts`:

### Track Operations
- `uploadTrackAction(formData)` - Upload audio file with metadata
- `deleteTrackAction(trackId)` - Delete track and storage file

### Playlist Operations
- `createPlaylistAction(name, description)` - Create new playlist
- `deletePlaylistAction(playlistId)` - Delete playlist
- `updatePlaylistMetadataAction(playlistId, name, description)` - Update playlist info

### Playlist Content Operations
- `addTrackToPlaylistAction(playlistId, trackId)` - Add track to playlist
- `removeTrackFromPlaylistAction(playlistId, trackId)` - Remove track from playlist
- `reorderPlaylistTracksAction(playlistId, trackIds[])` - Reorder tracks

### User Operations
- `ensureUserExistsAction(username)` - Create user if doesn't exist

---

## Features

### Audio Upload
- **Client-side Duration Extraction**: Uses HTML5 Audio API to read duration before upload
- **Automatic Title**: Filename auto-populates track title (without extension)
- **Optional Cover Art**: Separate upload for album/track artwork
- **Duplicate Detection**: Shows modal if track with same title exists
- **Format Support**: MP3, M4A, WAV, FLAC, OGG
- **Validation**: Server-side file type and size checks

### Audio Player
- **Global Player**: Fixed bottom player (Spotify-style)
- **Centered Controls**: Play/pause, next, previous
- **Progress Bar**: Interactive seek bar with timestamps
- **Volume Control**: Slider with mute toggle
- **Cover Art Display**: Shows track cover on right side
- **Queue Management**: Plays tracks from active playlist
- **Persistent State**: Progress maintained when pausing

### Library Management
- **Grid View**: Visual track cards
- **Actions**: Play, add to playlist, delete
- **Metadata Display**: Title, artist, album, duration
- **Search**: (Future enhancement opportunity)

### Playlist Management
- **Create/Edit/Delete**: Full CRUD operations
- **Drag-and-Drop Reordering**: Intuitive track arrangement
- **Play Button**: Start playlist from first track
- **Track Count Display**: Shows number of tracks
- **Default View**: Opens to playlists page on mobile

### Permission System
- **Environment-based**: Configure read-only users
- **UI Adaptation**: Buttons/forms hide for read-only users
- **Server Validation**: All mutations check permissions
- **User Feedback**: Toast notifications for permission denials

---

## Environment Variables

### Required
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=audio-files
```

### Optional
```env
# Storage prefix (defaults to bucket name)
SUPABASE_STORAGE_PREFIX=audio-files

# Read-only users (comma-separated)
READ_ONLY_USERS=demo,guest,readonly
```

---

## Deployment

### Prerequisites
1. Supabase project created
2. Database migration applied (`0001_audio_playlist.sql`)
3. Storage bucket created with public read access
4. Environment variables configured

### Steps
1. **Deploy to Vercel** (recommended):
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel dashboard

3. **Set Up Supabase**:
   - Run migration script
   - Create storage bucket
   - Configure bucket policies (public read)

4. **Test Deployment**:
   - Create test user
   - Upload sample audio
   - Create playlist
   - Test playback

---

## Performance Considerations

### Optimizations
- **Image Optimization**: Next.js Image component for cover art
- **Server Components**: Reduce client-side JavaScript
- **Edge Runtime Ready**: Can be deployed to edge functions
- **Lazy Loading**: Components load on-demand
- **Efficient Queries**: Indexed database queries

### Scalability
- **Horizontal Scaling**: Stateless server actions
- **CDN Delivery**: Audio files served via Supabase CDN
- **Database Indexes**: Fast queries even with large datasets
- **Connection Pooling**: Supabase handles database connections

---

## Security

### Implemented
- ✅ Server-side validation (Zod schemas)
- ✅ SQL injection prevention (parameterized queries)
- ✅ File type validation
- ✅ File size limits
- ✅ CORS configuration
- ✅ HTTP-only cookies for sessions
- ✅ Permission checks on all mutations

### Future Enhancements
- 🔄 Rate limiting
- 🔄 CSRF tokens
- 🔄 Content Security Policy headers
- 🔄 Proper password-based authentication
- 🔄 Email verification
- 🔄 Two-factor authentication

---

## Known Limitations

1. **Authentication**: Simplified username-only (demo purposes)
2. **File Size**: 50MB limit per audio file
3. **No Search**: Library search not implemented
4. **No Sorting**: Fixed sort order (by upload date)
5. **Single User Sessions**: No multi-device sync
6. **No Sharing**: Playlists are private to each user

---

## Future Roadmap

### Phase 1: Core Improvements
- [ ] Real authentication with passwords
- [ ] Search and filtering
- [ ] Sorting options
- [ ] Batch operations

### Phase 2: Enhanced Features
- [ ] Playlist sharing
- [ ] Collaborative playlists
- [ ] User profiles
- [ ] Track favorites/likes

### Phase 3: Advanced Features
- [ ] Audio waveform visualization
- [ ] Equalizer controls
- [ ] Lyrics display
- [ ] Social features (comments, follows)

---

## Troubleshooting

### Common Issues

**Issue**: Database error about `file_name` column
- **Cause**: Old schema used `file_name` instead of `storage_path`
- **Fix**: Run: `ALTER TABLE public.audio_files RENAME COLUMN file_name TO storage_path`

**Issue**: Audio files not playing
- **Cause**: CORS or storage permissions
- **Fix**: Ensure bucket has public read access in Supabase dashboard

**Issue**: Progress bar resets on pause
- **Cause**: Fixed in recent update
- **Fix**: Pull latest code from repository

**Issue**: Upload fails silently
- **Cause**: Permission or validation error
- **Fix**: Check browser console and server logs for error messages

---

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration included
- Prettier formatting (recommended)
- Consistent naming conventions

---

## License
This project is for educational/demo purposes.

---

## Contact & Support
- **Repository**: github.com/qiyangcao130/PlaylistDashboard
- **Issues**: Use GitHub Issues for bug reports
- **Documentation**: See README.md for quick start guide

---

*Last Updated: October 19, 2025*

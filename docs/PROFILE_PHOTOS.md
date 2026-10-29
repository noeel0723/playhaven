# Player profile photos

Open **Your player profile → Profile photo** at `/community/profile#profile-photo`, or use **Manage profile photo** in account settings. Save the basic player profile first if it has not been created yet.

On desktop, the photo editor sits in the right sidebar beside Top 4. On smaller screens it follows the profile fields. The **Change photo** link beside the avatar jumps directly to it. Photo upload, preview, replacement, removal, and visibility continue to work through the same forms and routes.

Choose a JPEG, PNG, or WebP image, check the local preview, then choose **Save photo**. **Cancel selection** restores the saved image without uploading anything. **Remove photo** clears the saved image and returns to initials. Uploads and profile details save independently, so changing a photo does not overwrite the bio, username, Top 4, or library.

## Image processing

- Files must be genuine images in the permitted MIME types and filename extensions, at most 5 MB, with each side between 64 and 4096 pixels. SVG, GIF, scripts, and corrupt images are rejected without replacing the current photo.
- PHP GD and EXIF are explicit Composer platform requirements and enabled in CI. GD must support JPEG, PNG, and WebP. The local Laragon runtime already provides these extensions; no shared Laragon configuration is changed.
- JPEG orientation is applied before a centered square crop. Images are resized to 512×512 WebP; source metadata, original names, and trailing source content are not retained. PNG transparency is preserved.
- The preview uses a temporary browser object URL, which is revoked on change/unmount. The server validates and processes the file independently of client checks.

## Storage, URLs, and privacy

`user_profiles.avatar_path` stores a server-generated `avatars/{random-32-hex}.webp` path on the private `local` disk under `storage/app/private`. Original uploads are not copied into public storage. No storage symlink or additional cloud service is needed. The profile resources expose a relative application URL, never a filesystem path or arbitrary external URL.

`GET /player-photos/{profileId}/{photoToken}` serves only the profile's current image. The owner can read their own photo; other viewers can read it only while the player profile is public and has a username. Private, removed, missing, malformed, and superseded photos return 404. Responses explicitly use image/WebP, nosniff, a restrictive content security policy, and private/no-store caching. This allows privacy changes to affect the next request to a previously known URL.

The photo appears on the profile header, player cards, community stories, public game reviews, list attribution, and the authenticated account avatar. Hidden profiles do not expose photo URLs in public author/list resources. Missing or failed image loads fall back to initials. The owner can still see a private photo in their account and editor.

## Updates and cleanup

Upload/delete endpoints derive ownership from the authenticated session, retain existing verification rules, and share a limit of ten changes per minute. Multipart POST handles uploads; DELETE removes the current photo. No client-provided user ID, profile ID, or storage path selects the target.

A replacement is encoded and written before the locked profile update. A failed database update removes the new file; a failed storage write preserves the existing record. The prior file is removed after the database commit. Removal clears the reference first and retires the old URL. Profile/account deletion also schedules owned-file cleanup after commit, preserving photos when deletion rolls back. Cleanup accepts only generated avatar paths and cannot remove arbitrary files. A storage deletion failure is logged; retired paths remain inaccessible through the photo route.

## Verification

`ProfilePhotoTest` covers all supported formats, normalized dimensions, crop/orientation/transparency, dropped source content, private/public access, URL retirement, ownership, storage-write failure, account/profile deletion and rollback, bad file types/shapes/sizes/dimensions, public resource fields, path protection, and throttling. Its fake disk is isolated per PHP process so SQLite and PostgreSQL checks can run together. Browser checks exercise the actual upload form, preview/cancel, replacement/removal, settings shortcut, public/community avatars, privacy revocation, and desktop/mobile layouts with a temporary local account; cleanup verifies existing player data and photo files remain unchanged.

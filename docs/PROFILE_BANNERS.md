# Profile banners

Open **Profile → Edit profile → Profile banner**. This compact editor sits alongside the existing photo section on desktop and below it on phones. Choose an image to preview its centered crop, then **Save banner**. **Cancel selection** discards the local choice; **Remove banner** removes the saved image. Banner changes save independently of profile information and Top 4, including for new accounts without saved profile details.

The current banner appears as a wide backdrop on both the owner's Profile and public player profile, behind the global header and profile overview. Side and bottom gradients keep the name, avatar, actions, and statistics readable. Content remains centered and compact. Missing or failed images restore the normal profile layout; game banners continue to use their existing catalog artwork.

## Images and storage

- JPEG, PNG, and WebP only, up to 5 MB; dimensions must be 600–5000 px wide and 200–3000 px tall.
- A 1600 × 600 landscape image is recommended. PHP GD applies JPEG camera orientation, center-crops to an 8:3 frame, and re-encodes to 1600 × 600 WebP. Original filenames, metadata, and trailing source content are discarded.
- The local preview uses a revocable object URL. The server independently validates type, extension, file size, dimensions, and decoding.
- The additive nullable user_profiles.banner_path column stores a generated profile-banners/{random-32-hex}.webp path on private local storage. Existing profiles start without a banner. Avatar files and other player data are unchanged.
- URLs use GET /player-banners/{profileId}/{bannerToken}; storage paths are never exposed in profile DTOs. No public storage symlink or external service is required.

## Privacy and ownership

Owners can see their own banner in the editor and Profile. Other viewers can fetch it only while the profile is Public and has a username. Private, missing, removed, superseded, or malformed image requests return 404, even for previously known URLs. Responses use image/WebP, nosniff, a restrictive CSP, and private/no-store caching. Banner URLs are returned on profile views, not player discovery cards or community author payloads.

Authenticated POST/DELETE /community/profile/banner derive the owner from the session, use the existing email-verification policy, and share a ten-changes-per-minute limit. Request-supplied owner IDs or storage paths do not select a target.

Replacement writes the encoded file before locking and updating the profile. Failure preserves the old image and removes an unused new file. Previous files are retired after commit. Account/profile deletion also removes banner files after commit; rolled-back deletion preserves them. Cleanup only accepts generated banner paths and logs storage failures. A retired path is inaccessible through the image route even if its physical cleanup fails.

## Verification

ProfileBannerTest covers allowed formats, normalized size/crop, read-only DTOs, public/private and owner access, URL retirement, independent first upload, preserved avatar/profile fields, input validation, ownership/path boundaries, storage failure, deletion/rollback, and throttling. Existing avatar and profile tests run alongside these checks. PostgreSQL tests target only playhaven_testing; the development migration adds the nullable column without rewriting existing profile rows.

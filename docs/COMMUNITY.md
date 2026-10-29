# Players, follows, and community stories

Open **Community** in the main navigation. The first community feed contains public reviews from authors who have opted into a public player profile. **Everyone** shows all eligible reviews; **Following** requires login and limits the same query to followed authors. Reviews sort by most recently edited, then ID, with 12 per page. This is a view of current published reviews, not an immutable event history. Deleted reviews, unpublished reviews, and hidden profiles leave the feed immediately on the next request.

## Player profiles

**Your player profile** at `/community/profile` lets the signed-in user choose a username, display name, bio, and whether to publish the profile. Existing and new profiles default to **nonpublic**. Accounts are not automatically listed in discovery.

- Usernames contain 3–30 ASCII characters, start with a letter, and permit letters, digits, and underscores. Input is normalized to lowercase; the database also enforces case-insensitive uniqueness. A username change changes the public profile link.
- Display names are required, up to 80 characters. Bios are optional, up to 1,000 characters, rendered as plain text.
- `/players` searches public usernames and display names, with literal SQL wildcard handling and 18 results per page. Email and account names are not search fields.
- `/players/{username}` accepts case-insensitive username lookups. It exposes the chosen public identity, follow counts, public reviews, and public lists. Review and list pagination use separate `reviews_page` and `lists_page` parameters.
- Private profiles return 404, including to the owner; owners manage them through the authenticated editor.
- Public data uses explicit resource fields. The profile never exposes login credentials, email, library statuses, favorites, playthroughs, diary entries, private reviews, or private/unlisted lists. Public reviews and lists use the public alias while the profile is active.
- Switching off the profile hides it from player discovery and community feeds. Existing publicly shared reviews remain on game pages, and public lists remain accessible through their existing list routes and discovery. Their own visibility controls still apply. The chosen display name remains on those public contributions, while the profile link disappears. Follow relationships are retained if a player hides their profile.

## Following

Follow or unfollow from another public player's profile. Login is required; publishing one's own profile is optional. The server derives the follower from the authenticated session, rejects following oneself, validates that the target is public, and treats repeated follow/unfollow operations idempotently. Follow mutations share a limit of 30 per minute per user. Existing email verification rules apply, including the configured local-development bypass.

No email, push notification, recurring import, or external API request is triggered by following. Community activity currently includes published reviews; private library and diary events are not published. Spoiler reviews remain collapsed until expanded.

## Storage and verification

The feature reuses `user_profiles` and `follows`. An additive migration introduces `user_profiles.is_public` with a false default and an index on `reviews (is_public, updated_at, id)`. It does not alter player history or publish existing accounts. Eager loading supplies author profiles, ratings, and local game metadata; nested game resources are resolved before Inertia traverses them.

`CommunityTest` covers opt-in publishing, ownership, username normalization/collisions, follow direction/idempotency/self-follow prevention, authentication, throttling, feed filtering, privacy changes, spoiler metadata, pagination, safe resources, and game-review author links on SQLite and isolated PostgreSQL. Browser checks use temporary local accounts, exercise actual login and profile/follow forms, and remove their records afterward.

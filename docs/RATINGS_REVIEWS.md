# Ratings and reviews

This part of stage 4 adds an overall rating and an editable review for each game in a player's library. It uses the existing schema and makes no external catalog requests.

## Player workflow

Open a game detail page and use the action card on the right. Rating and review actions add the game to your library automatically when needed. **Your rating** lets you hover the left or right half of each star to preview 0.5–5 stars, then click to save immediately. Hovering alone never changes data; leaving the row restores the saved score. Touch users tap a half/full star. Keyboard users can preview with arrow keys, Home, or End and save with Enter or Space. **Clear rating** removes an existing rating. Your review, status, favorite state, and playthroughs are preserved.

The **Your story** form supports up to 10,000 characters, multiline text, a spoiler flag, and a public/private choice. New reviews default to private in the form. **Share publicly** and **Publish review** publish the text with the player's account name. The owner can edit the same review, make it private again, or delete it after confirmation. Deleting a review preserves the rating and other playing history.

A game can be rated or reviewed with any of the four playing statuses or without a status. Adding a rating or review does not mark a game Completed or create a playthrough. Rating and review saves update the library entry's timestamp so the recent collection shows the latest personal activity.

## Scores and aggregation

`PUT /library/{game:slug}/rating` accepts a present `stars` field: null to clear, or a numeric half-star value between 0.5 and 5. Values are stored as integers 1–10. Each user/game library entry has one current rating, so edits and repeat playthroughs do not add votes.

Personal ratings appear on library/dashboard cards and in the editor. Community averages and rating counts use all current PlayHaven ratings, including ratings belonging to a private review. RAWG ratings are not imported into this aggregate.

## Reviews, privacy, and spoilers

`PUT /library/{game:slug}/review` accepts `body`, `contains_spoilers`, and `is_public`. Unicode whitespace is trimmed at the boundaries, blank reviews are rejected, and both flags must be booleans. Submitted ownership IDs are excluded by request validation. Text is rendered through React's escaped text output.

`DELETE /library/{game:slug}/review` requires an accepted `confirm` value. All writes derive the entry from the logged-in user's library and lock it within a transaction. A missing owned entry returns 404. Authentication and the existing verification middleware protect these endpoints; local development can use the configured email-verification bypass.

The game detail page includes:

- `personalRating` and `personalReview` for the current user only.
- A community review collection filtered to public reviews for that game, ordered by last update and ID, with ten per page.
- Public author account names and current ratings. Email addresses and library ownership IDs are excluded from public review resources.

Private reviews are excluded from community records, counts, and pagination. Public spoilers are initially collapsed with an accessible disclosure control; their text is part of the public page payload. Making a review private removes it from subsequent public responses. Review pagination uses the validated `reviews_page` parameter.

## Verification and next stage

`tests/Feature/GameExperienceTest.php` covers all ten half-star values, invalid inputs, clearing ratings, edits without duplicate rows, history preservation, ownership spoofing, privacy changes, public pagination, spoiler flags, confirmed deletion, and aggregate updates. Both SQLite and the isolated PostgreSQL test database are supported.

Multiple playthroughs and dated private diary sessions are now implemented; see [playing history](PLAYING_HISTORY.md). Their actions preserve the overall rating and review.

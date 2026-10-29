# Custom game lists

The first community feature lets players curate ordered collections independently of their personal library. Adding or removing a game in a list preserves its library status, ratings, reviews, and playing history.

## Workflow

Open **Lists** to create a named collection with an optional description. New forms start with **Private** visibility. Open the resulting list, search the local catalog, and choose **Add to list**. Games appear once in each list. Repeated adds preserve the existing item and its notes.

Expand **Edit notes and position** on an item to enter up to 2,000 characters and choose its new position within the complete list. Saves reorder items atomically and normalize positions. Removing an item also normalizes the remaining positions. Removing items or deleting a collection requires confirmation.

The **List details & sharing** section edits name, description, and visibility. Share links remain stable after renaming. New list slugs contain a random ULID suffix and are scoped to the owner's ID; legacy owner-scoped slugs continue to work. The read-only link field can be selected and copied even when the local HTTP site cannot use the browser clipboard API.

## Visibility

| Setting  | Direct link                            | Community discovery |
| -------- | -------------------------------------- | ------------------- |
| Private  | Owner only; other visitors receive 404 | Excluded            |
| Unlisted | Anyone with the link                   | Excluded            |
| Public   | Anyone                                 | Included            |

Public list pages expose the owner's account name. Private/unlisted responses send `X-Robots-Tag: noindex, nofollow`, and all list-detail responses prevent shared caching with `Cache-Control: private, no-store`. Unlisted links can be shared onward; choose Private when access must be restricted.

`/lists` contains the signed-in user's collections. `/lists/discover` searches public lists and is available to guests. `/lists/{listOwner}/{listSlug}` reads the exact owner's collection and applies visibility checks. Lists paginate twelve at a time, list games twenty-four, and the owner game picker returns up to twelve additional local matches.

## Writes and ownership

Authenticated, verified routes under `/my-lists` create, edit, and remove collections/items. The local email-verification bypass remains supported. Every mutation resolves the list through the current user's `gameLists()` relation. Items must belong to that exact list. Client-provided owner IDs, parent IDs, slugs, and replacement game IDs are excluded from metadata updates.

Item mutations lock the list in a transaction to serialize adds, reordering, and removal. Existing unique constraints enforce one user/slug and one list/game pair. A list can contain games that are absent from the owner's library. Missing games can first be added through [RAWG discovery](CATALOG.md#search-and-import-from-the-website).

`tests/Feature/GameListsTest.php` covers visibility, privacy changes, ownership, stable share URLs, duplicate adds, ordering and notes, confirmation, library preservation, filtering, and pagination. SQLite and the isolated PostgreSQL test database are supported.

The next community features are player profiles, following, and an activity feed.

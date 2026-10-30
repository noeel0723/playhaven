# Custom game lists

The first community feature lets players curate ordered collections independently of their personal library. Adding or removing a game in a list preserves its library status, ratings, reviews, and playing history.

## Workflow

Open **Lists** to browse public collections. **Create a list** opens the compact form in **Your lists**; **New list** opens it again on that page. Create a named collection with an optional description. New forms start with **Private** visibility and open the dedicated editor after creation. Search the local catalog and choose **Add to list**. Games appear once in each list. Repeated adds preserve the existing item and its notes.

## List gallery and editor

The detail page displays numbered covers: five columns on desktop, four on tablets, and three on phones, with posters capped at 144px. Item notes expand below their covers. The right panel contains the share link, the owner's **Edit list** action, and the signed-in viewer's completion progress. Progress counts only games marked Completed in that viewer's library; guests receive a login link. Empty lists show 0%. Opening a list never changes library data.

**Edit list** opens `/my-lists/{gameList}/edit`, available only to the authenticated, verified owner (including the existing local verification bypass). Other users receive 404. Name, visibility, and description use a compact two-column form. **Save list** saves those fields and stays in the editor. Search and editor pagination preserve unsaved metadata drafts.

Games appear in compact rows with position, cover, title, release year, and the public community rating when available. Arrow buttons move a game immediately. **Add note** or **Edit note** opens the note and numeric position fields; **Save item** applies both, and **Cancel** restores the saved note. Each note supports up to 2,000 characters. Item saves reorder atomically and normalize positions. Removing games and deleting a list require confirmation. Adds and moves return to the editor page containing the affected position; each page holds 24 games.

Share links remain stable after renaming. New list slugs contain a random ULID suffix and are scoped to the owner's ID; legacy owner-scoped slugs continue to work. The read-only link field can be selected and copied even when the local HTTP site cannot use the browser clipboard API.

## Compact discovery and previews

Community and personal list cards display a strip of up to five covers, a small title and description, the creator, and the total game count. Desktop rows contain three cards, tablets two, and phones one. Cards are at most 320px wide with a 5:2 cover strip; missing cover artwork and empty lists have explicit fallbacks. Personal cards also show Public, Private, or Unlisted. Creator names link to a player profile only when that profile is public.

Discovery supports list-name search and **Recently updated**, **Most games**, or **Name A–Z** ordering. Filters stay in pagination URLs. On the first unfiltered recent page, when more than three public lists exist, **Featured lists** selects up to three nonempty public collections with the most games, breaking ties by update time and ID. This uses actual collection sizes; it does not represent weekly activity or reactions. Small catalogs show the ordinary results directly.

Previews eager-load at most five items per collection in saved position order, preserving the full item count. They expose game ID, name, slug, and validated artwork URL, without item notes or library state. Private/unlisted collections are excluded from public discovery and featured results. A shared artwork helper keeps the catalog and preview URL validation identical. Existing public player list cards use the same bounded previews.

## Visibility

| Setting  | Direct link                            | Community discovery |
| -------- | -------------------------------------- | ------------------- |
| Private  | Owner only; other visitors receive 404 | Excluded            |
| Unlisted | Anyone with the link                   | Excluded            |
| Public   | Anyone                                 | Included            |

Public list pages expose the owner's account name. Private/unlisted detail responses and all editor responses send `X-Robots-Tag: noindex, nofollow`. Detail and editor responses prevent shared caching with `Cache-Control: private, no-store`. Unlisted links can be shared onward; choose Private when access must be restricted.

`/lists` contains the signed-in user's collections. `/lists/discover` searches public lists and is available to guests. `/lists/{listOwner}/{listSlug}` reads the exact owner's collection and applies visibility checks. Lists paginate twelve at a time, list games twenty-four, and the owner game picker returns up to twelve additional local matches.

## Writes and ownership

Authenticated, verified routes under `/my-lists` create, edit, and remove collections/items. The local email-verification bypass remains supported. Every mutation resolves the list through the current user's `gameLists()` relation. Items must belong to that exact list. Client-provided owner IDs, parent IDs, slugs, and replacement game IDs are excluded from metadata updates.

Item mutations lock the list in a transaction to serialize adds, reordering, and removal. Existing unique constraints enforce one user/slug and one list/game pair. A list can contain games that are absent from the owner's library. Missing games can first be added through [RAWG discovery](CATALOG.md#search-and-import-from-the-website).

Editor writes send the validated `return_to_edit` flag to stay in the editor. Existing callers without this flag keep their detail-page redirects; the game action card's `return_to_game` behavior is preserved.

`tests/Feature/GameListsTest.php` covers visibility, privacy changes, ownership, stable share URLs, duplicate adds, ordering and notes, confirmation, library preservation, filtering, and pagination. `ListEditorTest` covers editor access, read-only detail props, viewer-specific completion progress, editor redirects, cross-page positions, and library preservation. `ListDiscoveryPresentationTest` covers bounded previews per parent list, public-only highlights, search/sort pagination, unsafe artwork, empty collections, and profile visibility. SQLite and the isolated PostgreSQL test database are supported.

Player profiles, following, and the community review feed are also available.

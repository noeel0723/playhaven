# PlayHaven product foundation

**Tagline:** Your Games. Your Stories.
**Category:** Social Game Cataloging & Discovery Platform
**Primary language:** English
**Audience:** PC gamers, console gamers, casual players, collectors, and gaming communities.

## Vision

A polished consumer application where players discover games, remember their playthroughs, organize collections, share reviews, and connect with others. Use an original identity and interaction design. Do not reproduce another platform's logos, brand assets, or distinctive screen designs.

## Core experiences to implement

- Global game catalog, search, filtering, and detailed game pages.
- Library status: Playing, Completed, Paused, Dropped, Backlog.
- Ratings from 0.5 to 5 stars in increments of 0.5.
- Reviews with editing, a gaming diary, and multiple playthroughs per game.
- Custom lists, following, community activity, and personal statistics.
- Discovery by popularity and community ratings.

## Visual foundation

Palette transcribed from the supplied reference:

| Token   | Hex       | Intended use                |
| ------- | --------- | --------------------------- |
| Mustang | `#807D7D` | Decorative neutral          |
| Shadow  | `#4E4949` | Borders and raised surfaces |
| Caviar  | `#010101` | Main dark background        |
| Saddle  | `#5C5551` | Secondary surfaces          |
| Rein    | `#312E2E` | Cards and navigation        |

Use complementary warm light foregrounds for readable text. The dark reference colors are not all suitable for body text on dark backgrounds. Typography pairs a restrained sans serif with editorial serif accents. Keep mobile layouts responsive and respect reduced motion.

## Development stages

1. **Tooling foundation:** Laravel/React starter, auth, PostgreSQL, Sanctum, IGDB configuration, build and test workflow.
2. **Domain and database:** agree on user profiles, games, library entries, playthroughs, diary entries, reviews, ratings, lists/list items, and follows. Keep repeat playthroughs separate from the single user/game library status. Store ratings as integers 1–10 and present them divided by two.
3. **Catalog:** server-side IGDB integration, local persistence, controlled background synchronization, search/filtering, and game detail pages.
4. **Personal experience:** statuses, ratings, reviews, diary, and repeat playthroughs with authorization and validation.
5. **Community:** lists, follows, activity feed, profiles, privacy, and moderation controls.
6. **Statistics and discovery:** aggregates, popular/highly rated games, query optimization, and responsive polish.
7. **Release and mobile:** production infrastructure, email, backups, monitoring, and a versioned API consumed by React Native + Expo.

Stages 2–7 are planned work. The current setup does not implement the game domain yet.

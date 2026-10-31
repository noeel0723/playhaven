# Private player statistics

Open **Your statistics** from the dashboard or account menu, or visit `/stats`. The route requires authentication and the existing verification middleware, including the local development bypass. It always selects the authenticated user; there is no public or user-ID-based statistics endpoint. Responses use `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`.

The page uses the global sans-serif font in a centered 896px container. A compact Statistics header and privacy note replace the introductory hero. Summary cards, status rows, charts, rankings, year controls, and the expandable monthly table share smaller type and spacing. The overview uses two columns on phones and four on wider screens; breakdowns stack on small screens. All statistics, year filtering, links, and data definitions remain unchanged.

## What the numbers mean

| Area               | Source and definition                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current collection | One library entry per game, split across four playing statuses. Completion percentage is currently Completed / total library games, including games without a status. Favorites use the private library flag.            |
| Ratings            | The user's current integer scores divided by two. Ten fixed half-star buckets include empty values. The mean is rounded to one decimal; no ratings gives null rather than a zero-star average. Replays do not add votes. |
| Diary time         | Sum of recorded `minutes_played`. Sessions with null duration still count as sessions and active days, but contribute no minutes. Explicit zero is a recorded duration.                                                  |
| Active days        | Distinct diary calendar dates, regardless of how many sessions or playthroughs share the date.                                                                                                                           |
| Most played        | Up to five games ranked by summed recorded diary minutes across all playthroughs. Games with no positive recorded time stay out of the ranking.                                                                          |
| Played genres      | Up to eight genres counted once per owned game with a playing status. Multi-genre games count once in each genre; replay counts do not multiply the result.                                                              |
| Platforms          | Up to eight platforms actually selected on playthroughs, with run count and distinct game count. Catalog-supported platforms are not treated as played platforms. Unspecified-platform runs are counted separately.      |

Collection, ratings, most-played games, genres, and platforms describe the current all-time data. Selecting a **Diary year** changes only the annual diary section. The year control includes years present in the user's diary, the current year, and a valid selected year with no sessions. Months are always January–December, with zero-filled empty months. The bar chart shows recorded minutes; a native expandable data table supplies exact session, duration, and active-day values.

Years 1 through the current year are accepted. Annual queries use a half-open calendar range (January 1 inclusive through the next January 1 exclusive), preserving December 31 entries on PostgreSQL and SQLite. Diary dates are calendar dates, rather than session creation timestamps. All-time totals remain unchanged when switching years.

## Data boundaries

`PlayerStatistics` uses ownership-scoped aggregate queries. Diary ownership follows session → playthrough → library entry → user; ratings and platforms use the same owner boundary. Genre, rating, and diary aggregates are computed separately to avoid join multiplication. Raw diary notes, review bodies, playthrough labels, passwords, and other players' records are not included in statistics props.

Statistics are calculated from current rows on each request. Editing/deleting a rating or session affects the next request. No snapshots, inferred game durations, synthetic activity, external API calls, schema changes, or automatic background jobs are introduced. Existing public-profile sharing choices do not publish these statistics.

## Verification

`StatisticsTest` checks authenticated access, private response headers, empty states, exact aggregates, ownership isolation, replay deduplication, null/zero durations, distinct dates, year boundaries and leap day, fixed histogram/month buckets, genre and platform semantics, bounded rankings, update/deletion freshness, and input validation. It runs on SQLite and isolated `playhaven_testing` PostgreSQL. Browser checks use temporary local accounts for empty and populated states, year filtering/reload, the accessible data table, dashboard/menu/library links, and desktop/mobile layout; fixture records are removed afterward.

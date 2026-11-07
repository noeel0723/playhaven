# Connected worlds

TheGamesDB does not document sequel/prequel/universe endpoints. PlayHaven therefore retains explicit curated relationships and does not guess story order from titles or release dates. Empty Connected worlds sections stay hidden; opening a game does not trigger an automatic relationship API call.

Import both games into the local catalog, then curate the relationship:

```powershell
. .\scripts\env.ps1
php artisan catalog:relate source-game-slug target-game-slug sequel --note="Verified story continuation" --source-url="https://example.com/source"
```

Types: `prequel`, `sequel`, `universe`, `series`, `addition`, `parent`. The inverse relationship is saved automatically. Remove both directions with:

```powershell
php artisan catalog:relate source-game-slug target-game-slug --remove
```

The command requires two distinct local games with TheGamesDB IDs. Public users cannot rewrite these edges. Connections preserve compact covers, local game links, notes and validated source links. Ordinary catalog refreshes retain curated edges. A full explicit catalog reset removes them with the old games.

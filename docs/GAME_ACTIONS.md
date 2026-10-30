# Game action card

Game details place a compact action card in the right column on desktop and before the description on mobile. The card uses PlayHaven's neutral palette and shared components.

- **Add to library** saves a game without requiring a playing status. The four choices are Playing, Completed, Paused, and Dropped. Selecting one also adds the game to the library. Existing Backlog rows migrate to an unset status while preserving their IDs, timestamps, ratings, reviews, and playthroughs.
- **Favorite** toggles the private library flag independently of Top 4 profile picks.
- **Diary** opens the game's existing playthrough editor.
- **Your rating** is an inline 0.5–5 star picker. Hovering the left/right half of a star previews a half/full score without sending requests; leaving the row restores the saved score. Clicking or tapping saves immediately. Arrow keys, Home, and End preview a score; Enter or Space saves it. **Clear rating** removes only the rating. Controls are disabled while a save is running, and selecting the saved value again sends no duplicate request.
- **Write a review / Edit your review** opens the existing review editor, including spoiler and public/private controls. Rating, review, favorite, and diary actions add the game to the library when needed, without setting a playing status.
- **Add to a list** only presents lists belonging to the authenticated account, including its private lists. The server verifies ownership, prevents duplicate items, and returns to the same game. This action alone does not add a library entry.
- **In library** opens library management. Removal requires explicit confirmation and uses the existing cascade deletion of that game's rating, review, and diary. Closing the dialog clears confirmation.

Guests receive a login link. Dialogs support Escape and return keyboard focus to the action that opened them. Private list metadata is never supplied to guests or other accounts.

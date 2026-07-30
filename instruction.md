# Project Instructions for GitHub Copilot

## Project Overview

This is a Sudoku game built with Python Flask (backend) and vanilla JavaScript, HTML, and CSS (frontend). It was refactored from a simple legacy version into a full-featured game with difficulty levels, hints, a timer, live input validation, and a persistent Top 10 leaderboard.

## Tech Stack
- Backend: Python 3, Flask (using async views via flask[async])
- Frontend: Vanilla JavaScript (no frameworks), HTML, CSS
- Testing: pytest
- Data persistence: Browser localStorage (no database)

## Coding Conventions
- Use async def for Flask routes that perform any I/O or puzzle-generation work.
- Wrap route logic in try/except blocks. Never let an exception crash a route — return a  JSON error response with a clear message and an appropriate HTTP status code (400 for bad input, 500 for server errors).
- Add short comments explaining non-obvious logic, especially in sudoku_logic.py (puzzle generation, uniqueness validation) and main.js (event handling, localStorage logic).
- Keep functions small and single-purpose. Prefer breaking large functions into helpers over long nested logic.
- Use event delegation in JavaScript (attach one listener to the board container, not one per cell).
- Match existing naming and formatting style already present in the file you're editing.

## Game Requirements (keep these in mind for any related change)
- Puzzles must always have exactly one unique solution.
- Difficulty (Easy, Medium, Hard) controls how many cells are prefilled.
- Prefilled cells must be locked and non-editable.
- Invalid entries should be visually highlighted immediately.
- Hint fills exactly one correct empty cell, locks it, and visually distinguishes it from prefilled and user-entered cells.
- Completing a puzzle shows a congratulatory message, prompts for the player's name, and saves name/time/hints/difficulty to a Top 10 list in localStorage (sorted fastest first, capped at 10, persists across reloads).
- The 3x3 Sudoku boxes must alternate background colors with no layout shift.
- The UI must support both light and dark mode with all text/buttons staying readable, and must be responsive on mobile and desktop.

## Testing
- Every new feature should keep existing tests passing.
- Run tests with: python -m pytest tests (from inside the starter folder).
- When adding a feature, prefer also adding a test for it in tests/test_app.py.

## What NOT to do
- Don't introduce a database or backend persistence — Top 10 scores must use localStorage only.
- Don't remove existing error handling or comments when refactoring.
- Don't change route names or function signatures unless explicitly asked.
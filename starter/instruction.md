# Copilot Instructions

## Project Overview

- A Flask-based Sudoku game refactored from legacy code, with async routes, difficulty levels, hints, a timer, and a Top 10 leaderboard stored in localStorage.

## Coding Rules

- Use async/await for Flask routes; wrap logic in try/except with clear error responses.
- Keep sudoku_logic.py focused on puzzle generation and validation only.
- Every generated puzzle must have exactly one unique solution.
- Prefilled cells must be locked and non-editable.
- Store Top 10 scores (name, time, hints, difficulty) in localStorage only — no database.
- Alternate 3x3 box colors with plain CSS; support both light and dark mode.
- Keep the UI responsive across mobile and desktop.
- Add short comments for non-obvious logic.
- Don't remove existing tests or error handling when refactoring.
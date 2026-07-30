import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import app as app_module
import sudoku_logic


def test_app_starts_and_homepage_renders():
    client = app_module.app.test_client()
    response = client.get("/")
    assert response.status_code == 200
    assert b"Sudoku Game" in response.data


def test_homepage_includes_leaderboard_table():
    client = app_module.app.test_client()
    response = client.get("/")
    assert response.status_code == 200
    assert b'id="leaderboard-table"' in response.data
    assert b'<th>Rank</th>' in response.data
    assert b'<th>Name</th>' in response.data


def test_generate_puzzle_creates_valid_board():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)

    assert _count_non_empty(puzzle) == 35
    assert _is_valid_solution(solution)
    assert _is_valid_puzzle(puzzle)


def test_is_safe_prevents_conflicts():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.is_safe(board, 0, 0, 1) is True

    board[0][1] = 1
    assert sudoku_logic.is_safe(board, 0, 0, 1) is False


def test_generate_puzzle_returns_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert _is_valid_solution(solution)
    assert _is_valid_puzzle(puzzle)
    assert sudoku_logic.count_solutions(sudoku_logic.deep_copy(puzzle)) == 1


def _count_non_empty(board):
    return sum(cell != sudoku_logic.EMPTY for row in board for cell in row)


def _is_valid_solution(board):
    for index in range(sudoku_logic.SIZE):
        row_vals = board[index]
        if len(set(row_vals)) != sudoku_logic.SIZE:
            return False

        col_vals = [board[row][index] for row in range(sudoku_logic.SIZE)]
        if len(set(col_vals)) != sudoku_logic.SIZE:
            return False

    for box_row in range(0, sudoku_logic.SIZE, 3):
        for box_col in range(0, sudoku_logic.SIZE, 3):
            values = [
                board[row][col]
                for row in range(box_row, box_row + 3)
                for col in range(box_col, box_col + 3)
            ]
            if len(set(values)) != sudoku_logic.SIZE:
                return False

    return True


def _is_valid_puzzle(board):
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            value = board[row][col]
            if value == sudoku_logic.EMPTY:
                continue
            if not sudoku_logic.is_safe(board, row, col, value):
                return False
    return True
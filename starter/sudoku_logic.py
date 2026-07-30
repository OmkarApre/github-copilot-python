import copy
import random

SIZE = 9
EMPTY = 0
BOX_SIZE = 3
DIFFICULTY_SETTINGS = {
    'easy': 36,
    'medium': 31,
    'hard': 26,
}


def deep_copy(board):
    return copy.deepcopy(board)


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    for x in range(SIZE):
        if x != col and board[row][x] == num:
            return False
        if x != row and board[x][col] == num:
            return False

    start_row = row - row % BOX_SIZE
    start_col = col - col % BOX_SIZE
    for i in range(BOX_SIZE):
        for j in range(BOX_SIZE):
            box_row = start_row + i
            box_col = start_col + j
            if (box_row != row or box_col != col) and board[box_row][box_col] == num:
                return False
    return True


def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def is_valid_board(board):
    for row in board:
        seen = set()
        for value in row:
            if value == EMPTY:
                continue
            if value < 1 or value > SIZE or value in seen:
                return False
            seen.add(value)

    for col in range(SIZE):
        seen = set()
        for row in range(SIZE):
            value = board[row][col]
            if value == EMPTY:
                continue
            if value < 1 or value > SIZE or value in seen:
                return False
            seen.add(value)

    for box_row in range(0, SIZE, BOX_SIZE):
        for box_col in range(0, SIZE, BOX_SIZE):
            seen = set()
            for row in range(box_row, box_row + BOX_SIZE):
                for col in range(box_col, box_col + BOX_SIZE):
                    value = board[row][col]
                    if value == EMPTY:
                        continue
                    if value < 1 or value > SIZE or value in seen:
                        return False
                    seen.add(value)

    return True


def is_complete_solution(board):
    if not is_valid_board(board):
        return False
    return all(cell != EMPTY for row in board for cell in row)


def count_solutions(board, limit=2):
    if not is_valid_board(board):
        return 0

    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                solutions = 0
                candidates = list(range(1, SIZE + 1))
                random.shuffle(candidates)
                for candidate in candidates:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        solutions += count_solutions(board, limit)
                        board[row][col] = EMPTY
                        if solutions >= limit:
                            return limit
                return solutions
    return 1


def is_unique_solution(puzzle, solution=None):
    board = deep_copy(puzzle)
    if solution is not None:
        for row in range(SIZE):
            for col in range(SIZE):
                if puzzle[row][col] != EMPTY and puzzle[row][col] != solution[row][col]:
                    return False
    return count_solutions(board) == 1


def generate_puzzle(clues=None, difficulty='easy'):
    difficulty_key = (difficulty or 'easy').lower()
    if clues is None:
        target_clues = DIFFICULTY_SETTINGS.get(difficulty_key, 35)
    else:
        target_clues = clues

    target_clues = max(17, min(81, int(target_clues)))
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)

    puzzle = deep_copy(board)
    cells = list(range(SIZE * SIZE))
    random.shuffle(cells)
    removed = 0
    attempts = max(0, SIZE * SIZE - target_clues)

    while cells and removed < attempts:
        idx = cells.pop()
        row, col = divmod(idx, SIZE)
        if puzzle[row][col] == EMPTY:
            continue
        original = puzzle[row][col]
        puzzle[row][col] = EMPTY
        if count_solutions(deep_copy(puzzle)) != 1:
            puzzle[row][col] = original
            continue
        removed += 1

    return puzzle, solution

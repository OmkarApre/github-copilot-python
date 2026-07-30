# pyrefly: ignore [missing-import]
import random

from flask import Flask, jsonify, render_template, request

import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for the current puzzle and solution.
CURRENT = {
    'puzzle': None,
    'solution': None,
    'difficulty': 'easy',
    'hints': 0,
}


def _json_error(message, status=400):
    return jsonify({'error': message}), status


@app.route('/')
async def index():
    try:
        return render_template('index.html')
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route('/new')
async def new_game():
    try:
        difficulty = (request.args.get('difficulty', 'easy') or 'easy').lower()
        if difficulty not in sudoku_logic.DIFFICULTY_SETTINGS:
            difficulty = 'easy'

        clues = request.args.get('clues')
        if clues is None:
            clues = sudoku_logic.DIFFICULTY_SETTINGS[difficulty]
        else:
            clues = int(clues)

        puzzle, solution = sudoku_logic.generate_puzzle(clues=clues, difficulty=difficulty)
        CURRENT['puzzle'] = puzzle
        CURRENT['solution'] = solution
        CURRENT['difficulty'] = difficulty
        CURRENT['hints'] = 0
        return jsonify({'puzzle': puzzle, 'solution': solution, 'difficulty': difficulty})
    except ValueError as exc:
        return _json_error('Invalid clue count.', 400)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route('/check', methods=['POST'])
async def check_solution():
    try:
        data = request.get_json(silent=True) or {}
        board = data.get('board')
        solution = CURRENT.get('solution')
        if solution is None:
            return _json_error('No game in progress', 400)
        if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
            return _json_error('Board must be a 9x9 array.', 400)

        incorrect = []
        for row in range(sudoku_logic.SIZE):
            if not isinstance(board[row], list) or len(board[row]) != sudoku_logic.SIZE:
                return _json_error('Board must be a 9x9 array.', 400)
            for col in range(sudoku_logic.SIZE):
                if board[row][col] != solution[row][col]:
                    incorrect.append([row, col])

        solved = len(incorrect) == 0 and sudoku_logic.is_complete_solution(board)
        return jsonify({'incorrect': incorrect, 'solved': solved})
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.route('/hint')
async def give_hint():
    try:
        puzzle = CURRENT.get('puzzle')
        solution = CURRENT.get('solution')
        if puzzle is None or solution is None:
            return _json_error('No game in progress', 400)

        empty_cells = [(row, col) for row in range(sudoku_logic.SIZE) for col in range(sudoku_logic.SIZE) if puzzle[row][col] == 0]
        if not empty_cells:
            return _json_error('No empty cells remain.', 400)

        row, col = random.choice(empty_cells)
        value = solution[row][col]
        puzzle[row][col] = value
        CURRENT['hints'] += 1
        return jsonify({'row': row, 'col': col, 'value': value, 'hints': CURRENT['hints']})
    except Exception as exc:
        return _json_error(str(exc), 500)


if __name__ == '__main__':
    app.run(debug=True)
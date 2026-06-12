"""Browser adapter for Guessing Game."""
import sys

import guessing_game as game


_state = {}


def reset(test_number=None, test_machine_guesses=None):
    """Reset game state. Test-only parameters make adapter tests deterministic."""
    global _state
    _state = {
        "phase": "menu",
        "previous": {"previous": [], "same": []},
        "min": -sys.maxsize,
        "max": sys.maxsize,
        "number": test_number,
        "test_number": test_number,
        "machine_guesses": list(test_machine_guesses or []),
    }


def start(test_number=None, test_machine_guesses=None):
    reset(test_number, test_machine_guesses)
    return _result(_menu_lines(), "=>")


def submit(raw_value):
    value = raw_value.strip().lower()
    phase = _state["phase"]

    if phase == "menu":
        return _handle_menu(value)
    if phase == "difficulty":
        return _handle_difficulty(value)
    if phase == "user_guess":
        return _handle_user_guess(value)
    if phase == "player_number":
        return _handle_player_number(value)

    return _result(["Invalid game state. Restart the game."], "", True)


def _handle_menu(value):
    if value == "1":
        _state["phase"] = "difficulty"
        return _result(_difficulty_lines(), "=>")
    if value == "2":
        _state["phase"] = "player_number"
        return _result(
            ["Pick a number and I will guess it."],
            _number_prompt(),
        )
    if value == "3":
        _state["number"] = _state["test_number"]
        if _state["number"] is None:
            _state["number"] = game.machine_pick_a_number(
                _state["previous"],
                _state["min"],
                _state["max"],
            )
        lines = [
            f"I have chosen a number between {_state['min']} & {_state['max']}!",
            *_machine_guess_lines(_state["number"]),
            *_stats_lines(False),
            "",
            *_menu_lines(),
        ]
        _state["phase"] = "menu"
        return _result(lines, "=>")
    if value in ("4", "q", "quit"):
        return _result(["Thanks for playing.  Goodbye!"], "", True)
    return _result(["Invalid menu option.  Try again.", "", *_menu_lines()], "=>")


def _handle_difficulty(value):
    if value not in ("1", "2"):
        return _result(["You must enter a number. Try again.", "", *_difficulty_lines()], "=>")

    if value == "2":
        _state["min"] = -100
        _state["max"] = 100
    else:
        _state["min"] = -sys.maxsize
        _state["max"] = sys.maxsize

    if _state["test_number"] is None:
        _state["number"] = game.machine_pick_a_number(
            _state["previous"],
            _state["min"],
            _state["max"],
        )
    else:
        _state["number"] = _state["test_number"]

    _state["phase"] = "user_guess"
    return _result(
        [f"I have chosen a number between {_state['min']} & {_state['max']}!"],
        "Take a guess =>",
    )


def _handle_user_guess(value):
    if value in ("q", "quit"):
        lines = [
            "Well, I guess you're giving up...",
            *_stats_lines(True),
            "",
            *_menu_lines(),
        ]
        _state["phase"] = "menu"
        return _result(lines, "=>")

    try:
        guess = int(value)
    except ValueError:
        return _result(["You must enter a number. Try again."], "Take a guess =>")

    lines = []
    if guess in _state["previous"]["previous"]:
        lines.append("You guessed this already, but ok.")
        _state["previous"]["same"].append(guess)

    comparison = game.compare_answer(_state["number"], guess)
    _state["previous"]["previous"].append(guess)

    if comparison == game.Guess.WIN:
        lines.extend(
            [
                f"WINNER!!! Congrats on winning! The winning number was {guess}.",
                *_stats_lines(False),
                "",
                *_menu_lines(),
            ]
        )
        _state["phase"] = "menu"
        return _result(lines, "=>")
    if comparison == game.Guess.LOW:
        lines.append("WRONG!!! Guess higher!")
    else:
        lines.append("WRONG!!! Guess lower!")
    return _result(lines, "Take a guess =>")


def _handle_player_number(value):
    try:
        target = int(value)
    except ValueError:
        return _result(["You must enter a number.  Try again."], _number_prompt())

    lines = [
        *_machine_guess_lines(target),
        *_stats_lines(False),
        "",
        *_menu_lines(),
    ]
    _state["phase"] = "menu"
    return _result(lines, "=>")


def _machine_guess_lines(target):
    low = _state["min"]
    high = _state["max"]
    lines = []
    while True:
        guess = _next_machine_guess(low, high)
        lines.append(f"Take a guess => {guess}")
        _state["previous"]["previous"].append(guess)
        comparison = game.compare_answer(target, guess)
        if comparison == game.Guess.WIN:
            lines.append(f"WINNER!!! Congrats on winning! The winning number was {guess}.")
            return lines
        if comparison == game.Guess.LOW:
            lines.append("WRONG!!! Guess higher!")
            low = guess + 1
        else:
            lines.append("WRONG!!! Guess lower!")
            high = guess - 1


def _next_machine_guess(low, high):
    if _state["machine_guesses"]:
        return _state["machine_guesses"].pop(0)
    return low + ((high - low) // 2)


def _result(lines, prompt, done=False):
    return {
        "output": "\n".join(str(line) for line in lines).strip(),
        "prompt": prompt,
        "done": done,
    }


def _menu_lines():
    return [
        "Welcome to The Guessing Game!",
        "-" * 36,
        "Pick a game mode:",
        "1) You vs. The Machine",
        "2) The Machine vs. You",
        "3) The Machine vs. The Machine",
        "4) Quit game",
        "-" * 36,
    ]


def _difficulty_lines():
    return [
        "Do you want to play like a machine or do you need it easy, like a human?",
        "-" * 36,
        "1) Play like a Machine!  (large number range)",
        "2) Go easy on me :(      (small number range)",
        "-" * 36,
    ]


def _number_prompt():
    return f"Enter a number between {_state['min']} & {_state['max']} =>"


def _stats_lines(give_up):
    end_phrase = "before you gave up!" if give_up else "to guess the correct number!"
    same_guesses = set(_state["previous"]["same"])
    lines = [
        f"It took {len(_state['previous']['previous'])} guess(es) {end_phrase}",
        f"There were {len(same_guesses)} number(s) that were guessed more than once.",
    ]
    if same_guesses:
        lines.extend(
            [
                "These are the number(s) that were guessed more than once:",
                ", ".join(str(guess) for guess in sorted(same_guesses)),
            ]
        )
    return lines

"""Browser adapter for Space Adventure Text Game."""
import copy

import space_adventure_text_game as game


_INITIAL_ROOMS = copy.deepcopy(game.rooms)
_done = False


def reset():
    """Reset mutable game globals to their initial state."""
    global _done
    game.rooms = copy.deepcopy(_INITIAL_ROOMS)
    game.player = {
        game.Key.LOCATION: game.Room.COMMON_AREA,
        game.Key.INVENTORY: [],
    }
    _done = False


def start():
    """Start a new game and return the intro, help, and current status."""
    reset()
    lines = [
        "Space Text Adventure Game",
        "-" * 90,
        "Your ship is under attack, and you're adrift in space. Someone,",
        "or something, is running amuck causing systems to malfunction.",
        "",
        "Gather parts, supplies, and powered armor before you run into",
        "whatever is loose on your ship.",
        "",
        *_help_lines(),
        "",
        *_status_lines(),
    ]
    return _result(lines)


def submit(raw_command):
    """Submit one terminal command."""
    global _done
    if _done:
        return _result(
            ["The game is over. Use Restart to begin again."],
            done=True,
        )

    command_text = raw_command.strip()
    if not command_text:
        return _result(["Enter a command."], extra_status=True)

    parts = command_text.split(" ", 1)
    command = parts[0].lower()
    direction_or_item = parts[1].strip().title() if len(parts) > 1 else ""
    player_command, target = game.parse_enum(command, direction_or_item)
    location = game.player[game.Key.LOCATION]

    if player_command == -1:
        return _result(["That is not a valid command!"], extra_status=True)

    if player_command == game.Command.EXIT:
        _done = True
        return _result(_goodbye_lines(), done=True)

    if player_command == game.Command.HELP:
        return _result([*_help_lines(), "", *_status_lines()])

    if player_command == game.Command.GO:
        if target not in game.rooms[location]:
            return _result(["You can't go that way."], extra_status=True)
        game.move_player(target)
        return _after_action([f"Moved to {game.player[game.Key.LOCATION].value}."])

    if player_command == game.Command.GET:
        room_items = game.rooms[location][game.Key.ITEM]
        if target not in room_items or target == "":
            return _result(["You cannot pick up that item."], extra_status=True)
        item_name = target.value
        game.get_item()
        return _after_action([f"Picked up {item_name}."])

    return _result(["That is not a valid command!"], extra_status=True)


def _after_action(lines):
    game_over = _game_over_lines()
    if game_over:
        return _result([*lines, "", *_status_lines(), "", *game_over], done=True)
    return _result([*lines, "", *_status_lines()])


def _result(lines, prompt="Enter your move =>", done=False, extra_status=False):
    global _done
    output_lines = list(lines)
    if extra_status:
        output_lines.extend(["", *_status_lines()])
    if done:
        _done = True
    return {
        "output": "\n".join(output_lines).strip(),
        "prompt": "" if done else prompt,
        "done": done,
    }


def _help_lines():
    required_item_list = sorted(item.value for item in game.required_items)
    return [
        "-" * 90,
        "Explore the game by using move commands to navigate around the map.",
        "- You must collect the six required items to win the game.",
        "- If you run into whatever is on your ship before collecting all items, you lose!",
        "",
        "Required Items:",
        f"\t{', '.join(required_item_list)}",
        "Move Commands:",
        "\tgo Forward, go Aft, go Port, go Starboard",
        "Other Commands:",
        "\tget <item name>, help, exit",
        "-" * 90,
    ]


def _status_lines():
    location = game.player[game.Key.LOCATION]
    inventory = sorted(item.value for item in game.player[game.Key.INVENTORY])
    lines = [
        "-" * 36,
        f"You are in the {location.value}.",
        f"Inventory: [ {', '.join(inventory)} ]",
    ]
    current_item = _current_room_item()
    if current_item:
        item_determiner = game.rooms[location][game.Key.ITEM][current_item]
        lines.extend(
            [
                "-" * 36,
                f"You see {item_determiner} {current_item.value.lower()}.",
            ]
        )
    lines.append("-" * 36)
    return lines


def _current_room_item():
    location = game.player[game.Key.LOCATION]
    return next(iter(game.rooms[location][game.Key.ITEM].keys()))


def _game_over_lines():
    if set(game.required_items).issubset(game.player[game.Key.INVENTORY]):
        return [
            "Congrats! You collected all the required items and won the game!",
            *_goodbye_lines(),
        ]
    if _current_room_item() is game.Item.VILLAIN:
        return [
            f"Oh no! You ran into the {game.Item.VILLAIN.value} and lost the game!",
            *_goodbye_lines(),
        ]
    return []


def _goodbye_lines():
    return [
        "-" * 46,
        "Thanks for playing Space Adventure Text Game.",
        "I hope you enjoyed it!!!",
    ]

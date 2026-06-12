import importlib
import pathlib
import sys
import unittest


sys.dont_write_bytecode = True

ROOT = pathlib.Path(__file__).resolve().parents[1]
GAMES = ROOT / "src" / "assets" / "python-games"


def import_fresh(module_name, paths):
    original_path = list(sys.path)
    try:
        for path in reversed(paths):
            sys.path.insert(0, str(path))
        for loaded_name in list(sys.modules):
            if (
                loaded_name == module_name
                or loaded_name.startswith("space_adventure")
                or loaded_name.startswith("guessing_game")
                or loaded_name in {"command", "direction", "item", "key", "room"}
            ):
                del sys.modules[loaded_name]
        return importlib.import_module(module_name)
    finally:
        sys.path = original_path


class SpaceAdventureAdapterTests(unittest.TestCase):
    def setUp(self):
        game_path = GAMES / "space-adventure"
        self.adapter = import_fresh(
            "space_adventure_adapter",
            [game_path, game_path / "custom_type"],
        )

    def test_start_invalid_command_help_and_item_pickup(self):
        result = self.adapter.start()
        self.assertIn("Space Text Adventure Game", result["output"])
        self.assertIn("Common Area", result["output"])
        self.assertEqual(result["prompt"], "Enter your move =>")

        result = self.adapter.submit("dance")
        self.assertIn("That is not a valid command!", result["output"])

        result = self.adapter.submit("help")
        self.assertIn("Move Commands:", result["output"])

        self.adapter.submit("go Forward")
        result = self.adapter.submit("get Access Card")
        self.assertIn("Picked up Access Card.", result["output"])
        self.assertIn("Access Card", result["output"])

    def test_loss_and_win_paths(self):
        self.adapter.start()
        self.adapter.submit("go Forward")
        self.adapter.submit("get Access Card")
        self.adapter.submit("go Starboard")
        self.adapter.submit("get Powered Armor")
        self.adapter.submit("go Aft")
        self.adapter.submit("get Space Glue")
        self.adapter.submit("go Aft")
        self.adapter.submit("get Spare Parts")
        self.adapter.submit("go Port")
        self.adapter.submit("get Sonic Screwdriver")
        self.adapter.submit("go Forward")
        self.adapter.submit("go Port")
        result = self.adapter.submit("get Space Snacks")
        self.assertTrue(result["done"])
        self.assertIn("won the game", result["output"])

        self.adapter.start()
        self.adapter.submit("go Aft")
        self.adapter.submit("go Starboard")
        result = self.adapter.submit("go Starboard")
        self.assertTrue(result["done"])
        self.assertIn("lost the game", result["output"])


class GuessingGameAdapterTests(unittest.TestCase):
    def setUp(self):
        game_path = GAMES / "guessing-game"
        self.adapter = import_fresh("guessing_game_adapter", [game_path])

    def test_menu_invalid_option_user_guessing_and_quit(self):
        result = self.adapter.start(test_number=7)
        self.assertIn("Welcome to The Guessing Game!", result["output"])
        self.assertEqual(result["prompt"], "=>")

        result = self.adapter.submit("bad")
        self.assertIn("Invalid menu option", result["output"])

        self.adapter.submit("1")
        result = self.adapter.submit("2")
        self.assertIn("between -100 & 100", result["output"])

        result = self.adapter.submit("5")
        self.assertIn("Guess higher", result["output"])

        result = self.adapter.submit("7")
        self.assertIn("WINNER", result["output"])
        self.assertIn("Welcome to The Guessing Game!", result["output"])
        self.assertFalse(result["done"])

        result = self.adapter.submit("quit")
        self.assertTrue(result["done"])
        self.assertIn("Goodbye", result["output"])

    def test_machine_mode_smoke(self):
        self.adapter.start(test_machine_guesses=[5])
        self.adapter.submit("2")
        result = self.adapter.submit("5")
        self.assertIn("Take a guess => 5", result["output"])
        self.assertIn("WINNER", result["output"])


if __name__ == "__main__":
    unittest.main()

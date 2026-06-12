"""Guessing Game"""
import sys
import random
import time
from enum import Enum


class Guess(Enum):
    """Enum for guess result types (high, low, win)."""
    LOW = -1
    WIN = 0
    HIGH = 1


def display_menu():
    """Displays game menu with game mode options and returns players pick."""
    # Welcome message.
    print("\nWelcome to The Guessing Game!")
    print('-' * 36)
    print("Pick a game mode:")
    print("1) You vs. The Machine")
    print("2) The Machine vs. You")
    print("3) The Machine vs. The Machine")
    print("4) Quit game")
    print('-' * 36)
    game_mode = input("=> ")
    return game_mode.lower()


def go_easy_on_me():
    """Displays menu to get difficulty level from the user."""
    while True:
        print("\nDo you want to play like a machine or do you need it easy, like a human?")
        print('-' * 36)
        print("1) Play like a Machine!  (large number range)")
        print("2) Go easy on me :(      (small number range)")
        print('-' * 36)
        try:
            difficulty_level = int(input("=> "))
            if difficulty_level <= 0 or difficulty_level > 2:
                raise ValueError()
        except ValueError:
            print("\nYou must enter a number. Try again.")
            continue
        # If user wants it easy, return true to play with smaller number range.
        if difficulty_level == 2:
            return True
        # Return false to play with same number range as the machine.
        return False


def machine_pick_a_number(previous_guesses,
                          lowest_guess,
                          highest_guess):
    """Returns the computers guess.  Takes in the computers previous guesses, a list of guesses
    the computer guessed more than once, and the high and low range to make a guess within."""
    # Gets a random integer within the specified range.
    random_guess = random.randint(lowest_guess, highest_guess)
    # If that number has been previously guessed, add it to list of same guesses and guess again.
    while random_guess in previous_guesses["previous"]:
        previous_guesses["same"].append(random_guess)
        random_guess = random.randint(lowest_guess, highest_guess)
    # Return the new guess.
    return random_guess


def compare_answer(number_to_guess, user_guess):
    """Returns if the guess is too high, too low, or just right.  Takes in the number to
    guess and the users guess."""
    if user_guess < number_to_guess:
        return Guess.LOW
    if user_guess > number_to_guess:
        return Guess.HIGH
    return Guess.WIN


def take_a_guess(number_to_guess,
                 previous_guesses,
                 lowest_guess=0,
                 highest_guess=0,
                 machine_playing=False):
    """You or the machine guesses the number was picked."""
    # Loop until the correct number is guessed or the user give up.
    while True:
        if machine_playing:
            # Gets the computers guess.
            guess = machine_pick_a_number(previous_guesses,
                                          lowest_guess,
                                          highest_guess)
            print(f"\nTake a guess => {guess}")
        else:
            # Get the players guess.
            guess = input("\nTake a guess => ").lower()
            # Checks and returns true if the user wants to stop guessing.
            if guess in ("q", "quit"):
                print("Well, I guess you're giving up...")
                return True
            try:
                guess = int(guess)
            except ValueError:
                print("\nYou must enter a number. Try again.")
                continue
            else:
                # Checks if player already guessed this number.
                if guess in previous_guesses["previous"]:
                    print("You guessed this already, but ok.")
                    previous_guesses["same"].append(guess)
        # Checks if the guess is too high or low or correct.
        did_i_win = compare_answer(number_to_guess, guess)
        # Adds the guess to list of previous guessed.
        previous_guesses["previous"].append(guess)
        # The number was guessed.
        if did_i_win.value == 0:
            print(f"WINNER!!! Congrats on winning! The winning number was {guess}.")
            # Return false as the number was guessed without giving up.
            return False
        # The number was too low.  Sets the guess as the new low value for next guess.
        if did_i_win.value == -1:
            print("WRONG!!! Guess higher!")
            lowest_guess = guess
        # The number was too high.  Sets the guess as the new high value for next guess.
        elif did_i_win.value == 1:
            print("WRONG!!! Guess lower!")
            highest_guess = guess
        # If the machine is playing, pause between each guess to watch it guess.
        if machine_playing:
            time.sleep(.1)


def display_game_stats(previous_guesses, give_up):
    """Computes stats from the end of the game and displays them."""
    if give_up:
        end_phrase = "before you gave up!"
    else:
        end_phrase = "to guess the correct number!"
    print(f"\nIt took {len(previous_guesses['previous'])} guess(es) {end_phrase}")
    print(f"There were {len(set(previous_guesses['same']))}"
          f" number(s) that were guessed more than once.")
    if len(previous_guesses['same']) > 0:
        print("\nThese are the number(s) that were guessed more than once:")
        print(*set(previous_guesses['same']), sep=", ")


def main():
    """Main function with the loop, function calls, and game flow logic."""
    # Dictionary with empty lists for storing previous guesses and numbers guessed more than once.
    previous_guesses = {"previous": [],
                        "same": []}
    # Loops until the player quits.
    while True:
        # Set range variables for storing the smallest and biggest possible number.
        max_integer = sys.maxsize
        min_integer = -sys.maxsize
        # Set starting value for give_up.
        give_up = False
        # Display menu and get desired game mode from player.
        menu_choice = display_menu()
        # Start specified game mode based on input.
        if menu_choice == "1":
            # Gets if user wants a smaller number range to guess from.
            easy_mode = go_easy_on_me()
            # Set range variables to a smaller range.
            if easy_mode:
                max_integer = 100
                min_integer = -100
            machine_number_to_guess = machine_pick_a_number(previous_guesses,
                                                            min_integer,
                                                            max_integer)
            print(f"\nI have chosen a number between {min_integer} & {max_integer}!")
            give_up = take_a_guess(machine_number_to_guess, previous_guesses)
        elif menu_choice == "2":
            print("\nPick a number and I will guess it.\n")
            while True:
                try:
                    # Number user picks to have guessed.
                    player_number_to_guess = int(input(f"Enter a number between"
                                                       f"{min_integer} & {max_integer} => "))
                except ValueError:
                    print("\nYou must enter a number.  Try again.\n")
                    continue
                else:
                    give_up = take_a_guess(player_number_to_guess,
                                           previous_guesses,
                                           min_integer,
                                           max_integer,
                                           True)
                    break
        elif menu_choice == "3":
            machine_number_to_guess = machine_pick_a_number(previous_guesses,
                                                            min_integer,
                                                            max_integer)
            print(f"\nI have chosen a number between {min_integer} & {max_integer}!")
            give_up = take_a_guess(machine_number_to_guess,
                                   previous_guesses,
                                   min_integer,
                                   max_integer,
                                   True)
        elif menu_choice in ("4", "q", "quit"):
            print("\nThanks for playing.  Goodbye!")
            break
        else:
            print("\nInvalid menu option.  Try again.\n")
            continue
        display_game_stats(previous_guesses, give_up)


# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    main()

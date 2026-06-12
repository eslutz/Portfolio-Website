"""Space Adventure Text Based Game"""
import time

from command import Command
from direction import Direction
from item import Item
from key import Key
from room import Room

# A dictionary for the simplified dragon text game.
# The dictionary links a room to other rooms.
rooms = {
    Room.AIRLOCK: {
        Direction.STARBOARD: Room.CARGO_BAY,
        Key.ITEM: {
            Item.VILLAIN: 'the'
        }
    },
    Room.ARMORY: {
        Direction.PORT: Room.BRIDGE,
        Direction.AFT: Room.SCIENCE_LAB,
        Key.ITEM: {
            Item.POWERED_ARMOR: 'your'
        }
    },
    Room.BRIDGE: {
        Direction.STARBOARD: Room.ARMORY,
        Direction.PORT: Room.MEDICAL_BAY,
        Direction.AFT: Room.COMMON_AREA,
        Key.ITEM: {
            Item.ACCESS_CARD: 'an'
        }
    },
    Room.CARGO_BAY: {
        Direction.STARBOARD: Room.AIRLOCK,
        Direction.PORT: Room.ENGINEERING,
        Direction.FORWARD: Room.SCIENCE_LAB,
        Key.ITEM: {
            Item.SPARE_PARTS: 'some'
        }
    },
    Room.COMMON_AREA: {
        Direction.STARBOARD: Room.SCIENCE_LAB,
        Direction.PORT: Room.GALLEY,
        Direction.AFT: Room.ENGINEERING,
        Direction.FORWARD: Room.BRIDGE,
        Key.ITEM: {
            '': ''
        }
    },
    Room.CREW_QUARTERS: {
        Direction.FORWARD: Room.GALLEY,
        Key.ITEM: {
            Item.SOCKS: 'your'
        }
    },
    Room.ENGINEERING: {
        Direction.STARBOARD: Room.CARGO_BAY,
        Direction.AFT: Room.REACTOR,
        Direction.FORWARD: Room.COMMON_AREA,
        Key.ITEM: {
            Item.SONIC_SCREWDRIVER: 'a'
        }
    },
    Room.GALLEY: {
        Direction.STARBOARD: Room.COMMON_AREA,
        Direction.AFT: Room.CREW_QUARTERS,
        Direction.FORWARD: Room.MEDICAL_BAY,
        Key.ITEM: {
            Item.SPACE_SNACKS: 'some'
        }
    },
    Room.MEDICAL_BAY: {
        Direction.STARBOARD: Room.BRIDGE,
        Direction.AFT: Room.GALLEY,
        Key.ITEM: {
            Item.FIRST_AID_KIT: 'a'
        }
    },
    Room.REACTOR: {
        Direction.FORWARD: Room.ENGINEERING,
        Key.ITEM: {
            Item.FLUX_CAPACITOR: 'a'
        }
    },
    Room.SCIENCE_LAB: {
        Direction.PORT: Room.COMMON_AREA,
        Direction.AFT: Room.CARGO_BAY,
        Direction.FORWARD: Room.ARMORY,
        Key.ITEM: {
            Item.SPACE_GLUE: 'some'
        }
    }
}

# A list of the items required to win the game.
required_items = [
    Item.ACCESS_CARD,
    Item.POWERED_ARMOR,
    Item.SONIC_SCREWDRIVER,
    Item.SPACE_GLUE,
    Item.SPACE_SNACKS,
    Item.SPARE_PARTS
]

# A dictionary for storing the players current location and inventory list.
player = {
    Key.LOCATION: Room.COMMON_AREA,
    Key.INVENTORY: []
}


def list_enum_values(enum_list, sort_values=False):
    """Returns list of enum values with an optional parameter to sort the list."""
    # List to store enum values and return.
    list_of_values = []
    # Loops through passed in list to get value of each enum.
    for item in enum_list:
        # Adds value to list_of_values.
        list_of_values.append(item.value)
    # Checks if sort_values is true.
    # Sorts the list if true.
    if sort_values:
        list_of_values.sort()
    # Returns list of values.
    return list_of_values


def instruction_help():
    """Displays instructions on how to play the game."""
    # Gets a list of required items to display.
    required_item_list = list_enum_values(required_items, True)
    # Prints a line of dashes before the instructions.
    print('\n'+'-' * 90)
    # Displays instructions on how to play the game.
    print('Explore the game by using move commands to navigate around the map.')
    print('- You must collect the six required items to win the game.')
    print('- If you run into whatever is on your ship before collecting all items, you lose!')
    print('\nRequired Items:')
    print(f"\t{', '.join(required_item_list)}")
    print('Move Commands:')
    print('\tgo Forward, go Aft, go Port, go Starboard')
    print('Other Commands:')
    print('\tget <item name>, help, exit')
    # Prints a line of dashes after the instructions.
    print('-' * 90)


def slow_print(line_to_print):
    """Function for the fun of printing slowly like a message."""
    # Takes input parameter and loops through each line in the array.
    for line in line_to_print:
        # Then loops through each character in the line.
        # Puts a small delay between each print to create the effect.
        for char in line:
            print(char, end='')
            time.sleep(.02)
        # Prints two lines between each section
        print('')


def display_intro():
    """Displays game intro and instructions."""
    # Displays game title.
    print('Space Text Adventure Game')
    # Prints a line of dashes after the title.
    print('-' * 90)
    # Separated game introduction in separate sections.
    game_intro_line_one = "\n\tYour ship is under attack, and you're adrift in space. Someone,\n" \
                          "or something, is running amuck causing systems to malfunction."
    game_intro_line_two = "\n\tYou need to gather parts to get the ship up and running again\n" \
                          "as well as find supplies to deal with the uninvited guest. You will\n" \
                          "need to gather an access card from the bridge to get access to any\n" \
                          "locked areas, space glue from the science lab, a sonic screwdriver\n" \
                          "from engineering, and spare parts from the cargo bay to repair the\n" \
                          "ship, and snacks from the galley to keep you going."
    game_intro_line_three = "\n\tLastly, you will need to get your suit of powered armor from\n" \
                            "the armory to escort the intruder from the ship how you see fit."
    # Puts each section of text into an array
    lines_to_print = [game_intro_line_one, game_intro_line_two, game_intro_line_three]
    # Passes the array to slow_print to display.
    slow_print(lines_to_print)
    input('\n(press enter to continue)')
    # Calls instruction_help() to initially display the instructions to the user.
    instruction_help()


def display_status():
    """Displays the current location of the player."""
    # Prints a line of dashes before displaying the current status of the player.
    print('\n' + '-' * 36)
    # Prints the players current location by accessing the player dictionary using the location key.
    print(f'You are in the {player[Key.LOCATION].value}.')
    # Gets a sorted list of the values in the players current inventory.
    inventory_list = list_enum_values(player[Key.INVENTORY], True)
    # Prints the list of items the player has in their inventory.
    print(f"Inventory: [ {', '.join(inventory_list)} ]")
    # Checks if there is an item in the current room.
    # Does this by creating a list of the item keys and checking it has a value.
    if list(rooms[player[Key.LOCATION]][Key.ITEM].keys())[0]:
        # Prints a line of dashes before the room item display.
        print('-' * 36)
        # Displays the item in the current room.
        item_determiner = rooms[player[Key.LOCATION]][Key.ITEM][
            list(rooms[player[Key.LOCATION]][Key.ITEM].keys())[0]
        ]
        item = list(rooms[player[Key.LOCATION]][Key.ITEM].keys())[0].value.lower()
        print(f'You see {item_determiner} {item}.')
    # Prints a line of dashes before the move prompt.
    print('-' * 36)


def parse_enum(command, direction_or_item):
    """Matches parameters to enums, else returns empty strings."""
    # Loops through each member of the Command enum class.
    for command_member in Command:
        # Compares the entered string to the value of the current enum member.
        if command == command_member.value:
            # If it matches, assigns that member to command and breaks out of the loop.
            command = command_member
            break
    # If there is no match, assign an empty string to command.
    else:
        command = -1
    # Loops through each member of the Direction enum class.
    for direction_member in Direction:
        # Compares the string to value of current enum member.
        if direction_or_item == direction_member.value:
            # If it matches, assigns that member to direction_or_item and breaks out of the loop.
            direction_or_item = direction_member
            break
    # If there is no match in Direction, check for match in Item.
    else:
        # Loops through each member of the Item enum class.
        for item_member in Item:
            # Compares the string to value of current enum member.
            if direction_or_item == item_member.value:
                # If a match, assigns that member to direction_or_item and breaks out of the loop.
                direction_or_item = item_member
                break
        # If there is no match after this check, assign -1 to direction_or_item.
        else:
            direction_or_item = -1
    # Returns either the matching enum or an empty string.
    return command, direction_or_item


def player_input():
    """Takes the players input and splits it, and returns the command and direction."""
    # Gets the players input, strips leading & trailing whitespace.
    # Then splits it into two parts (command, direction).
    player_move = input('Enter your move => ').strip().split(' ', 1)
    # Assigns the player command and converts it all to lower case for future comparison.
    command = player_move[0].lower()
    # Checks that there is a second value in player_move to assign to direction_or_item.
    # If there isn't, then assign an empty string.
    # Otherwise, assign the value and strip extra whitespace from between command and value.
    # Then converts it to title case for future comparison.
    direction_or_item = player_move[1].strip().title() if len(player_move) > 1 else ''
    # Return the command and direction_or_item values.
    return command, direction_or_item


def get_player_action():
    """Gets the players input, validates it, and returns the command and direction."""
    # Calls player_input function and assigns the return values to command and direction.
    command, direction_or_item = player_input()
    # Passes command and direction to parse_enum to convert string to matching enum.
    command, direction_or_item = parse_enum(command, direction_or_item)
    # Counter for number of times the player goes through the loop for invalid input.
    invalid_input_count = 0
    # Checks for a valid command or a valid direction.
    # If either is not valid, then it enters the loop.
    while command == -1 or (
            direction_or_item not in rooms[player[Key.LOCATION]].keys()
            and direction_or_item not in rooms[player[Key.LOCATION]][Key.ITEM].keys()
    ):
        # Check if valid command of exit or help was given, but an invalid second value was entered.
        if command in (Command.EXIT, Command.HELP):
            # Breaks out of the loop regardless of second value if the player wants to quit or help.
            break
        # If we get here, then we know the command isn't exit or help.
        # Checks that command is not a valid command.
        if command == -1:
            # At this point the command is not valid.
            # Inform the player that the command they entered is not valid.
            print('That is not a valid command!')
        # Check if it is a go action with an invalid direction.
        elif command == Command.GO and direction_or_item not in rooms[player[Key.LOCATION]].keys():
            # Inform the player that the direction they entered is not valid.
            print("You can't go that way.")
        # Check if it is a get action with an invalid item.
        elif command == Command.GET \
                and direction_or_item not in rooms[player[Key.LOCATION]][Key.ITEM].keys():
            # Inform the player that the item they entered is not valid.
            print('You cannot pick up that item.')
        # Display the players current status.
        display_status()
        # If the player enters too many invalid commands they are prompted to ask for help.
        if invalid_input_count >= 2:
            print("You seem to be lost. Don't forget, you can enter the command 'help' "
                  "to view how to play.")
        # Increments counter by one to keep track of invalid input attempts.
        invalid_input_count += 1
        # If the player enters valid input the loop will break when it checks the input.
        # Otherwise, the loop will continue.
        command, direction_or_item = player_input()
        command, direction_or_item = parse_enum(command, direction_or_item)
    # Return the validated command and direction.
    return command, direction_or_item


def move_player(move_direction):
    """Takes the players go direction and updates player to that location."""
    # The validated direction is passed into the function and used to update the player's location.
    # Use value of the players current location (player[Key.LOCATION]) as key for room dictionary.
    # Use the direction that was passed in as the key for the nested dictionary to get the new room.
    player[Key.LOCATION] = rooms[player[Key.LOCATION]][move_direction]


def get_item():
    """Takes the item from the current player location and adds it to their inventory."""
    # Use value of the players current location (player[Key.LOCATION]) as key for room dictionary.
    # Then append the value of item into the player inventory list.
    player[Key.INVENTORY].append(list(rooms[player[Key.LOCATION]][Key.ITEM].keys())[0])
    # Finally, remove the current item from the room.
    del rooms[player[Key.LOCATION]][Key.ITEM]
    rooms[player[Key.LOCATION]][Key.ITEM] = {'': ''}


def game_over():
    """Determines if the game ending conditions have been met."""
    # Checks if the list of required_items is a subset of the players inventory.
    # If it is, then it means they have collected all items needed to win.
    # Displays winning message and returns true to quit the game.
    if set(required_items).issubset(player[Key.INVENTORY]):
        slow_print(['\nCongrats! You collected all the required items and won the game!'])
        return True
    # Checks if the players current location contains the villain.
    # If it does, then it means they lose.
    # Displays losing message and returns true to quit the game.
    if list(rooms[player[Key.LOCATION]][Key.ITEM].keys())[0] is Item.VILLAIN:
        slow_print([f'\nOh no! You ran into the {Item.VILLAIN.value} and lost the game!'])
        return True
    # No game ending conditions were met, so return false to continue the game.
    return False


def exit_game():
    """Gets and validates players input and returns True to quit or False to continue."""
    # Gets the players input, strips leading & trailing whitespace, and converts it to lower case.
    quit_game_input = input('Are you sure you want to quit? (yes/no) => ').strip().lower()
    # Checks for a valid input of yes, no, y, or n.
    # If the input is not valid, then it enters the loop.
    while quit_game_input not in ('yes', 'y', 'no', 'n'):
        # Informs the user of their invalid input and prompts them to try again.
        # Strips input of trailing or leading whitespace and converses it to lower for comparison.
        quit_game_input = input('Invalid input! Enter yes or no => ').strip().lower()
    # At this point, input is valid as either yes or no.
    # Assigns True to quit_game if input is yes.
    # Assigns False to quit_game if input is no.
    quit_game = quit_game_input in ('yes', 'y')
    # Return quit_game.
    return quit_game


def main():
    """Main function with the loop, function calls and game flow logic."""
    # Calls display_into to show the introduction and how to play the game.
    display_intro()
    # Variable used to store current play start of the game.
    # False: keep playing True: exit game.
    quit_game = False
    while not quit_game:
        # Calls display_status() to show the players current location.
        display_status()
        # Checks if game winning conditions have been met.
        if game_over():
            break
        # Calls get_player_action() to get the players validated command and move.
        # Assigns the return values to player_command and player_direction.
        player_command, player_direction_or_item = get_player_action()
        # Checks if the players command is to exit the game.
        if player_command == Command.EXIT:
            # At this point, the player wants to quit.
            # Call exit_game() and set its return value to quit_game.
            # If exit_game() returns true, loop will end.
            # If exit_game() returns false, loop will continue.
            quit_game = exit_game()
        # Checks if the players command is for help.
        elif player_command == Command.HELP:
            # Calls instruction_help to display the instructions again.
            instruction_help()
        # At this point it means the player command is go.
        elif player_command == Command.GO:
            # Pass player_direction to move_player to update the player's location to a new room.
            move_player(player_direction_or_item)
        elif player_command == Command.GET:
            get_item()
    # After exiting the loop, display a line of dashes.
    # The display a goodbye message to the player.
    print('\n' + '-' * 46)
    print('Thanks for playing Space Adventure Text Game.')
    print('I hope you enjoyed it!!!')


# Calling the main function to start the program.
if __name__ == "__main__":
    main()

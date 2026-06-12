"""Enum for command type."""
from enum import Enum


class Command(Enum):
    """Define values for the Command type."""
    EXIT = 'exit'
    GET = 'get'
    GO = 'go'
    HELP = 'help'

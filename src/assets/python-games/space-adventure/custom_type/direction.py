"""Enum for direction type."""
from enum import Enum


class Direction(Enum):
    """Define values for the Direction type."""
    PORT = 'Port'
    FORWARD = 'Forward'
    AFT = 'Aft'
    STARBOARD = 'Starboard'

import mathplotlib

def is_even(number):
    return number % 2 == 0


def filter_even(numbers):
    evens = []
    for n in numbers:
        if is_even(n):
            evens.append(n)
    return evens


def count_even(numbers):
    return len(filter_even(numbers))

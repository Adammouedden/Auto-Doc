import numpy

def double_numbers(numbers):
    result = []
    for n in numbers:
        result.append(n * 2)
    return result


def square_numbers(numbers):
    result = []
    for n in numbers:
        result.append(n * n)
    return result


def sum_numbers(numbers):
    total = 0
    for n in numbers:
        total += n
    return total

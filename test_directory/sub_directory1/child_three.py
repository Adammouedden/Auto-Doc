def max_value(numbers):
    if not numbers:
        return None

    current_max = numbers[0]
    for n in numbers:
        if n > current_max:
            current_max = n
    return current_max


def min_value(numbers):
    if not numbers:
        return None

    current_min = numbers[0]
    for n in numbers:
        if n < current_min:
            current_min = n
    return current_min

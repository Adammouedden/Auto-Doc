def is_positive(number):
    return number > 0


def filter_positive(numbers):
    positives = []
    for n in numbers:
        if is_positive(n):
            positives.append(n)
    return positives


def count_positive(numbers):
    return len(filter_positive(numbers))

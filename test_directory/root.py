def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    if b == 0:
        return None
    return a / b


def calculate_all(a, b):
    return {
        "add": add(a, b),
        "subtract": subtract(a, b),
        "multiply": multiply(a, b),
        "divide": divide(a, b),
    }

# File Summaries

## `test_directory/root.py`
*Purpose*: This file defines basic arithmetic operations and a function to calculate all of them for a given pair of numbers.

*   `add(a, b)`: This function adds two numbers, `a` and `b`, and returns their sum.
*   `subtract(a, b)`: This function subtracts the second number, `b`, from the first number, `a`, and returns the difference.
*   `multiply(a, b)`: This function multiplies two numbers, `a` and `b`, and returns their product.
*   `divide(a, b)`: This function divides the first number, `a`, by the second number, `b`, using integer division, returning `None` if `b` is zero.
*   `calculate_all(a, b)`: This function performs all defined arithmetic operations (`add`, `subtract`, `multiply`, `divide`) on `a` and `b`, returning the results in a dictionary.

## `test_directory/sub_directory1/child_three.py`
*Purpose*: This file provides functions to find the maximum and minimum values within a list of numbers.

*   `max_value(numbers)`: This function iterates through a list of numbers to find and return the largest value. It handles empty lists by returning `None`.
*   `min_value(numbers)`: This function finds the smallest value in a given list of numbers. It returns `None` if the input list is empty.

## `test_directory/sub_directory1/sub_directory1_child/sub_directory1_child.py`
*Purpose*: This file contains utility functions for performing common mathematical operations on lists of numbers, such as doubling, squaring, or summing them.

*   `double_numbers(numbers)`: This function takes a list of numbers and returns a new list where each number from the input has been multiplied by two.
*   `square_numbers(numbers)`: This function accepts a list of numbers and returns a new list containing the square of each number from the original list.
*   `sum_numbers(numbers)`: This function calculates the total sum of all numbers provided in an input list by iterating through them and adding each to a running total.

## `test_directory/sub_directory1/sub_directory1_child2/child_one.py`
*Purpose*: This file provides utility functions for identifying, filtering, and counting even numbers within a collection.

*   `is_even(number)`: This function determines if a given number is even, returning `True` if it is divisible by 2, and `False` otherwise.
*   `filter_even(numbers)`: This function takes a list of numbers and returns a new list containing only the even numbers from the input, utilizing the `is_even` function for its logic.
*   `count_even(numbers)`: This function calculates and returns the total count of even numbers within a provided list by first filtering for even numbers and then returning the size of the filtered list.

## `test_directory/sub_directory1/sub_directory1_child2/child_two.py`
*Purpose*: This file contains utility functions focused on checking, filtering, and counting positive numbers from a given set of data.

*   `is_positive(number)`: This function checks whether a given number is positive, returning `True` if the number is greater than zero, otherwise `False`.
*   `filter_positive(numbers)`: This function processes a list of numbers and returns a new list containing only the positive numbers from the original list, relying on the `is_positive` function for filtering.
*   `count_positive(numbers)`: This function counts the total number of positive values present in a list by first filtering the input list to extract all positive numbers and then returning the count of those numbers.
# H. GCD-sequence

- **Time limit per test:** 2 seconds
- **Memory limit per test:** 256 megabytes

$GCD$ (Greatest Common Divisor) of two integers $x$ and $y$ is the maximum integer $z$ by which both $x$ and $y$ are divisible. For example, $GCD(36, 48) = 12$, $GCD(5, 10) = 5$, and $GCD(7, 11) = 1$.

Kristina has an array $a$ consisting of exactly $n$ positive integers. She wants to count the GCD of each neighbouring pair of numbers to get a new array $b$, called *GCD-sequence*.

So, the elements of the GCD-sequence $b$ will be calculated using the formula $b_i = GCD(a_i, a_{i+1})$ for $1 \le i \le n - 1$.

Determine whether it is possible to remove **exactly one** number from the array $a$ so that the GCD sequence $b$ is non-decreasing (i.e., $b_i \le b_{i+1}$ is always true).

For example, let Kristina had an array $a = [20, 6, 12, 3, 48, 36]$. If she removes $a_4 = 3$ from it and counts the GCD-sequence of $b$, she gets:
- $b_1 = GCD(20, 6) = 2$
- $b_2 = GCD(6, 12) = 6$
- $b_3 = GCD(12, 48) = 12$
- $b_4 = GCD(48, 36) = 12$

The resulting GCD sequence $b = [2, 6, 12, 12]$ is non-decreasing because $b_1 \le b_2 \le b_3 \le b_4$.

### Input
The first line of input data contains a single number $t$ ($1 \le t \le 10^4$) — the number of test cases in the test.

This is followed by the descriptions of the test cases.

The first line of each test case contains a single integer $n$ ($3 \le n \le 2 \times 10^5$) — the number of elements in the array $a$.

The second line of each test case contains exactly $n$ integers $a_i$ ($1 \le a_i \le 10^9$) — the elements of array $a$.

It is guaranteed that the sum of $n$ over all test cases does not exceed $2 \times 10^5$.

### Output
For each test case, output a single line:
- `"YES"` if you can remove **exactly one** number from the array $a$ so that the GCD-sequence of $b$ is non-decreasing;
- `"NO"` otherwise.

You can output the answer in any case (for example, the strings `"yEs"`, `"yes"`, `"Yes"`, and `"YES"` will all be recognized as a positive answer).

### Example
| input | output |
| :--- | :--- |
| 12<br>6<br>20 6 12 3 48 36<br>4<br>12 6 3 4<br>3<br>10 12 3<br>5<br>32 16 8 4 2<br>5<br>100 50 2 10 20<br>4<br>2 4 8 1<br>10<br>7 4 6 2 4 5 1 4 2 8<br>7<br>5 9 6 8 5 9 2<br>6<br>11 14 8 12 9 3<br>9<br>5 7 3 10 6 3 12 6 3<br>3<br>4 2 4<br>8<br>1 6 11 12 6 12 3 6 | YES<br>NO<br>YES<br>NO<br>YES<br>YES<br>NO<br>YES<br>YES<br>YES<br>YES<br>YES |

### Note
The first test case is explained in the problem statement.

# E. SWORD (OLP MT&TN 2023 Sơ Loại Không Chuyên)

- **Time limit per test:** 1 second
- **Memory limit per test:** 256 megabytes

Robin đang chơi một trò chơi hành động thế giới mở nổi tiếng vừa ra mắt gần đây. Trò chơi có rất nhiều con quỷ, mỗi con quỷ đều có điểm sức mạnh và điểm thưởng khi bị tiêu diệt. Tuy nhiên, cậu chỉ cần tiêu diệt $n$ con quỷ quan trọng (boss) để có thể hoàn thành trò chơi. Ban đầu Robin có $S$ điểm sức mạnh, **điểm sức mạnh** cho biết cậu có thể tiêu diệt những con quỷ có điểm sức mạnh nhỏ hơn mình. Khi gặp một con quỷ có thể tiêu diệt và có điểm thưởng $g$, điểm sức mạnh của cậu được tăng lên $g$ đơn vị.

Do Robin là một người chỉ thích đánh boss và không muốn mất thời gian với những con quỷ không quan trọng, bạn hãy giúp Robin xác định xem cậu có thể tiêu diệt **tối đa** bao nhiêu con boss? Biết rằng, đây là một trò chơi thế giới mở và Robin có thể chọn boss để đánh tùy theo ý của cậu.

### Input
- Dòng đầu tiên chứa hai số nguyên $n$ và $S$ ($1 \le n \le 10^5$, $1 \le S \le 10^9$) lần lượt là số lượng boss trong game và số điểm sức mạnh ban đầu của Robin.
- Trong $n$ dòng tiếp theo, dòng thứ $i$ chứa hai số nguyên $p_i$ và $g_i$ ($1 \le p_i, g_i \le 10^9$) lần lượt là điểm sức mạnh và điểm thưởng của con boss thứ $i$.

### Output
- In ra một số nguyên duy nhất là số lượng con boss tối đa mà Robin có thể tiêu diệt nếu bỏ qua các con quỷ phụ.

### Scoring
- Subtask 1 ($20\%$ số điểm): $n \le 10$.
- Subtask 2 ($30\%$ số điểm): $n \le 10^3$.
- Subtask 3 ($50\%$ số điểm): Không có ràng buộc gì thêm.

### Example
| input | output |
| :--- | :--- |
| 5 2<br>6 1<br>7 3<br>4 2<br>10 5<br>12 4 | 0 |
| 5 3<br>10 7<br>5 3<br>14 10<br>1 2<br>2 1 | 3 |

### Note
- Trong ví dụ đầu tiên, có 5 con boss và Robin có 2 điểm sức mạnh.
  - Do không có con boss nào có điểm sức mạnh nhỏ hơn điểm sức mạnh ban đầu của Robin nên cậu không thể tiêu diệt được con boss nào.
- Trong ví dụ tiếp theo, có 4 con boss và Robin có 3 điểm sức mạnh.
  - Robin có thể tiêu diệt các con boss như sau: đầu tiên, cậu diệt con boss có điểm sức mạnh là 2 và được tăng thêm 1 điểm sức mạnh.
  - Lúc này, Robin có 4 điểm sức mạnh, cậu đi diệt con boss có điểm sức mạnh là 1 và được tăng thêm 2 điểm sức mạnh.
  - Lúc này, Robin có 6 điểm sức mạnh, cậu đi diệt con boss có điểm sức mạnh là 5 và được tăng thêm 3 điểm sức mạnh.
  - Đến đây, điểm sức mạnh của Robin là 9 và cậu không còn con boss nào có điểm sức mạnh nhỏ hơn để tiêu diệt nữa. Như vậy, đáp án cho ví dụ này là 3.

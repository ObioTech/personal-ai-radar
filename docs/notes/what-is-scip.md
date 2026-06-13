# SCIP là gì?

**SCIP** — *Source Code Intelligence Protocol* — là một định dạng **semantic index** cho source code. Nó thường được lưu dưới dạng file `index.scip`, dùng để mô tả các thông tin như: symbol nào được định nghĩa ở đâu, được reference ở đâu, file nào chứa symbol nào, hover/documentation của symbol, và các quan hệ semantic cơ bản trong codebase.

Có thể hiểu đơn giản:

```text
Source code
  → language-specific indexer
  → index.scip
  → definition/reference/code navigation/AI retrieval
```

SCIP giúp biến source code từ các file text rời rạc thành một lớp dữ liệu semantic có thể query được. Nhờ đó, các công cụ có thể hỗ trợ tốt hơn cho những tính năng như **Go to Definition**, **Find References**, **Hover**, **Symbol Search**, **Code Navigation**, hoặc **Impact Analysis**.

## LSIF là gì?

**LSIF** — *Language Server Index Format* — là một định dạng index source code ra đời trước SCIP. LSIF được thiết kế để lưu lại dữ liệu code intelligence từ Language Server Protocol, giúp các hệ thống có thể cung cấp tính năng code navigation mà không cần chạy language server realtime mỗi lần người dùng truy vấn.

Có thể hiểu đơn giản:

```text
Language Server / Indexer
  → LSIF dump
  → code navigation trên server/web/CI
```

LSIF thường biểu diễn dữ liệu dưới dạng một **graph JSON line-based**. Trong graph này có các node và edge mô tả file, range, symbol, definition, reference, hover, result set…

LSIF giải quyết một bài toán rất quan trọng: đưa trải nghiệm như IDE — ví dụ jump to definition hoặc find references — lên môi trường web, CI, hoặc các hệ thống code search lớn.

Tuy nhiên, LSIF có một số điểm bất tiện:

* Format graph khá phức tạp.
* Dễ khó debug khi index lớn.
* Dữ liệu JSON line có thể lớn.
* Việc viết indexer mới không đơn giản.
* Schema động hơn, dễ gặp lỗi runtime hơn so với schema typed rõ ràng.

## SCIP khác gì LSIF?

SCIP có thể xem là thế hệ format semantic code index mới hơn, được thiết kế để đơn giản hóa nhiều vấn đề của LSIF.

| Tiêu chí        | LSIF                             | SCIP                                      |
| --------------- | -------------------------------- | ----------------------------------------- |
| Tên đầy đủ      | Language Server Index Format     | Source Code Intelligence Protocol         |
| Mục tiêu        | Persist code intelligence từ LSP | Semantic code intelligence format mới hơn |
| Encoding        | JSON lines                       | Protobuf                                  |
| Mô hình dữ liệu | Graph node/edge phức tạp         | Index → Document → Occurrence/Symbol      |
| Độ dễ hiểu      | Khó hơn                          | Dễ hơn                                    |
| Kích thước      | Thường lớn hơn                   | Thường nhỏ gọn hơn                        |
| Viết indexer    | Khó hơn                          | Dễ hơn                                    |
| Type safety     | Thấp hơn                         | Tốt hơn nhờ Protobuf schema               |
| Trạng thái      | Format cũ hơn                    | Hướng thay thế hiện đại hơn               |

Điểm khác biệt lớn nhất là:

```text
LSIF mô hình hóa code intelligence như một graph phức tạp.
SCIP mô hình hóa code intelligence gần hơn với cấu trúc source code thực tế.
```

Với SCIP, dữ liệu thường xoay quanh:

```text
Index
  └─ Document[]
      ├─ occurrences[]
      └─ symbols[]
```

Cách tổ chức này dễ đọc, dễ import vào database, và dễ dùng hơn cho các hệ thống code search hoặc AI retrieval.

## Các khái niệm chính trong SCIP

SCIP có vài thành phần quan trọng:

* **Index**: root object của toàn bộ semantic index.
* **Document**: đại diện cho một file source code.
* **Occurrence**: một lần xuất hiện của symbol trong code, ví dụ definition, reference, import.
* **Symbol**: định danh semantic của một function, class, method, variable, module…
* **SymbolInformation**: metadata của symbol như display name, kind, documentation.

Ví dụ thay vì chỉ biết text `findById`, SCIP cố gắng biết chính xác đó là method nào, thuộc class/module nào, nằm ở file nào.

Ví dụ:

```text
Text: findById
Semantic symbol: UserService#findById().
File: src/user/UserService.ts
Role: definition / reference
```

Điều này giúp công cụ không bị nhầm giữa nhiều function trùng tên trong các class/module khác nhau.

## SCIP dùng để làm gì?

SCIP hữu ích cho các tính năng:

* Go to definition
* Find references
* Hover/documentation
* Symbol search
* Code navigation trên web/CI/offline
* Impact analysis
* Hỗ trợ AI agent hiểu codebase chính xác hơn

Ví dụ khi hỏi:

```text
Hàm getStatus được định nghĩa ở đâu?
```

SCIP có thể giúp tìm đúng definition của symbol đó.

Hoặc khi hỏi:

```text
Nếu đổi RuntimeStatusService.getStatus() thì ảnh hưởng những đâu?
```

SCIP có thể giúp tìm:

```text
definition → references → related files → source chunks → reasoning
```

## Vì sao semantic index quan trọng?

Source code không chỉ là text.

Nếu chỉ dùng grep hoặc search text thông thường, ta có thể tìm được các chuỗi giống nhau, nhưng khó biết chính xác:

* Đây là definition hay reference?
* Hai symbol trùng tên có phải cùng một function không?
* Function này thuộc class/module nào?
* Symbol này được import từ đâu?
* Những file nào thật sự đang phụ thuộc vào symbol này?

Semantic index giúp bổ sung lớp thông tin mà text search không có.

Ví dụ trong codebase có nhiều hàm cùng tên:

```text
UserService.findById()
OrderService.findById()
ProductRepository.findById()
```

Text search với `findById` có thể trả về tất cả. Nhưng semantic index có thể phân biệt từng symbol cụ thể.

## SCIP có thay thế AST, grep, embedding không?

Không.

SCIP không nên được hiểu là công cụ thay thế toàn bộ các kỹ thuật phân tích code khác. Nó là một lớp **semantic code index**.

Có thể hiểu vai trò tương đối như sau:

```text
grep/text search: tìm nhanh theo chuỗi
AST/tree-sitter: hiểu cấu trúc cú pháp
SCIP: hiểu definition/reference/symbol semantic
Embedding/vector search: tìm theo ý nghĩa gần đúng
LLM: reasoning, tổng hợp, giải thích
```

SCIP mạnh khi cần trả lời các câu hỏi liên quan tới symbol:

```text
Symbol này định nghĩa ở đâu?
Symbol này được dùng ở đâu?
File nào reference tới method này?
Có những symbol nào trong file này?
```

Nhưng SCIP không tự hiểu toàn bộ logic nghiệp vụ.

Ví dụ SCIP có thể biết `OrderService` gọi `PaymentService`, nhưng không tự kết luận đầy đủ rằng:

```text
OrderService validate payment trước khi tạo invoice.
```

Những quan hệ nghiệp vụ như vậy vẫn cần static analysis riêng, AST analysis, hoặc LLM reasoning bổ sung.

## Điểm mạnh của SCIP

SCIP mạnh ở các điểm:

* Chính xác hơn grep/tree-sitter thuần khi cần definition/reference.
* Portable, có thể generate một lần rồi query nhiều lần.
* Phù hợp với CI/offline indexing.
* Hỗ trợ nhiều ngôn ngữ thông qua các indexer riêng.
* Dữ liệu có schema rõ ràng nhờ Protobuf.
* Dễ import vào database hơn so với LSIF graph phức tạp.
* Hữu ích cho code search, code navigation, impact analysis và AI coding agent.

## Điểm cần cẩn trọng

Không nên thần thánh hóa SCIP.

SCIP chỉ là **format index**, chất lượng phụ thuộc vào indexer của từng ngôn ngữ. Nếu indexer tốt, dữ liệu SCIP tốt. Nếu indexer thiếu chính xác hoặc thiếu tính năng, SCIP cũng bị giới hạn theo.

Một vài điểm cần lưu ý:

* Không phải ngôn ngữ nào cũng có indexer chất lượng ngang nhau.
* Không thay thế hoàn toàn AST analysis.
* Không thay thế dependency graph đầy đủ.
* Không tự hiểu business logic.
* Cross-repo navigation có thể phức tạp hơn single-repo.
* Với monorepo lớn, file index có thể lớn và cần pipeline import tối ưu.

## Tóm tắt ngắn gọn

**LSIF** là format cũ hơn để lưu code intelligence dưới dạng graph JSON line-based.

**SCIP** là format mới hơn, dùng Protobuf, có cấu trúc đơn giản và rõ ràng hơn, thường phù hợp hơn cho việc xây dựng code navigation, semantic search, impact analysis và AI-assisted code understanding.

Có thể ghi nhớ nhanh:

```text
LSIF = code intelligence graph format đời trước.
SCIP = semantic code index format hiện đại hơn, gọn hơn, dễ dùng hơn.
```

SCIP không biến AI thành người hiểu toàn bộ codebase ngay lập tức, nhưng nó cung cấp một lớp dữ liệu semantic rất quan trọng để công cụ và AI agent tìm đúng definition, reference, symbol và context liên quan.

---

# Ghi chú áp dụng cho AIWI

Trong AIWI, SCIP phù hợp với tầng **RAG2 semantic code intelligence**.

Một cách phân tầng hợp lý:

```text
RAG1: Docs, Markdown, ADR, PRD
RAG2: Source code semantic index
      - SCIP symbols
      - definitions
      - references
      - occurrences
      - import/reference edges
RAG3: Runtime state, tasks, sessions, memories
```

SCIP giúp AIWI không chỉ tìm code bằng text, mà còn hiểu được quan hệ semantic giữa các symbol.

## Vai trò của SCIP trong AIWI

Với AI/RAG codebase, SCIP không thay thế embedding hay grep, mà đóng vai trò **precision layer**.

Một pipeline hợp lý:

```text
User query
  → keyword/vector search tìm candidate files/symbols
  → SCIP resolve exact symbol
  → SCIP expand definitions/references
  → đọc source chunks liên quan
  → LLM reasoning
```

Ví dụ khi user hỏi:

```text
Nếu đổi RuntimeStatusService.getStatus() thì ảnh hưởng những đâu?
```

AIWI có thể dùng SCIP để tìm:

```text
definition → references → related files → source chunks → LLM reasoning
```

## Hướng triển khai thực dụng cho AIWI

Một lộ trình hợp lý:

```text
Phase 1: Import index.scip
Phase 2: Normalize symbols/occurrences vào SQLite
Phase 3: Cung cấp ScipProvider với definition/reference queries
Phase 4: Tích hợp vào RAG retrieval
Phase 5: Dùng cho impact analysis
Phase 6: Mở rộng cross-repo/package-aware navigation
```

Milestone đầu nên chỉ tập trung vào việc đọc và import `index.scip`, chưa cần tự chạy `scip-typescript` hay đóng gói thành public command.

Command nội bộ có thể là:

```bash
npm run rag2:scip:import -- --experimental --index <index.scip>
```

## Kết luận cho AIWI

Với AIWI, giá trị lớn nhất của SCIP là:

```text
Giúp AI agent tìm definition/reference chính xác, mở rộng context đúng chỗ, và phân tích impact đáng tin cậy hơn.
```

Nên xem SCIP như một lớp bổ sung cho RAG code, không phải replacement cho toàn bộ search, AST analysis hay reasoning của LLM.

# Coding Style — COBOL

Extends `rules/common/coding-style.md`. COBOL-specific rules take precedence.

## Dialects Covered

These rules apply to modern COBOL: IBM Enterprise COBOL (z/OS), GnuCOBOL, and Micro Focus Visual COBOL. Note dialect differences where they exist.

## Format

- Use **free format** when the dialect supports it (IBM Enterprise COBOL 6.1+, GnuCOBOL) — avoids the rigid 72-column constraint of fixed format
- Fixed format (legacy): code starts in column 8, ends in column 72; indicator area in column 7
- Indentation: 4 spaces per level in free format; follow column rules in fixed format
- One statement per line — never chain multiple statements on one line

## Division Structure

Every program follows this order — do not reorder divisions:

```cobol
IDENTIFICATION DIVISION.
   PROGRAM-ID. ProgramName.
   AUTHOR. Team Name.
   DATE-WRITTEN. YYYY-MM-DD.

ENVIRONMENT DIVISION.
   CONFIGURATION SECTION.
   INPUT-OUTPUT SECTION.
      FILE-CONTROL.

DATA DIVISION.
   FILE SECTION.
   WORKING-STORAGE SECTION.
   LOCAL-STORAGE SECTION.
   LINKAGE SECTION.

PROCEDURE DIVISION.
```

## Naming

- Program names: `PascalCase` or `UPPER-KEBAB-CASE` — `ProcessPayment` or `PROCESS-PAYMENT`
- Paragraphs and sections: `UPPER-KEBAB-CASE` — `VALIDATE-INPUT`, `PROCESS-RECORD`
- Data items: `UPPER-KEBAB-CASE` — `WS-CUSTOMER-ID`, `LS-RETURN-CODE`
- Prefix conventions:
  - `WS-` for WORKING-STORAGE items
  - `LS-` for LINKAGE SECTION items
  - `FD-` for FILE SECTION items
  - `88-` for condition names (level 88)
  - `IN-` / `OUT-` for copybook fields

## Data Definitions

Use level numbers consistently and define condition names with level 88:

```cobol
WORKING-STORAGE SECTION.
01  WS-CUSTOMER-RECORD.
    05  WS-CUST-ID             PIC 9(10).
    05  WS-CUST-STATUS         PIC X(1).
        88  CUST-ACTIVE        VALUE 'A'.
        88  CUST-SUSPENDED     VALUE 'S'.
        88  CUST-CLOSED        VALUE 'C'.
    05  WS-CUST-BALANCE        PIC S9(11)V99 COMP-3.

01  WS-RETURN-CODE             PIC S9(4) COMP.
    88  RC-SUCCESS             VALUE 0.
    88  RC-NOT-FOUND           VALUE 4.
    88  RC-ERROR               VALUE 8 THRU 99.
```

## Paragraphs

- One responsibility per paragraph — name it after what it does
- Keep paragraphs under 30 lines — extract to sub-paragraphs if longer
- Use `PERFORM` with named paragraphs instead of inline code blocks for reusable logic

```cobol
PROCEDURE DIVISION.
    PERFORM INITIALIZE-PROGRAM
    PERFORM PROCESS-ALL-RECORDS
    PERFORM FINALIZE-PROGRAM
    STOP RUN.

INITIALIZE-PROGRAM.
    MOVE SPACES TO WS-ERROR-MESSAGE
    MOVE ZEROS  TO WS-RECORD-COUNT
    OPEN INPUT  CUSTOMER-FILE
    OPEN OUTPUT REPORT-FILE.

PROCESS-ALL-RECORDS.
    PERFORM UNTIL EOF-CUSTOMER-FILE
        READ CUSTOMER-FILE
            AT END MOVE 'Y' TO WS-EOF-FLAG
            NOT AT END PERFORM PROCESS-ONE-RECORD
        END-READ
    END-PERFORM.
```

## Arithmetic

Use `COMPUTE` for complex arithmetic — avoid `ADD`, `SUBTRACT`, `MULTIPLY`, `DIVIDE` for multi-step calculations:

```cobol
*> ✓ COMPUTE — readable for complex expressions
COMPUTE WS-TOTAL-AMOUNT = WS-QUANTITY * WS-UNIT-PRICE
                        * (1 - WS-DISCOUNT-RATE / 100)

*> ✓ Simple operations — ADD/SUBTRACT acceptable
ADD 1 TO WS-RECORD-COUNT
SUBTRACT WS-WITHDRAWAL FROM WS-BALANCE
```

## Comments

COBOL comments use `*>` (free format) or `*` in column 7 (fixed format):

```cobol
*> This paragraph validates the transaction amount
*> and applies business rules from rule 4.2.1
VALIDATE-TRANSACTION-AMOUNT.
    IF WS-AMOUNT <= ZERO
        MOVE 'Amount must be positive' TO WS-ERROR-MESSAGE
        PERFORM LOG-VALIDATION-ERROR
    END-IF.
```

## Copybooks

Use copybooks for shared data structures — never duplicate record layouts:

```cobol
*> ✓ Shared structure in a copybook
COPY CUSTOMER-RECORD.

*> ✗ Never redefine the same layout in multiple programs
01  WS-CUSTOMER.
    05  WS-ID   PIC 9(10).
    05  WS-NAME PIC X(50).
```

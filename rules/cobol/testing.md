# Testing — COBOL

Extends `rules/common/testing.md`. COBOL-specific rules take precedence.

## Frameworks

- **COBOL Check** — open-source unit testing for COBOL (GnuCOBOL and IBM)
- **zUnit** — IBM Rational Developer for z/OS integrated testing
- **CBL_GC_JUNIT** — JUnit XML output for CI integration with GnuCOBOL
- **Manual driver programs** — COBOL test harnesses calling subprograms via CALL

## COBOL Check — Unit Test Structure

COBOL Check injects test code into the PROCEDURE DIVISION before compilation:

```cobol
*> tests/ValidatePayment.cut

TestSuite 'Validate Payment'

TestCase 'Should fail when amount is zero'
    Move 0          To LS-AMOUNT
    Move 1234567890 To LS-ACCOUNT-ID
    Call 'ValidatePayment' Using LS-PAYMENT-RECORD LS-RETURN-CODE
    Expect LS-RETURN-CODE To Equal 8

TestCase 'Should succeed with valid payment'
    Move 100.50     To LS-AMOUNT
    Move 1234567890 To LS-ACCOUNT-ID
    Call 'ValidatePayment' Using LS-PAYMENT-RECORD LS-RETURN-CODE
    Expect LS-RETURN-CODE To Equal 0

TestCase 'Should fail when account id is zero'
    Move 500.00     To LS-AMOUNT
    Move 0          To LS-ACCOUNT-ID
    Call 'ValidatePayment' Using LS-PAYMENT-RECORD LS-RETURN-CODE
    Expect LS-RETURN-CODE To Equal 8
```

## Driver Program Pattern (manual harness)

When a unit testing framework is not available, write a COBOL driver program:

```cobol
IDENTIFICATION DIVISION.
   PROGRAM-ID. TestValidatePayment.

DATA DIVISION.
   WORKING-STORAGE SECTION.
   01  WS-TEST-NAME         PIC X(60).
   01  WS-TESTS-RUN         PIC 9(4) VALUE ZERO.
   01  WS-TESTS-PASSED      PIC 9(4) VALUE ZERO.
   01  WS-TESTS-FAILED      PIC 9(4) VALUE ZERO.
   01  WS-EXPECTED          PIC S9(4) COMP.
   01  WS-ACTUAL            PIC S9(4) COMP.

   *> Linkage data for the program under test
   01  WS-PAYMENT-RECORD.
       05  WS-AMOUNT        PIC S9(11)V99 COMP-3.
       05  WS-ACCOUNT-ID    PIC 9(10).
   01  WS-RETURN-CODE       PIC S9(4) COMP.

PROCEDURE DIVISION.
    PERFORM TEST-AMOUNT-ZERO
    PERFORM TEST-VALID-PAYMENT
    PERFORM TEST-ACCOUNT-ID-ZERO
    PERFORM PRINT-SUMMARY
    MOVE WS-TESTS-FAILED TO RETURN-CODE
    STOP RUN.

TEST-AMOUNT-ZERO.
    MOVE 'Should fail when amount is zero' TO WS-TEST-NAME
    MOVE ZERO        TO WS-AMOUNT
    MOVE 1234567890  TO WS-ACCOUNT-ID
    CALL 'ValidatePayment' USING WS-PAYMENT-RECORD WS-RETURN-CODE
    MOVE 8 TO WS-EXPECTED
    PERFORM ASSERT-EQUAL.

TEST-VALID-PAYMENT.
    MOVE 'Should succeed with valid payment' TO WS-TEST-NAME
    MOVE 100.50      TO WS-AMOUNT
    MOVE 1234567890  TO WS-ACCOUNT-ID
    CALL 'ValidatePayment' USING WS-PAYMENT-RECORD WS-RETURN-CODE
    MOVE 0 TO WS-EXPECTED
    PERFORM ASSERT-EQUAL.

ASSERT-EQUAL.
    ADD 1 TO WS-TESTS-RUN
    MOVE WS-RETURN-CODE TO WS-ACTUAL
    IF WS-ACTUAL = WS-EXPECTED
        ADD 1 TO WS-TESTS-PASSED
        DISPLAY 'PASS: ' WS-TEST-NAME
    ELSE
        ADD 1 TO WS-TESTS-FAILED
        DISPLAY 'FAIL: ' WS-TEST-NAME
        DISPLAY '  Expected: ' WS-EXPECTED ' Got: ' WS-ACTUAL
    END-IF.

PRINT-SUMMARY.
    DISPLAY '=========================='
    DISPLAY 'Tests run:    ' WS-TESTS-RUN
    DISPLAY 'Tests passed: ' WS-TESTS-PASSED
    DISPLAY 'Tests failed: ' WS-TESTS-FAILED
    DISPLAY '=========================='.
```

## Test Data Files

For batch programs, prepare fixed test input files covering:

```
*> test-data/payments-valid.dat    — normal records, all should process
*> test-data/payments-zero-amt.dat — zero amount records, should be rejected
*> test-data/payments-empty.dat    — empty file, zero records processed
*> test-data/payments-mixed.dat    — mix of valid and invalid
```

Verify `RETURN-CODE` and record counts in the JCL or shell script that runs the test.

## CI Integration (GnuCOBOL)

```bash
#!/usr/bin/env bash
# run-tests.sh

set -euo pipefail

echo "Compiling programs..."
cobc -x -o bin/ValidatePayment    src/ValidatePayment.cbl
cobc -x -o bin/TestValidatePayment src/TestValidatePayment.cbl

echo "Running tests..."
./bin/TestValidatePayment
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "All tests passed"
else
  echo "Tests failed: $EXIT_CODE failure(s)"
  exit 1
fi
```

## What to Test

| Category | Example |
|---|---|
| Valid input | Normal record with all required fields populated |
| Zero / low boundary | Amount = 0, ID = 0 |
| Maximum boundary | Amount at PIC maximum, string at full length |
| Missing required field | Blank account ID, spaces in required field |
| DB2 SQLCODE paths | SQLCODE 0, 100 (not found), negative (error) |
| Return code paths | Each distinct RETURN-CODE value the program can produce |
| End of file | Empty input file produces 0 records processed |

## Do Not

- Do not test JCL steps in unit tests — test the COBOL program logic only
- Do not skip boundary tests — COBOL PIC clauses truncate silently on overflow
- Do not reuse test data files between test cases — each test case needs predictable, isolated input

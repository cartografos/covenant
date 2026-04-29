# Patterns — COBOL

Common structural patterns for COBOL programs (batch, online, and service-oriented).

## Batch Processing Pattern

The dominant pattern in COBOL — read an input file, process each record, write output:

```cobol
IDENTIFICATION DIVISION.
   PROGRAM-ID. ProcessPayments.

DATA DIVISION.
   FILE SECTION.
   FD  PAYMENT-FILE.
   01  FD-PAYMENT-RECORD        PIC X(200).

   FD  REPORT-FILE.
   01  FD-REPORT-LINE           PIC X(132).

   WORKING-STORAGE SECTION.
   01  WS-FLAGS.
       05  WS-EOF-FLAG          PIC X(1) VALUE 'N'.
           88  EOF-PAYMENT-FILE VALUE 'Y'.
   01  WS-COUNTERS.
       05  WS-RECORDS-READ      PIC 9(9) VALUE ZERO.
       05  WS-RECORDS-OK        PIC 9(9) VALUE ZERO.
       05  WS-RECORDS-FAILED    PIC 9(9) VALUE ZERO.
   01  WS-RETURN-CODE           PIC S9(4) COMP VALUE ZERO.
       88  RC-SUCCESS           VALUE 0.

PROCEDURE DIVISION.
    PERFORM OPEN-FILES
    PERFORM PROCESS-ALL-RECORDS
    PERFORM WRITE-SUMMARY
    PERFORM CLOSE-FILES
    MOVE WS-RETURN-CODE TO RETURN-CODE
    STOP RUN.

OPEN-FILES.
    OPEN INPUT  PAYMENT-FILE
    OPEN OUTPUT REPORT-FILE.

PROCESS-ALL-RECORDS.
    PERFORM UNTIL EOF-PAYMENT-FILE
        READ PAYMENT-FILE
            AT END     SET EOF-PAYMENT-FILE TO TRUE
            NOT AT END PERFORM PROCESS-ONE-RECORD
        END-READ
    END-PERFORM.

PROCESS-ONE-RECORD.
    ADD 1 TO WS-RECORDS-READ
    PERFORM VALIDATE-RECORD
    IF RC-SUCCESS
        PERFORM APPLY-PAYMENT
        ADD 1 TO WS-RECORDS-OK
    ELSE
        PERFORM LOG-FAILED-RECORD
        ADD 1 TO WS-RECORDS-FAILED
    END-IF.
```

## Modular Design with CALL

Break large programs into called subprograms — each subprogram owns one responsibility:

```cobol
*> Caller
CALL 'ValidatePayment'  USING  BY REFERENCE WS-PAYMENT-RECORD
                               BY REFERENCE WS-RETURN-CODE
END-CALL
IF WS-RETURN-CODE NOT = ZERO
    PERFORM HANDLE-VALIDATION-ERROR
END-IF.

*> Subprogram: ValidatePayment.cbl
IDENTIFICATION DIVISION.
   PROGRAM-ID. ValidatePayment.

DATA DIVISION.
   LINKAGE SECTION.
   01  LS-PAYMENT-RECORD.
       05  LS-AMOUNT        PIC S9(11)V99 COMP-3.
       05  LS-ACCOUNT-ID    PIC 9(10).
   01  LS-RETURN-CODE       PIC S9(4) COMP.

PROCEDURE DIVISION USING LS-PAYMENT-RECORD LS-RETURN-CODE.
    MOVE 0 TO LS-RETURN-CODE
    IF LS-AMOUNT <= ZERO
        MOVE 8 TO LS-RETURN-CODE
    END-IF
    IF LS-ACCOUNT-ID = ZEROS
        MOVE 8 TO LS-RETURN-CODE
    END-IF
    GOBACK.
```

## DB2 Embedded SQL Pattern

```cobol
WORKING-STORAGE SECTION.
   EXEC SQL INCLUDE SQLCA END-EXEC.

   01  WS-CUSTOMER-ID     PIC 9(10).
   01  WS-CUSTOMER-NAME   PIC X(50).

PROCEDURE DIVISION.
    MOVE 1234567890 TO WS-CUSTOMER-ID

    EXEC SQL
        SELECT CUST_NAME
        INTO   :WS-CUSTOMER-NAME
        FROM   CUSTOMER
        WHERE  CUST_ID = :WS-CUSTOMER-ID
    END-EXEC

    EVALUATE SQLCODE
        WHEN 0
            PERFORM PROCESS-CUSTOMER
        WHEN 100
            PERFORM HANDLE-NOT-FOUND
        WHEN OTHER
            MOVE SQLCODE TO WS-ERROR-CODE
            PERFORM HANDLE-DB-ERROR
    END-EVALUATE.
```

## Error Handling with RETURN-CODE

Communicate success/failure to the job control layer via `RETURN-CODE`:

```cobol
*> Convention:
*> 0   = success
*> 4   = warning (processed with skips)
*> 8   = error (partial failure)
*> 12  = severe error (no output produced)
*> 16  = catastrophic (abend-level)

FINALIZE-PROGRAM.
    EVALUATE TRUE
        WHEN WS-RECORDS-FAILED > 0 AND WS-RECORDS-OK > 0
            MOVE 4  TO RETURN-CODE   *> partial success
        WHEN WS-RECORDS-FAILED > 0 AND WS-RECORDS-OK = 0
            MOVE 8  TO RETURN-CODE   *> all failed
        WHEN OTHER
            MOVE 0  TO RETURN-CODE   *> all good
    END-EVALUATE.
```

## Copybook Versioning

```cobol
*> CUSTREC.cpy — shared customer record layout
*> Version: 3.2  Date: 2024-01-15
*> Change: Added WS-CUST-TIER field
01  CUSTOMER-RECORD.
    05  CUST-ID              PIC 9(10).
    05  CUST-NAME            PIC X(50).
    05  CUST-EMAIL           PIC X(100).
    05  CUST-STATUS          PIC X(1).
        88  CUST-ACTIVE      VALUE 'A'.
        88  CUST-INACTIVE    VALUE 'I'.
    05  CUST-TIER            PIC X(1).   *> Added v3.2
        88  TIER-STANDARD    VALUE 'S'.
        88  TIER-PREMIUM     VALUE 'P'.
    05  FILLER               PIC X(38).  *> Reserved for future use
```

## CICS Online Transaction Pattern (IBM z/OS)

```cobol
IDENTIFICATION DIVISION.
   PROGRAM-ID. GetCustomer.

DATA DIVISION.
   WORKING-STORAGE SECTION.
   01  WS-CUSTOMER-ID       PIC 9(10).
   01  WS-RESPONSE-CODE     PIC S9(8) COMP.
   COPY CUSTREC.

PROCEDURE DIVISION.
    EXEC CICS RECEIVE
        INTO   (WS-CUSTOMER-ID)
        LENGTH (10)
        RESP   (WS-RESPONSE-CODE)
    END-EXEC

    IF WS-RESPONSE-CODE NOT = DFHRESP(NORMAL)
        EXEC CICS ABEND ABCODE('RECV') END-EXEC
    END-IF

    EXEC CICS READ
        FILE    ('CUSTFILE')
        INTO    (CUSTOMER-RECORD)
        RIDFLD  (WS-CUSTOMER-ID)
        RESP    (WS-RESPONSE-CODE)
    END-EXEC

    EVALUATE WS-RESPONSE-CODE
        WHEN DFHRESP(NORMAL)   PERFORM SEND-CUSTOMER-RESPONSE
        WHEN DFHRESP(NOTFND)   PERFORM SEND-NOT-FOUND-RESPONSE
        WHEN OTHER             PERFORM SEND-ERROR-RESPONSE
    END-EVALUATE

    EXEC CICS RETURN END-EXEC.
```

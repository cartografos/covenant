# Security — COBOL

Extends `rules/common/security.md`. COBOL-specific rules take precedence.

## SQL Injection (DB2 Embedded SQL)

Never concatenate user input into SQL strings. Always use host variables:

```cobol
*> ✓ Host variables — parameterized
EXEC SQL
    SELECT CUST_NAME, CUST_BALANCE
    INTO   :WS-CUST-NAME, :WS-CUST-BALANCE
    FROM   CUSTOMER
    WHERE  CUST_ID = :WS-CUST-ID
END-EXEC

*> ✗ Never — dynamic SQL with user input
MOVE 'SELECT * FROM CUSTOMER WHERE ID = ' TO WS-SQL-TEXT
STRING WS-SQL-TEXT DELIMITED SIZE
       WS-USER-INPUT DELIMITED SIZE
    INTO WS-DYNAMIC-SQL
EXEC SQL EXECUTE IMMEDIATE :WS-DYNAMIC-SQL END-EXEC
```

If dynamic SQL is unavoidable (e.g., variable table names), validate the input against a strict allow-list before use:

```cobol
EVALUATE WS-TABLE-NAME
    WHEN 'CUSTOMER'  CONTINUE
    WHEN 'ACCOUNTS'  CONTINUE
    WHEN OTHER
        MOVE 8 TO WS-RETURN-CODE
        PERFORM LOG-INVALID-TABLE
        GOBACK
END-EVALUATE.
```

## Input Validation at Entry Points

Validate all input before processing — CICS commarea, batch file records, CALL parameters:

```cobol
VALIDATE-INPUT.
    *> Numeric fields must be numeric
    IF WS-AMOUNT NOT NUMERIC
        MOVE 8 TO WS-RETURN-CODE
        MOVE 'AMOUNT IS NOT NUMERIC' TO WS-ERROR-MSG
        PERFORM LOG-ERROR
        GOBACK
    END-IF

    *> Amount must be positive
    IF WS-AMOUNT <= ZERO
        MOVE 8 TO WS-RETURN-CODE
        MOVE 'AMOUNT MUST BE POSITIVE' TO WS-ERROR-MSG
        PERFORM LOG-ERROR
        GOBACK
    END-IF

    *> Account ID must be in valid range
    IF WS-ACCOUNT-ID < 1000000000 OR
       WS-ACCOUNT-ID > 9999999999
        MOVE 8 TO WS-RETURN-CODE
        MOVE 'INVALID ACCOUNT ID RANGE' TO WS-ERROR-MSG
        PERFORM LOG-ERROR
        GOBACK
    END-IF.
```

## Buffer Overflow via PIC Truncation

COBOL truncates data silently when a value is moved into a smaller PIC field. This can cause data corruption and security issues:

```cobol
*> ✗ Silent truncation — WS-SHORT receives only 10 chars, rest lost
01  WS-USER-INPUT    PIC X(100).
01  WS-SHORT-FIELD   PIC X(10).
MOVE WS-USER-INPUT TO WS-SHORT-FIELD

*> ✓ Validate length before moving
IF FUNCTION LENGTH(FUNCTION TRIM(WS-USER-INPUT)) > 10
    MOVE 8 TO WS-RETURN-CODE
    PERFORM LOG-INPUT-TOO-LONG
ELSE
    MOVE WS-USER-INPUT TO WS-SHORT-FIELD
END-IF.
```

Always define receiving fields large enough for the maximum expected value, or validate before moving.

## Sensitive Data in Reports and Logs

```cobol
*> ✗ Never print full account or card numbers in reports
MOVE WS-CARD-NUMBER TO REPORT-LINE

*> ✓ Mask sensitive fields before output
MOVE WS-CARD-NUMBER TO WS-MASKED-NUMBER
MOVE '************' TO WS-MASKED-NUMBER(1:12)
*> WS-MASKED-NUMBER now shows: ************1234
MOVE WS-MASKED-NUMBER TO REPORT-LINE

*> ✓ Never log passwords or PINs
*> If PIN validation is needed, compare hash — never store or log plain PIN
```

## Access Control in CICS

```cobol
*> Always verify caller identity before sensitive operations
EXEC CICS VERIFY TOKEN(WS-TOKEN)
    USERID (WS-CALLER-ID)
    RESP   (WS-RESPONSE-CODE)
END-EXEC

IF WS-RESPONSE-CODE NOT = DFHRESP(NORMAL)
    EXEC CICS ABEND ABCODE('AUTH') END-EXEC
END-IF

*> Check that the caller is authorized for this transaction
EXEC CICS QUERY SECURITY
    RESSEC    ('PAYMENT')
    RESTYPE   ('TRANSACTION')
    LOGMESSAGE(WS-SECURITY-MSG)
    RESP      (WS-RESPONSE-CODE)
END-EXEC.
```

## Numeric Overflow

COBOL does not raise exceptions on arithmetic overflow by default — it wraps silently:

```cobol
*> ✓ Use ON SIZE ERROR to catch overflow
COMPUTE WS-TOTAL = WS-AMOUNT * WS-QUANTITY
    ON SIZE ERROR
        MOVE 12 TO WS-RETURN-CODE
        MOVE 'OVERFLOW IN TOTAL CALCULATION' TO WS-ERROR-MSG
        PERFORM LOG-ERROR
        GOBACK
END-COMPUTE.

*> ✗ Unprotected arithmetic — wraps silently
COMPUTE WS-TOTAL = WS-AMOUNT * WS-QUANTITY.
```

Always use `ON SIZE ERROR` for financial calculations.

## File Security

```cobol
*> Validate file status after every file operation
READ PAYMENT-FILE
    AT END SET EOF-PAYMENT-FILE TO TRUE
    NOT AT END PERFORM PROCESS-RECORD
END-READ

EVALUATE WS-FILE-STATUS
    WHEN '00'  CONTINUE             *> success
    WHEN '10'  SET EOF TO TRUE      *> end of file
    WHEN '35'                       *> file not found
        MOVE 12 TO WS-RETURN-CODE
        PERFORM ABEND-FILE-NOT-FOUND
    WHEN OTHER
        MOVE WS-FILE-STATUS TO WS-ERROR-CODE
        PERFORM ABEND-FILE-ERROR
END-EVALUATE.
```

Never ignore file status codes — a bad status can mean corrupted data or unauthorized access.

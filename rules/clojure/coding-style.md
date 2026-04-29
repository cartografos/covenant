# Coding Style — Clojure

Extends `rules/common/coding-style.md`. Clojure-specific rules take precedence.

## Formatting

- Run `cljfmt fix` or use `zprint` before committing
- Indentation: 2 spaces — no tabs
- Opening parens never on their own line
- Follow the [Clojure Style Guide](https://guide.clojure.style/)

## Naming

- Functions and vars: `kebab-case` — `find-user-by-id`, `rate-limited?`
- Predicates end in `?` — `valid?`, `empty?`, `contains-errors?`
- Destructive/impure functions end in `!` — `save!`, `reset!`, `connect!`
- Constants: `*earmuffs*` for dynamic vars, `kebab-case` for regular constants
- Namespaces: `company.domain.module` — `acme.payments.gateway`
- Protocols and records: `PascalCase` — `UserRepository`, `PaymentGateway`

## Immutability First

- All data is immutable by default — never mutate collections or records
- Use `assoc`, `dissoc`, `update`, `merge` to produce new values
- Reach for `atom` only when shared mutable state is genuinely needed
- Never use `ref`, `agent`, or `var` mutation unless the concurrency model demands it

```clojure
;; ✓ Produce new value
(defn activate-user [user]
  (assoc user :status :active :activated-at (java.time.Instant/now)))

;; ✗ Mutation-like thinking
(def user {:status :pending})
(assoc! user :status :active)  ;; doesn't exist — and shouldn't
```

## Pure Functions

- Prefer pure functions: same input → same output, no side effects
- Isolate side effects at the edges of the system (HTTP handlers, DB calls, queue ops)
- Pass dependencies explicitly — do not use global state inside business logic

```clojure
;; ✓ Pure — testable, composable
(defn calculate-tax [amount rate]
  (* amount rate))

;; ✗ Impure — hidden dependency on global config
(defn calculate-tax [amount]
  (* amount (:tax-rate @config)))
```

## Namespaces

- One namespace per file
- Require only what you use — avoid `:refer :all`
- Alias namespaces clearly and consistently across the project

```clojure
(ns acme.payments.service
  (:require
   [acme.payments.repository :as repo]
   [acme.payments.gateway    :as gateway]
   [clojure.tools.logging    :as log]))
```

## Error Handling

- Use `ex-info` to create exceptions with structured data
- Use `ex-data` to extract structured data from caught exceptions
- Prefer returning error values (`{:error ...}`) over exceptions for expected failures

```clojure
;; Throw with structured context
(throw (ex-info "User not found"
                {:type    :user/not-found
                 :user-id id}))

;; Catch and inspect
(try
  (find-user! id)
  (catch clojure.lang.ExceptionInfo e
    (let [{:keys [type user-id]} (ex-data e)]
      (log/warn "lookup failed" {:type type :user-id user-id}))))
```

## Threading Macros

Prefer threading macros for readability in pipelines:

```clojure
;; ✓ Thread-first for data transformations
(->> users
     (filter :active?)
     (map :email)
     (into []))

;; ✓ Thread-first for method chains
(-> user
    (assoc :verified? true)
    (dissoc :password-hash)
    (update :email str/lower-case))

;; ✗ Nested without threading — hard to read
(into [] (map :email (filter :active? users)))
```

## Let Bindings

Use `let` to name intermediate results — never nest more than 2 levels deep:

```clojure
;; ✓ Named intermediates
(let [active-users (filter :active? users)
      emails       (map :email active-users)]
  (send-bulk-email emails))

;; ✗ Deep nesting
(send-bulk-email (map :email (filter :active? users)))
```

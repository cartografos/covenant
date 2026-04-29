# Security — Clojure

Extends `rules/common/security.md`. Clojure-specific rules take precedence.

## SQL Injection (HoneySQL / next.jdbc)

Never build SQL strings with string interpolation. Always use a query builder or parameterized queries:

```clojure
;; ✓ HoneySQL — generates parameterized SQL
(require '[honey.sql :as sql]
         '[next.jdbc :as jdbc])

(jdbc/execute-one! db
  (sql/format {:select :*
               :from   :users
               :where  [:= :email email]}))
;; Generates: ["SELECT * FROM users WHERE email = ?" email]

;; ✓ next.jdbc parameterized directly
(jdbc/execute-one! db ["SELECT * FROM users WHERE id = ?" id])

;; ✗ Never — string interpolation in SQL
(jdbc/execute-one! db [(str "SELECT * FROM users WHERE id = '" id "'")])
```

## Input Validation (clojure.spec)

```clojure
(require '[clojure.spec.alpha :as s])

(s/def ::email    (s/and string? #(re-matches #".+@.+\..+" %)))
(s/def ::password (s/and string? #(>= (count %) 8) #(<= (count %) 72)))
(s/def ::user-id  uuid?)

;; Validate at entry points (Ring handlers, Kafka consumers, CLI)
(defn validate! [spec value]
  (when-not (s/valid? spec value)
    (throw (ex-info "Validation failed"
                    {:type    :validation/error
                     :explain (s/explain-str spec value)}))))

;; Usage in handler
(POST "/users" {body :body}
  (validate! ::register-request body)
  ;; safe to proceed
  )
```

## Password Hashing

```clojure
;; ✓ Use buddy-hashers (bcrypt)
(require '[buddy.hashers :as hashers])

(def hash   #(hashers/derive % {:alg :bcrypt+sha512}))
(def verify #(hashers/check %1 %2))

(hash "user-password")           ;; returns hash string
(verify "user-password" stored)  ;; returns true/false

;; ✗ Never use MD5, SHA-1, or raw SHA-256 for passwords
(import 'java.security.MessageDigest)
(.digest (MessageDigest/getInstance "MD5") (.getBytes password))
```

## Secrets — No Hardcoding

```clojure
;; ✓ Load from environment at startup — fail fast if missing
(defn require-env [k]
  (or (System/getenv k)
      (throw (ex-info (str k " environment variable is required") {:key k}))))

(def config
  {:jwt-secret   (require-env "JWT_SECRET")
   :database-url (require-env "DATABASE_URL")
   :redis-url    (System/getenv "REDIS_URL") ;; optional
   })

;; ✓ Or use aero with env references in config.edn
{:jwt-secret   #env JWT_SECRET
 :database-url #env DATABASE_URL}
```

## Eval Injection

```clojure
;; ✗ NEVER eval user-controlled input
(eval (read-string user-input))   ;; arbitrary code execution

;; ✓ Use spec/schema validation for data parsing
(clojure.edn/read-string {:readers {}} trusted-edn-string)
;; Note: only use edn/read-string on trusted data with restricted readers
```

## Cryptographically Secure Random

```clojure
;; ✓ java.security.SecureRandom via clojure
(import 'java.security.SecureRandom)

(defn secure-token [n-bytes]
  (let [bytes (byte-array n-bytes)]
    (.nextBytes (SecureRandom.) bytes)
    (.encodeToString (java.util.Base64/getUrlEncoder) bytes)))

;; ✗ Not cryptographically secure
(rand-int 1000000)   ;; predictable
```

## HTTP Security Headers (Ring)

```clojure
(require '[ring.middleware.defaults :refer [wrap-defaults api-defaults]])

;; Use ring-defaults — includes secure headers
(def app
  (-> routes
      (wrap-defaults (-> api-defaults
                         (assoc-in [:security :anti-forgery] false) ;; stateless API
                         (assoc-in [:security :hsts] true)))))

;; Or set manually
(defn wrap-security-headers [handler]
  (fn [request]
    (-> (handler request)
        (assoc-in [:headers "X-Content-Type-Options"] "nosniff")
        (assoc-in [:headers "X-Frame-Options"] "DENY")
        (assoc-in [:headers "Strict-Transport-Security"] "max-age=31536000"))))
```

## Dependency Scanning

```bash
# Check for known vulnerabilities in Maven deps
clojure -Sdeps '{:deps {org.owasp/dependency-check-maven {:mvn/version "LATEST"}}}' \
  -M -m org.owasp.dependencycheck.Main --project MyApp --scan .

# Simpler: use nvd-clojure
clojure -Tnvd nvd.task/check
```

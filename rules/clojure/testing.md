# Testing — Clojure

Extends `rules/common/testing.md`. Clojure-specific rules take precedence.

## Stack

- **clojure.test** — built-in test framework (default)
- **kaocha** — test runner with watch mode, coverage, and parallel execution
- **test.check** — generative/property-based testing
- **clj-http-fake** or **with-redefs** — HTTP mocking

## File Placement

```
test/
  acme/
    domain/
      user_test.clj
    application/
      register_user_test.clj
    infrastructure/
      postgres_user_repository_test.clj
```

## clojure.test Structure

```clojure
(ns acme.application.register-user-test
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
   [acme.application.register-user :as sut]
   [acme.test.fakes :as fakes]))

(deftest register-user-test
  (testing "saves user and sends welcome email"
    (let [repo   (fakes/make-user-repo)
          mailer (fakes/make-mailer)
          result (sut/register-user {:users repo :mailer mailer :clock #(inst-ms (java.util.Date.))}
                                    {:email "a@b.com" :password "pass1234"})]
      (is (= "a@b.com" (:email result)))
      (is (= 1 (count (fakes/sent-emails mailer))))))

  (testing "throws when email is already registered"
    (let [repo   (fakes/make-user-repo {:email "a@b.com"})
          mailer (fakes/make-mailer)]
      (is (thrown-with-msg?
            clojure.lang.ExceptionInfo #"already registered"
            (sut/register-user {:users repo :mailer mailer :clock inst-ms}
                               {:email "a@b.com" :password "pass1234"}))))))
```

## Fixtures

```clojure
;; One-time setup
(use-fixtures :once
  (fn [run-tests]
    (start-test-db!)
    (run-tests)
    (stop-test-db!)))

;; Per-test cleanup
(use-fixtures :each
  (fn [run-tests]
    (clear-test-data!)
    (run-tests)))
```

## Fakes

```clojure
;; test/acme/test/fakes.clj
(ns acme.test.fakes)

(defn make-user-repo
  ([] (make-user-repo nil))
  ([seed-user]
   (let [store (atom (if seed-user {(:id seed-user) seed-user} {}))]
     (reify acme.domain.protocols/UserRepository
       (find-by-id    [_ id]    (get @store id))
       (find-by-email [_ email] (first (filter #(= email (:email %)) (vals @store))))
       (save!         [_ user]  (swap! store assoc (:id user) user) user)))))

(defn make-mailer []
  (let [sent (atom [])]
    {:send-welcome! (fn [user] (swap! sent conj user))
     :sent-emails   (fn [] @sent)}))

(defn sent-emails [mailer] ((:sent-emails mailer)))
```

## Property-Based Testing (test.check)

```clojure
(require '[clojure.test.check.generators :as gen]
         '[clojure.test.check.properties :as prop]
         '[clojure.test.check.clojure-test :refer [defspec]])

(defspec calculate-tax-is-always-non-negative 100
  (prop/for-all [amount (gen/double* {:min 0.0 :max 1000.0})
                 rate   (gen/double* {:min 0.0 :max 1.0})]
    (>= (calculate-tax amount rate) 0.0)))
```

## Running Tests

```bash
# clojure.test via Leiningen
lein test
lein test acme.application.register-user-test   # specific namespace

# kaocha (recommended)
clojure -M:test               # all tests
clojure -M:test --watch       # watch mode
clojure -M:test --focus acme.application.register-user-test/register-user-test

# Coverage with cloverage
lein cloverage
```

## kaocha Config (`tests.edn`)

```edn
#kaocha/v1
{:tests [{:id          :unit
           :test-paths  ["test"]
           :source-paths ["src"]}]
 :plugins [:kaocha.plugin/junit-xml]
 :kaocha.plugin.junit-xml/target-file "target/junit.xml"}
```

## Do Not

- Do not use `with-redefs` for internal functions — test through the public API with fakes
- Do not use `Thread/sleep` in tests — use `async` test patterns or virtual time
- Do not share mutable state between tests — use `use-fixtures :each` to reset

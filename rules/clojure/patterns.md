# Patterns — Clojure

Common architectural patterns for Clojure services.

## System Composition (Integrant)

```clojure
;; config.edn — declare components and their dependencies
{:acme.db/pool    {:url #env DATABASE_URL :max-pool-size 10}
 :acme.http/server {:port #env PORT :handler #ig/ref :acme.app/router}
 :acme.app/router  {:db #ig/ref :acme.db/pool}}

;; src/acme/db.clj
(defmethod ig/init-key :acme.db/pool [_ {:keys [url max-pool-size]}]
  (connection-pool/create {:url url :max-pool-size max-pool-size}))

(defmethod ig/halt-key! :acme.db/pool [_ pool]
  (connection-pool/close pool))
```

## Repository Pattern (Protocol)

```clojure
;; Domain — define the contract
(defprotocol UserRepository
  (find-by-id   [this id])
  (find-by-email [this email])
  (save!        [this user]))

;; Infrastructure — implement with HoneySQL + next.jdbc
(defrecord PostgresUserRepository [db]
  UserRepository
  (find-by-id [_ id]
    (jdbc/execute-one! db (sql/format {:select :* :from :users :where [:= :id id]})))

  (find-by-email [_ email]
    (jdbc/execute-one! db (sql/format {:select :* :from :users :where [:= :email email]})))

  (save! [_ user]
    (jdbc/execute-one! db
      (sql/format {:insert-into :users
                   :values      [user]
                   :on-conflict [:id]
                   :do-update-set (keys user)}))))
```

## Use Case / Service Function

```clojure
;; Pure function — dependencies injected explicitly
(defn register-user
  [{:keys [users mailer clock]} {:keys [email password]}]
  (when (find-by-email users email)
    (throw (ex-info "Email already registered"
                    {:type :user/already-exists :email email})))
  (let [user {:id         (random-uuid)
              :email      email
              :password   (bcrypt/hash password)
              :created-at (clock)}]
    (save! users user)
    (send-welcome! mailer user)
    user))
```

## Ring Handler Pattern (Compojure)

```clojure
(defroutes user-routes
  (POST "/users" {body :body}
    (try
      (let [user (register-user deps body)]
        {:status 201 :body (select-keys user [:id :email :created-at])})
      (catch clojure.lang.ExceptionInfo e
        (case (-> e ex-data :type)
          :user/already-exists {:status 409 :body {:error (.getMessage e)}}
          (throw e))))))

;; Middleware stack
(def app
  (-> user-routes
      wrap-json-body
      wrap-json-response
      (wrap-defaults api-defaults)))
```

## Spec for Validation (clojure.spec)

```clojure
(require '[clojure.spec.alpha :as s])

(s/def ::email    (s/and string? #(re-matches #".+@.+\..+" %)))
(s/def ::password (s/and string? #(>= (count %) 8)))

(s/def ::register-request
  (s/keys :req-un [::email ::password]))

(defn validate! [spec data]
  (when-not (s/valid? spec data)
    (throw (ex-info "Validation failed"
                    {:type   :validation/error
                     :errors (s/explain-data spec data)}))))

;; Usage
(validate! ::register-request {:email "a@b.com" :password "pass1234"})
```

## In-Memory Test Repository

```clojure
(defrecord InMemoryUserRepository [store]
  UserRepository
  (find-by-id    [_ id]    (get @store id))
  (find-by-email [_ email] (first (filter #(= email (:email %)) (vals @store))))
  (save!         [_ user]  (swap! store assoc (:id user) user) user))

(defn make-repo [] (->InMemoryUserRepository (atom {})))
```

## core.async for Event-Driven Flows

```clojure
(require '[clojure.core.async :as a])

(defn process-events [event-ch handler]
  (a/go-loop []
    (when-let [event (a/<! event-ch)]
      (try
        (handler event)
        (catch Exception e
          (log/error e "Failed to process event" {:event event})))
      (recur))))
```

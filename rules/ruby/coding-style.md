# Coding Style — Ruby

Extends `rules/common/coding-style.md`. Ruby-specific rules take precedence.

## Formatting

- Run `rubocop --autocorrect` before committing (config in `.rubocop.yml`)
- Line length: 120 characters
- Indentation: 2 spaces — no tabs
- Add `# frozen_string_literal: true` at the top of every file

## Naming

- Classes and modules: `PascalCase` — `UserRepository`, `PaymentService`
- Methods, variables, symbols: `snake_case` — `find_user_by_id`, `is_rate_limited?`
- Constants: `SCREAMING_SNAKE_CASE` — `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- Predicates end in `?` — `valid?`, `persisted?`, `admin?`
- Dangerous/mutating methods end in `!` — `save!`, `update!`, `destroy!`
- Files: `snake_case` matching the class name — `user_repository.rb`

## Frozen String Literals

```ruby
# frozen_string_literal: true

class UserService
  # ...
end
```

Always include at the top. Prevents accidental string mutation and improves performance.

## Blocks and Lambdas

```ruby
# ✓ Single-line blocks: use { }
users.map { |u| u.email }

# ✓ Multi-line blocks: use do...end
users.each do |user|
  process(user)
  notify(user)
end

# ✓ Stabby lambda for explicit closures
validate = ->(value) { value.present? && value.length < 255 }
```

## Method Design

- Keep methods under 10 lines — extract private methods if longer
- One level of abstraction per method
- Use keyword arguments for methods with 3+ parameters or optional parameters

```ruby
# ✓ Keyword arguments — clear and order-independent
def register(email:, password:, role: :user)
  # ...
end

# ✗ Positional — fragile with 3+ args
def register(email, password, role = :user)
```

## Guard Clauses

Prefer guard clauses over nested conditionals:

```ruby
# ✓ Guard clauses
def process(user)
  return unless user.active?
  return if user.suspended?
  
  do_the_work(user)
end

# ✗ Nested conditionals
def process(user)
  if user.active?
    unless user.suspended?
      do_the_work(user)
    end
  end
end
```

## Symbols vs Strings

- Use symbols for hash keys, identifiers, and options — `{ role: :admin }`
- Use strings for user-facing text and data from external sources

## Error Handling

- Rescue specific exceptions — never rescue `Exception` or `StandardError` without re-raising
- Use custom exception classes for domain errors

```ruby
class UserNotFoundError < StandardError
  def initialize(id) = super("User not found: #{id}")
end

# ✓ Specific rescue
begin
  user = find_user!(id)
rescue UserNotFoundError => e
  logger.warn(e.message)
  raise
end

# ✗ Catch-all
rescue StandardError # too broad
```

## Modules and Mixins

- Use modules for shared behavior across unrelated classes (mixins)
- Use `extend` for class-level methods, `include` for instance-level methods
- Prefer composition over deep inheritance hierarchies

# Testing — Ruby

Extends `rules/common/testing.md`. Ruby-specific rules take precedence.

## Stack

- **RSpec** — test framework (`describe`, `context`, `it`, `expect`)
- **FactoryBot** — test data factories
- **Faker** — realistic fake data
- **Shoulda Matchers** — Rails-specific matchers
- **VCR** / **WebMock** — HTTP interaction recording

## File Placement

```
spec/
  domain/
    user_spec.rb
  application/
    use_cases/
      register_user_spec.rb
  infrastructure/
    persistence/
      ar_user_repository_spec.rb
  requests/               ← integration tests (API layer)
    users_spec.rb
  factories/
    users.rb
```

## RSpec Structure

```ruby
# frozen_string_literal: true

RSpec.describe RegisterUserService, type: :service do
  subject(:service) { described_class.new(users: repo, mailer: mailer, clock: clock) }

  let(:repo)   { InMemoryUserRepository.new }
  let(:mailer) { instance_double(UserMailer, welcome: double(deliver_later: nil)) }
  let(:clock)  { instance_double(Time, current: Time.zone.parse("2024-01-01")) }

  describe "#call" do
    context "when email is unique" do
      it "returns a successful result with the created user" do
        result = service.call(email: "a@b.com", password: "pass1234")

        expect(result).to be_success
        expect(result.user.email).to eq("a@b.com")
      end

      it "sends a welcome email" do
        service.call(email: "a@b.com", password: "pass1234")
        expect(mailer).to have_received(:welcome)
      end
    end

    context "when email is already taken" do
      before { repo.save(build(:user, email: "a@b.com")) }

      it "returns a failure result" do
        result = service.call(email: "a@b.com", password: "pass1234")
        expect(result).not_to be_success
      end
    end
  end
end
```

## Factories

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    email      { Faker::Internet.unique.email }
    created_at { Time.current }

    trait :admin do
      role { :admin }
    end
  end
end

# Usage
build(:user)             # unsaved instance
create(:user)            # saved to DB
build(:user, :admin)     # with trait
build_list(:user, 3)     # multiple
```

## Fakes Over Mocks

```ruby
class InMemoryUserRepository
  def initialize = @store = {}

  def exists?(email:)  = @store.values.any? { |u| u.email == email }
  def find_by_id(id)   = @store[id]
  def save(user)       = @store[user.id] = user and user
  def all              = @store.values
end
```

Use `instance_double` only for external services (mailer, payment gateway, HTTP client).

## Request Specs (API Integration)

```ruby
RSpec.describe "POST /users", type: :request do
  it "creates a user and returns 201" do
    post "/users", params: { email: "a@b.com", password: "pass1234" }, as: :json

    expect(response).to have_http_status(:created)
    expect(json_body["id"]).to be_present
  end

  it "returns 422 for invalid email" do
    post "/users", params: { email: "not-an-email", password: "pass1234" }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_body["error"]).to be_present
  end

  def json_body = JSON.parse(response.body)
end
```

## Running Tests

```bash
bundle exec rspec                         # all tests
bundle exec rspec spec/domain/            # specific directory
bundle exec rspec spec/domain/user_spec.rb:42  # specific line
bundle exec rspec --format documentation  # verbose output

# Coverage
COVERAGE=true bundle exec rspec
```

## Coverage (SimpleCov)

```ruby
# spec/spec_helper.rb
require "simplecov"
SimpleCov.start "rails" do
  minimum_coverage 90
  add_filter "/spec/"
  add_filter "/config/"
end
```

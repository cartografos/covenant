# Patterns — Ruby / Rails

Common architectural patterns for Ruby services.

## Clean Architecture (Rails)

```
app/
  domain/
    user.rb              ← plain Ruby object (no ActiveRecord)
    repositories/
      user_repository.rb ← interface + base
  application/
    use_cases/
      register_user.rb
  infrastructure/
    persistence/
      ar_user_repository.rb  ← ActiveRecord implementation
  controllers/
    users_controller.rb
  services/              ← domain services (thin layer)
```

## Service Object Pattern

```ruby
# frozen_string_literal: true

class RegisterUserService
  Result = Data.define(:user, :success?, :error)

  def initialize(users:, mailer:, clock: Time)
    @users  = users
    @mailer = mailer
    @clock  = clock
  end

  def call(email:, password:)
    return Result.new(user: nil, success?: false, error: "Email taken") if @users.exists?(email:)

    user = User.create!(
      email:,
      password_digest: BCrypt::Password.create(password),
      created_at: @clock.current,
    )
    @mailer.welcome(user).deliver_later
    Result.new(user:, success?: true, error: nil)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(user: nil, success?: false, error: e.message)
  end
end
```

## Repository Pattern

```ruby
# app/domain/repositories/user_repository.rb
module UserRepository
  def self.find_by_email(email)
    raise NotImplementedError
  end
end

# app/infrastructure/persistence/ar_user_repository.rb
module ArUserRepository
  def self.find_by_email(email)
    UserRecord.find_by(email:)&.then { |r| map_to_domain(r) }
  end

  def self.save(user)
    record = UserRecord.find_or_initialize_by(id: user.id)
    record.update!(email: user.email, created_at: user.created_at)
    map_to_domain(record)
  end

  private_class_method def self.map_to_domain(record)
    User.new(id: record.id, email: record.email, created_at: record.created_at)
  end
end
```

## Rails Controller (thin)

```ruby
# app/controllers/users_controller.rb
class UsersController < ApplicationController
  def create
    result = RegisterUserService.new(
      users:  ArUserRepository,
      mailer: UserMailer,
    ).call(email: params[:email], password: params[:password])

    if result.success?
      render json: UserSerializer.new(result.user), status: :created
    else
      render json: { error: result.error }, status: :unprocessable_entity
    end
  end
end
```

## Strong Parameters

```ruby
def user_params
  params.require(:user).permit(:email, :name, :role)
  # ✗ Never: params[:user] directly or params.permit!
end
```

## Value Objects (Data class — Ruby 3.2+)

```ruby
Money = Data.define(:amount_cents, :currency) do
  def initialize(amount_cents:, currency:)
    raise ArgumentError, "amount must not be negative" if amount_cents < 0
    super
  end

  def add(other)
    raise ArgumentError, "currency mismatch" unless currency == other.currency
    Money.new(amount_cents: amount_cents + other.amount_cents, currency:)
  end
end
```

## Background Jobs (Sidekiq)

```ruby
class SendWelcomeEmailJob
  include Sidekiq::Job
  sidekiq_options retry: 3, queue: :mailers

  def perform(user_id)
    user = User.find(user_id)
    UserMailer.welcome(user).deliver_now
  rescue ActiveRecord::RecordNotFound
    # User deleted before job ran — not an error
  end
end
```

## Testing with RSpec

```ruby
RSpec.describe RegisterUserService do
  subject(:service) { described_class.new(users: fake_repo, mailer: fake_mailer) }

  let(:fake_repo)   { instance_double(ArUserRepository, exists?: false, save: user) }
  let(:fake_mailer) { instance_double(UserMailer, welcome: double(deliver_later: true)) }
  let(:user)        { build(:user) }

  describe "#call" do
    it "creates user and sends welcome email" do
      result = service.call(email: "a@b.com", password: "pass1234")

      expect(result).to be_success
      expect(fake_mailer).to have_received(:welcome).with(user)
    end

    it "returns failure when email is already taken" do
      allow(fake_repo).to receive(:exists?).and_return(true)

      result = service.call(email: "a@b.com", password: "pass1234")

      expect(result).not_to be_success
      expect(result.error).to include("Email taken")
    end
  end
end
```

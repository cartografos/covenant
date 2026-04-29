# Security — Ruby / Rails

Extends `rules/common/security.md`. Ruby-specific rules take precedence.

## SQL Injection

```ruby
# ✓ ActiveRecord — parameterized automatically
User.where(email: params[:email])
User.where("created_at > ?", 1.week.ago)
User.where("role = :role", role: params[:role])

# ✗ Never — string interpolation in WHERE clause
User.where("email = '#{params[:email]}'")
User.where("role = #{params[:role]}")
```

## Mass Assignment (Strong Parameters)

```ruby
# ✓ Always use strong parameters in controllers
def user_params
  params.require(:user).permit(:email, :name)
  # never :role, :admin, :password_digest here
end

User.create!(user_params)

# ✗ Never permit all or use raw params
params.permit!
User.create!(params[:user])
```

## Password Hashing

```ruby
# ✓ Use has_secure_password (bcrypt under the hood)
class User < ApplicationRecord
  has_secure_password  # adds password_digest column, authenticate method
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
end

# Verification
user.authenticate("plaintext_password")  # returns user or false

# ✗ Never
Digest::MD5.hexdigest(password)
Digest::SHA1.hexdigest(password)
```

## XSS (Cross-Site Scripting)

```ruby
# ✓ ERB escapes by default
<%= user.name %>           # escaped automatically

# ✓ Raw only with sanitized content
<%= sanitize user.bio, tags: %w[p b i a], attributes: %w[href] %>

# ✗ Never output raw user input
<%= raw user.name %>
<%= user.name.html_safe %>
```

## CSRF Protection

```ruby
# ApplicationController — always on for web routes
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception   # default in Rails
end

# API controllers that use token auth — disable CSRF (stateless)
class Api::BaseController < ActionController::API
  # ActionController::API excludes CSRF protection by default
end
```

## File Uploads (Active Storage)

```ruby
# ✓ Validate content type and file size
validates :avatar, content_type: %w[image/jpeg image/png image/webp],
                   size: { less_than: 2.megabytes }

# ✓ Serve via signed URLs — never expose storage paths
url_for(user.avatar)   # generates signed, time-limited URL

# ✗ Never trust client-provided MIME type
# Always validate server-side with Marcel or similar
```

## Command Injection

```ruby
# ✓ Use array form — arguments are not shell-interpolated
system("convert", input_path, output_path)
Open3.capture2("git", "clone", "--", repo_url, dest)

# ✗ Never — string interpolation + shell interpretation
system("convert #{user_input} output.pdf")
`ffmpeg -i #{filename} output.mp4`
```

## Secrets

```ruby
# config/credentials.yml.enc — encrypted, safe to commit
# Access via:
Rails.application.credentials.stripe[:secret_key]
Rails.application.credentials.jwt_secret

# Environment variables as alternative
ENV.fetch("STRIPE_SECRET_KEY") { raise "STRIPE_SECRET_KEY is not set" }

# ✗ Never hardcode in source
STRIPE_KEY = "sk_live_abc123"
```

## Dependency Scanning

```bash
bundle exec brakeman          # static analysis for Rails vulnerabilities
bundle audit check --update   # check gems against vulnerability database
```

Run both in CI. Fix all HIGH and CRITICAL findings before merging.

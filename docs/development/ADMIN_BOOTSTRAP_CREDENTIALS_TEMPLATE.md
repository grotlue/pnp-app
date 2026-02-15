# Admin Bootstrap Credentials (Template)

Use this template outside of version control (for example in your password manager).
Do **not** commit real credentials to the repository.

## Production

- Email: `<set in GitHub secret ADMIN_BOOTSTRAP_EMAIL>`
- Password: `<set in GitHub secret ADMIN_BOOTSTRAP_PASSWORD>`
- Username (optional): `<GitHub env var ADMIN_BOOTSTRAP_USERNAME or default 'admin'>`

## Preview

- Email: `<set in GitHub secret ADMIN_BOOTSTRAP_EMAIL>`
- Password: `<set in GitHub secret ADMIN_BOOTSTRAP_PASSWORD>`
- Username (optional): `<GitHub env var ADMIN_BOOTSTRAP_USERNAME or default 'admin'>`

## Notes

- Bootstrap is idempotent and runs in deploy workflows.
- If the admin email already exists, the script keeps the existing account and enforces `profiles.role = 'admin'`.
- A second admin profile is blocked by the DB unique constraint.

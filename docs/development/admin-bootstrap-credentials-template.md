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

- Bootstrap is idempotent and runs in deployment workflows.
- Existing admin email is reused and forced to `profiles.role = 'admin'`.

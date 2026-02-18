# Local Dev Fixture Users

Credentials for the fixture accounts in `supabase/seed.sql`.

## Passwords

- Admin user:
  - Email: `admin@pnp.test`
  - Password: `admin`
- All other fixture users:
  - Password: `DevPass123!`

## Users

| Rolle                                    | E-Mail                             |
| ---------------------------------------- | ---------------------------------- |
| Admin                                    | `admin@pnp.test`                   |
| Campaign Owner                           | `owner.local@pnp.test`             |
| Player 1 (Character assigned)            | `player1.local@pnp.test`           |
| Player 2 (Character assigned)            | `player2.local@pnp.test`           |
| Player 3 (Character assigned)            | `player3.local@pnp.test`           |
| Player 4 (Character assigned)            | `player4.local@pnp.test`           |
| Campaign Member (Character not assigned) | `member-unassigned.local@pnp.test` |
| Standalone Player 1 (no campaign)        | `solo1.local@pnp.test`             |
| Standalone Player 2 (no campaign)        | `solo2.local@pnp.test`             |

## Reload Fixture

```bash
yarn supabase:db:reset
```

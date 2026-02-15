# Local Dev Fixture Users

These login credentials apply to the local fixture defined in `supabase/seed.sql`.

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

## Reset / Reload

After changing the fixture:

```bash
yarn supabase:db:reset
```

# Whole BTD Commando website backup

BTD.zip is a source-and-assets snapshot, including all original artwork, self-hosted Night Watch music and attribution, tests, dependency manifest/lockfile and database schema migrations. Nothing is cropped.

Environment files and credentials are intentionally excluded. Browser-local user records, hosted database rows/auth users, Vercel account configuration and domain/DNS settings are not part of this ZIP. Keep an authorized database export and the Data tools JSON separately when needed.

## Restore

1. Extract the archive and open its project directory.
2. Install dependencies with the package manager used by the included lockfile (bun.lock).
3. Reconfigure the environment variables through your hosting account, not a public Git commit.
4. Run the package build script and deploy the TanStack Start application to Vercel.
5. When restoring to a new database, apply the included migrations and configure authentication. Schema migrations do not restore existing user content.
6. Retain public/audio/night-watch/LICENSE.md and the in-player music credits.

Scoring remains btd_v1_0; paper/research only. A backup never grants cloud-upload consent or live-trading authorization.

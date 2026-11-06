# PICKLECITY TOURNAMENT MANAGER

A tournament operations app for PickleCity: tournament setup, player/team registration, fixtures, scoring, standings and a public parent-facing scoreboard.

## Current repository status

The current React app is still a **browser-local demo**. Demo records are stored in localStorage and are not shared across devices. The UI is not yet connected to Firebase Authentication or Firestore, and no public scoreboard URL has been deployed.

Implemented in the demo:
- Tournament, player and team CRUD
- Manual match scheduling and score entry
- Win = 2 points; loss = 0 points
- Basic standings
- Round-robin fixture generation
- Match CSV export

Not implemented yet:
- Firebase sign-in and Firestore synchronization
- Public parent scoreboard and publication workflow
- Knockout bracket progression and league-to-semifinal/final automation
- Random mixed-doubles partner generation
- PDF export, complete PWA icons and verified Android installation
- Production deployment and end-to-end security testing

## Firebase project

Use the existing Firebase project: `kpl-tournament-manager` (Spark plan).

Configure the Vite environment variables from `.env.example` in the deployment environment. Firebase web configuration is client-side configuration, not an admin credential. Never commit service-account JSON, private keys, passwords or tokens.

## Firestore data separation

The rules file establishes two data zones:

- `tournaments/{tournamentId}` and `tournaments/{tournamentId}/matches/{matchId}`: private operational records.
- `players/{playerId}`: private player records; never expose contact information on public pages.
- `publicTournaments/{tournamentId}`: explicitly sanitized public tournament projection.
- `publicTournaments/{tournamentId}/matches/{matchId}` and `standings/{standingId}`: public display data, readable only when the parent tournament has `published: true`.
- `admins/{uid}`: roles provisioned by a trusted project owner; clients cannot grant roles.

Suggested admin roles are `super_admin` and `score_admin`. The rules allow super admins to manage tournament setup and score admins to update match scores. This is a starting ruleset, not a claim of completed production security: validate every document shape and field, test rules in the Firebase Emulator Suite, and review the public projection before enabling real parent access.

## Local development

```bash
npm install
npm run dev
npm run build
```

The CI workflow runs the TypeScript build and Vite production build. A green build confirms compilation, not full application behavior or deployment readiness.

## Iteration 1
- Read `.codex/REVIEW.md`
- Removed body-token auth transport from API
- Removed token-in-JS storage from web app
- Removed OAuth fragment token handling
- Updated env examples and README to keep auth cookie-only

## Iteration 2
- Added socket auth using access token cookie or bearer header
- Added socket rooms for user and admin scopes
- Split realtime sync delivery by public, user, admin topics
- Reconnected websocket client on auth state changes

## Iteration 3
- Moved reward points debit into transaction
- Switched reward redemption to conditional balance update
- Fail redemption when debit cannot reserve points
- Added reward tests for atomic debit path

## Iteration 4
- Catch Prisma unique conflict on prediction create
- Return `ConflictException` for prediction race loser
- Added market test for `P2002` duplicate race

## Iteration 5
- Ran API targeted tests: auth, rewards, markets
- API build passed
- Web targeted lint passed
- One existing web warning remains in `auth-context.tsx` `useMemo` deps

## Iteration 6
- Re-read `.codex/REVIEW.md`
- Moved market declaration settlement into one transaction
- Added win point-transaction writes during declaration
- Broadcast declaration sync per affected user so scoped websocket delivery still works
- Ignored `.next-buildcheck/**` in web ESLint config

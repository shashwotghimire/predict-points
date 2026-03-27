# Repository Review

Reviewed on: 2026-03-27

Scope:
- Backend: NestJS API in `app/api/v1`
- Frontend: Next.js app in `app/web`
- Method: static code review with a security-first focus, plus current test/lint runs

## Findings

### 1. High: Market declaration is not transactional, so a mid-flight failure can permanently underpay winners or partially settle a market

Affected code:
- `app/api/v1/src/modules/markets/markets.service.ts:288-338`

Why this matters:
- `declare()` updates the market status first, then iterates through predictions and performs separate writes for each prediction and each winning user's points balance.
- Those writes are not wrapped in a single transaction.
- If the process or database fails after a winning prediction is marked `WON` but before the corresponding `user.points` increment succeeds, the winner is left with a settled prediction and no payout.
- Because retries only select `status: 'ACTIVE'` predictions, that missed winner would not be corrected by re-running the declaration flow.

Recommendation:
- Move the entire declaration workflow into a transaction.
- For each winning prediction, update the prediction and the user's balance atomically.
- Consider creating matching point-transaction records for winnings inside the same transaction so settlement is auditable and replay-safe.

### 2. Medium: The new websocket scoping drops user-specific sync events during market resolution

Affected code:
- `app/api/v1/src/modules/markets/markets.service.ts:341-352`
- `app/api/v1/src/modules/realtime/realtime.gateway.ts:126-145`
- `app/web/src/app/components/realtime-sync.tsx:45-63`

Why this matters:
- The realtime gateway now correctly sends `user-points`, `user-predictions`, and `user-rewards` only when a `payload.userId` is present.
- `MarketsService.declare()` still broadcasts `user-points` and `user-predictions` without a `userId`, so those topics are silently discarded by the gateway.
- The frontend relies on those topics to invalidate `["user-points", userId]` and `["user-predictions", ...]`, so users will not see their resolved prediction state or updated points in real time after a market is declared.

Recommendation:
- Emit per-user sync events for affected users during settlement, or introduce a separate market-resolution topic that the frontend uses to refresh the relevant user-scoped queries.
- Add a regression test around declaration + realtime payload routing so this behavior does not slip again.

## Resolved Since Last Review

These earlier issues appear fixed in the current codebase:
- The optional body-token auth transport and URL-fragment token handoff are gone; auth now stays cookie-based.
- The websocket gateway now authenticates sockets with access tokens and scopes admin/user topics to rooms instead of broadcasting everything globally.
- Reward redemption now debits points inside a transaction using a conditional balance check.
- Prediction creation now translates unique-constraint races into `ConflictException` instead of leaking a raw database failure path.

## Verification Notes

Passed:
- `npm run test` in `app/api/v1`: 7/7 suites passed, 15/15 tests passed.
- `npm run test` in `app/web`: 3/3 files passed, 6/6 tests passed.

Failed:
- `npm run lint` in `app/api/v1`: 123 errors, 15 warnings. A large share of the failures are unsafe `any` usage in auth/bootstrap code and in the newly added backend specs.
- `npm run lint` in `app/web`: 111 errors, 101 warnings. `app/web/eslint.config.mjs:9-15` still ignores `.next/**` but not `.next-buildcheck/**`, so generated build artifacts are being linted alongside source files.

## Overall Assessment

The repository is in a better state than the previous pass: the highest-risk auth and websocket exposure issues have been addressed, and the new automated tests are a strong improvement. The main remaining application risk is settlement correctness in `declare()`, followed by the realtime regression introduced by the new websocket scoping. The lint baseline is still noisy enough that important review signals could be buried in day-to-day development.

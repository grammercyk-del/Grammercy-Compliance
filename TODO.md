# TODO — Compliance Dashboard (Next.js + Supabase)

## Phase 2 — Stabilize App
- [ ] Fix routing for `/`, `/login`, `/dashboard`
- [ ] Ensure `/dashboard` actually renders `DashboardClient`
- [ ] Verify auth redirect issues are not present (middleware already disabled)
- [ ] Run `npm run build` until successful

## Phase 3 — UI Spec (strict)
- [ ] Refactor `app/dashboard/DashboardClient.tsx` to match strict UI spec
- [ ] Enforce status colors + status logic purely from `days_remaining`
- [ ] Ensure summary cards + alerts groups use strict days ranges
- [ ] Ensure table matches required 11 columns + exact edit behavior
- [ ] Owner analytics uses strict risk formula
- [ ] Filters/search use strict derived status
- [ ] Export CSV only after stable

## Final
- [ ] Produce AUDIT REPORT + FINAL REPORT
- [ ] Commit with `final: stable compliance dashboard with full UI spec`


# TODO

## Admin control + public viewer mode
- [ ] Update `app/dashboard/page.tsx` to detect role using Supabase session email and pass `isEditor` to `DashboardClient`.
- [ ] Refactor `app/dashboard/DashboardClient.tsx` to accept `isEditor` prop instead of using `IsEditorContext`.
- [ ] Remove unused `IsEditorContext` import/usages from `DashboardClient.tsx` and update role display + editor gating.
- [x] Ensure `/login` route remains as-is for now (session management already stubbed/disabled per current UI).
- [ ] Run `npm test` / `npm run lint` / `npm run build` to confirm compilation (build currently fails due to missing Next build manifests in this environment).



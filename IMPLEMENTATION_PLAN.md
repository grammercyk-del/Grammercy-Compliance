# Implementation Plan — Gramercy Dashboard Enhancements

## Current State

Project already has: Auth (magic link), Dashboard, Compliances (modal-based edit), Filters, Charts, Alerts, Risk, Audit, Reports, Dark Mode, Sidebar routing.

## What Needs to Be Added/Changed

### 1. Inline Editing (Spreadsheet Style) — CRITICAL

- [ ] Convert ComplianceTable cells to be click-to-edit inline
- [ ] On blur/Enter → auto-save to Supabase
- [ ] No more modal-based editing (keep modal for adding new rows)
- [ ] Show editable cells with visual feedback (highlight on edit, save indicator)

### 2. Row Actions

- [ ] Add: Already works via modal
- [ ] Delete: Already works with ConfirmModal
- [ ] Duplicate: Need to implement duplicate row (fetch and insert copy)

### 3. Owner Auto-Assignment Logic

- [ ] If category == "MoEF & CC / MPCB" → owner = "Ankit Devadiga"
- [ ] Else → owner = "Mayank Jain"
- [ ] Apply when creating new compliance

### 4. Renewal Date Calculation

- [ ] Auto-calculate next_renewal_date from last_renewed_date + renewal_duration/frequency

### 5. Live Alerts Panel (4 columns)

- [ ] 🔴 Critical (≤7 days or overdue)
- [ ] 🟠 High (≤30 days)
- [ ] 🟡 Medium (60–90 days)
- [ ] 🟢 Normal (>90 days)

### 6. Owner Dashboard Section

- [ ] Per-owner stats: Total, Critical, Active, Risk Score
- [ ] Already partially in RiskPage, but needs to be on dashboard too

### 7. Header Updates

- [ ] "Editor Access" badge
- [ ] Toggle: Table / By Owner view

### 8. Weekly Email Report (Supabase Edge Function)

- [ ] Create Resend email integration
- [ ] Edge function: fetch compliances, classify, send report
- [ ] Cron schedule setup

### 9. Auth Enhancement

- [ ] Login with magic link (already exists) — verify works
- [ ] Permission logic: @kesariprojects.com → edit, else → view (already done)

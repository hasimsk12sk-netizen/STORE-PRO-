# STORE PRO Website — Security Specification (Phase 0)

## 1. Data Invariants
1. **Platform Isolation**: All website collections live under `website_*` (`website_apps`, `website_categories`, `website_banners`, `website_users`, `website_admins`, `website_settings`, `website_analytics`). No Android app upload collections are accessed or mutated.
2. **Centralized APK Distribution**: `website_apps` documents must never store individual third-party APK download links; every app uses `website_settings/global.storeProDownloadUrl`.
3. **Publication Visibility**: Only documents in `website_apps` with `status == 'published'` are readable by public visitors. Draft and unpublished listings are visible only to verified administrators (`isAdmin()`).
4. **PII Isolation & Self-Assigned Role Prevention**: `website_users/{userId}` documents are strictly readable and writable only by the authenticated verified owner (`request.auth.uid == userId`) or verified admins (`isAdmin()`). Users cannot include `role`, `isAdmin`, or arbitrary extra fields (`hasOnly` enforced).
5. **Immutable Audit & Analytics**: `website_analytics` events are append-only (`create` only for verified signed-in users with exact `request.time` timestamp and valid `eventType` enum). `update` and `delete` are unconditionally denied.
6. **Temporal & Ownership Integrity**: `createdAt` and `createdBy` on `website_apps` are immutable after creation; `updatedAt` must always equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unverified Email Spoofing**: Admin write request with `email: "hasimsk12sk@gmail.com"` and `email_verified: false`.
2. **Shadow Field Injection on User Registration**: `POST /website_users/{uid}` containing `{"isAdmin": true, "role": "superadmin"}` alongside valid user fields.
3. **Cross-User PII Read**: Authenticated user A reading `/website_users/{userB_uid}`.
4. **Unauthenticated Admin Listing Create**: Unauthenticated `create` on `/website_apps/{id}` with `status: "published"`.
5. **Resource Exhaustion / ID Poisoning**: Document ID exceeding 128 characters or containing path-traversal characters (`../admin`).
6. **Draft Listing Scraping**: Public `list` query on `/website_apps` without `where("status", "==", "published")` filter when unauthenticated.
7. **Unauthorized Counter Manipulation**: Non-admin updating `website_apps/{id}` changing `downloadCount` by `+9999` instead of `+1`, or altering `name`/`iconUrl`.
8. **Immutable Field Tampering**: Updating `website_apps/{id}` with modified `createdAt` or `createdBy`.
9. **Spoofed Timestamp**: Creating `website_analytics/{id}` with a backdated `createdAt` not equal to `request.time`.
10. **Analytics Tampering**: Verified user attempting `update` or `delete` on `/website_analytics/{eventId}`.
11. **Array Flood Attack**: `website_apps` payload with `screenshots` array length `> 8` or `features` array length `> 20`.
12. **Self-Promotion to Admin**: Non-admin verified user attempting `setDoc` on `/website_admins/{ownUid}`.

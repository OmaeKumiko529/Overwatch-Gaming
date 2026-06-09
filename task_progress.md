# Bug Fixes & Code Optimizations

## Bugs Found & Fixed

### 1. JoinTeamPage.vue - `isUserInTeam` computed property (CRITICAL BUG)
- **Problem**: `isUserInTeam` calls `userService.getAllUsers()` which is async (returns Promise), but it's used synchronously in computed. The `.find()` on a Promise always returns `undefined`, so `isUserInTeam` is always `false`.
- **Fix**: Changed to use the Pinia auth store's `currentUser` and check `teamId` from the user object directly.

### 2. JoinTeamPage.vue - Uses old localStorage-based `auth` service
- **Problem**: Imports `auth` from `../services/auth.js` which is the old localStorage-based service, instead of the Pinia store.
- **Fix**: Changed to use `useAuthStore` from Pinia store.

### 3. JoinTeamPage.vue - `showJoinConfirmFromDetails` bug
- **Problem**: `closeDetailsModal()` sets `selectedTeam.value = null`, then `showJoinConfirm()` tries to use it.
- **Fix**: Save team reference before closing.

### 4. NotificationPage.vue - `authorName` async bug
- **Problem**: `userService.getUserById(uid)` returns a Promise but isn't awaited, so it always returns '未知用户' on first call.
- **Fix**: Restructured to use the preloaded cache properly and handle async lookup.

### 5. GeneratePage.vue - `const seedData` mutation
- **Problem**: `seedData` is declared as `const` at module level but mutated in `onMounted`.
- **Fix**: Changed to `let` and used reactive ref.

### 6. server/index.js - CORS invalid origin handling
- **Problem**: Returns `callback(null, false)` for disallowed origins, which Express treats as "no origin" instead of rejecting.
- **Fix**: Returns `callback(new Error('Not allowed by CORS'))`.

### 7. SearchPage.vue - Excessive URL updates on keystroke
- **Problem**: `watch(searchQuery)` calls `updateUrl()` on every keystroke, causing excessive router history entries.
- **Fix**: Added debounce to URL update.

### 8. NavBar.vue - Missing auth check for notification badge
- **Problem**: Notification badge shows even when not logged in (unreadCount > 0 from empty state).
- **Fix**: Added `v-if="auth.isLoggedIn"` check.

## Code Optimizations

### 1. JoinTeamPage.vue - Search reactivity
- Added `watch` on `searchQuery` to auto-filter as user types instead of requiring button click.

### 2. HeroesPage.vue - Role filter optimization
- Avoid re-fetching all heroes when changing role; filter client-side instead.

### 3. NotificationPage.vue - User cache improvements
- Better cache handling with fallback display names.

# Boardroom nickname onboarding

This package contains the mobile redesign for the root of the BuisnessManagment repository. It uses Firebase project `buisness-managment` and the existing Realtime Database. The already published AI & ML page is independent of this release.

1. Compare the candidate `database.rules.json` with the rules currently published in the Firebase console. Save the currently deployed rules and retain any production changes. The candidate adds UID-scoped anonymous student and inbox access and allows the three new foundation subjects to store lesson progress and practice answers.
2. In Authentication → Sign-in method, enable Anonymous. Keep Email/Password available for the separate administrator page.
3. Validate the merged rules in a Firebase Emulator or staging project. Verify that guest A can create and update its own record, that guest B cannot read or write guest A’s record or inbox, and that guests cannot write rankings or quiz rooms. Confirm that the administrator can open both existing student records and new nickname records.
4. Publish the validated Realtime Database rules. With an authenticated Firebase CLI, run `firebase deploy --only database --project buisness-managment` from the directory containing the supplied `firebase.json` and the validated rules file.
5. Publish the redesigned frontend to the existing GitHub Pages source after deploying the rules. Keep repository metadata, any Pages workflows, and any custom domain settings. Verify automatic student entry, optional display name saving, reload with the same UID, a second browser with the same display name, and administrator sign-in on the deployed site.

Returning students keep the anonymous UID stored by the Firebase SDK on their browser. Clearing browser data or changing browsers creates a new account. A nickname is display text and does not recover an account. Existing email-based progress remains in the database. Anonymous access does not migrate previous progress or enable shared leaderboard, battles, or campus-only announcements.

Local verification is summarized in README.md. Production and Firebase Emulator verification are pending.

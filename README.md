# Boardroom

Boardroom is an independent study portal for the first semester of Chitkara Business School’s BBA in Digital Science & Business Management.

## Publish on GitHub Pages

Extract the ZIP into the existing site's publishing directory so that `index.html` and `admin.html` sit at the same level as before. Commit the extracted files and push to the branch that Pages already publishes. No build step is required. Use the new release as the site contents. The previous app, game styles and handoff notes are obsolete. Keep repository metadata, Pages workflows and any custom-domain CNAME.

## Student and administrator access

Students create a separate Boardroom password with an exact `@chitkara.edu.in` email, open the Firebase verification email, and select **I verified my email**. The reset-password button sends a Firebase recovery email. The portal and database require a verified Chitkara password account. University mailbox ownership is the eligibility check. Firebase's standard password provider can create identities outside the portal, but the database denies them student access. GitHub Pages serves the static study files publicly.

Open `admin.html` and use the existing Firebase administrator account. The dashboard shows profiles that entered the portal, their last workspace visit, lessons they marked reviewed, and their latest recorded answer per question. Refresh to get a current snapshot. These are self-study measures. They do not constitute university grades.

## Firebase

The ZIP includes the Realtime Database rules and CLI configuration for project `buisness-managment`. The matching rules were published as part of this release. Anonymous authentication is disabled. A GitHub Pages push publishes the frontend only. A future change to the rules can be deployed separately using `firebase deploy --only database --project buisness-managment`.

The data model stores private per-student email, visit time, reviewed lessons and practice results under `students/{uid}`. The existing admin UID can read all profiles and publish to `announce`. The previous student data paths are closed. Lesson and practice keys in the rules match the released catalog. Extend them when adding lessons or questions.

## Course coverage

CULMS handouts and posted unit listings were checked on 17 November 2026. Each course links to its signed-in CULMS home for official material. New explanations and practice questions are Boardroom study aids. Data Visualization, Digital Reputation Management-I and Performing Arts display **Coming soon** while their handout and unit sections are empty.


# Boardroom

Boardroom is an independent study portal for the first semester of Chitkara Business School’s BBA in Digital Science & Business Management.

## Publish on GitHub Pages

Extract the ZIP into the existing site's publishing directory so that `index.html` and `admin.html` sit flat at the top level (no subfolders required). Commit the extracted files and push to the branch that GitHub Pages publishes. No build step is required. Keep repository metadata, Pages workflows and any custom-domain `CNAME`.

## Student and administrator access

Students create a dedicated Boardroom password with an exact `@chitkara.edu.in` email, open the Firebase verification email, and select **I verified my email**. The portal and database require a verified Chitkara password account. GitHub Pages serves the static study files publicly while user data is protected by `database.rules.json`.

Open `admin.html` and sign in with the authorized Firebase administrator account (`ADMIN_UID` in `firebase-config.js`). The overview shows live KPIs, recent student activity, subject coverage, and quick links. Opening any student email shows their activity timestamp, reviewed lessons, per-question practice status, private profile details, moderation tools, and the private owner-to-student inbox.

## Firebase

The release includes `database.rules.json` and `firebase.json` for project `buisness-managment`. The included database rules have been adapted to allow verified Chitkara Google sign-ins as well as verified campus email/password accounts. **They have not been deployed or tested against production in this package.** Anonymous authentication must remain disabled. Pushing to GitHub Pages updates the static frontend only; deploy the rules separately after a safe backup and Firebase Emulator validation.

## Course coverage

CULMS handouts and posted unit listings were checked on 17 November 2026. Each course links to its signed-in CULMS home for official material. New explanations and practice questions are Boardroom study aids. Data Visualization, Digital Reputation Management-I and Performing Arts display **Coming soon** while their handout and unit sections are empty, and include introductory self-test banks.

## Student features

- **Study library & tools**: Resume banner, subject mastery progress bars, quick concept search across all loaded lessons, Pomodoro focus timer (with per-UID session tracking), and 26 rotating study facts (20s cycle with Pause/Resume and Next controls).
- **Self-tests & recall**: Randomized 5, 10, or 15-question practice sessions with formatted Python code blocks, mistake review, flashcards, written rubrics, case studies, and video links.
- **XP, profiles & leaderboard**: Save a username (and optional cropped avatar, gender, and study goal) to appear on the top-50 live leaderboard. First-time correct answers award 10 XP; saving a username also syncs unclaimed XP from earlier correct self-test answers.
- **Quiz battles (2–8 players)**: Host or join via 12-character room code or invite link, live 5-minute countdown timer, deterministic 5-question rounds, and post-battle answer explanations.

## Owner console (`admin.html`)

- **Overview & Directory**: Live class KPIs, filterable student search (`All`, `With username`, `Needs username`), individual progress inspection, username/photo moderation, and private inbox messaging.
- **Announcements**: Create, edit, delete, target by subject (`All subjects` or specific course), and pin/unpin announcements.
- **Battle rooms & Course updates**: Inspect active/completed rooms, delete rooms, and publish per-subject update banners.

## Voice Notes Reader and spoken study

Open any full lesson and use **Listen to this lesson** to play the **entire** lesson, your personal lesson notes, or highlighted text. The audio player offers Play, Pause/Resume, Stop, speed controls (0.75×–1.7×), and a choice of available English device voices, with the current spoken segment and playback progress displayed. The **Play lesson** shortcut starts reading the full lesson.

**Dictate my notes** converts spoken words to editable text in the private lesson notes area; the normal autosave continues to work. In **Study buddy**, dictate brain-dump notes or questions, hear the notes and questions, and listen to matched answers from the existing verified practice bank. The companion is **a search/matching tool, not a cloud AI chatbot**; its results and the reader do not fabricate syllabus facts. Notes are stored locally per account on the current browser, not synchronized across devices. The audio reader saves voice/speed preferences on the device.

Audio uses the browser's **Web Speech API** (speech synthesis); voice dictation uses `SpeechRecognition` or `webkitSpeechRecognition`. Capability and voices vary by OS and browser, and some browsers use provider cloud processing for recognition or voice synthesis. It requires user interaction and microphone permission for dictation. Supported controls degrade to readable/editable text when Web Speech APIs are unavailable. Test voice features on the actual target browsers and devices before release; automated page tests cannot prove microphone permission or audible output.

## Extra deployment checklist for this redesign

- Enable the **Google** provider in Firebase Authentication and allow the site's domain in Authorized domains. Hosted-domain hints are not a security boundary.
- Deploy and review the included `database.rules.json` before allowing student data or Google authentication. Confirm the rules permit only verified campus accounts (and authorized administrators), and review leaderboard permissions so students cannot impersonate peers or arbitrarily edit XP.
- Don't enable anonymous authentication. Don't expose administrator service credentials in client files. Preserve existing live database data when updating rules.
- The uploaded source and redesign retain the course content and Firebase project identifiers; this package has **not** changed the deployed Firebase project or production database.

# Boardroom study portal

The portal opens directly to the study library. Firebase anonymous authentication runs in the background. Students can set a display name inside the app. If Firebase Auth or Realtime Database is unavailable during startup, the library opens with progress saved on the current browser. Browser-only and Firebase progress are stored separately.

## Study materials

All seven subjects have notes, recall cards, random practice, timed practice and mistake review. New foundation materials for Data Visualization, Digital Reputation Management-I and Performing Arts are original study aids. Their official unit outlines have not been verified. The dedicated AI & ML exam-prep page is available at `AI-ML-Exam-Prep.html`.

## Preview and publish

Serve this folder over HTTP. For example, use `ruby -run -e httpd . -p 8767 -b 127.0.0.1` and open `http://127.0.0.1:8767/`.

Use the existing `kiratveersinghralhan-hue/BuisnessManagment` repository on `main`. See [Firebase deployment notes](ANONYMOUS-DEPLOYMENT.md) for the candidate rules and provider setup. Those changes have not been applied to production. Administrator access is at `admin.html`. Existing email-based records retain their original account IDs.

## Verification

Chromium tested the library, planner, optional display name and exam prep at eight widths between 320 and 1920 CSS pixels. The tests opened the notes and completed a timed-practice question with results in each subject. They also exercised supplemental exercises and recall cards, automatic entry and UID reuse using Firebase test doubles, and direct entry with browser-only storage when Firebase sign-in failed. Production Firebase and physical devices were not tested.

# Claude guidance — docs/ideas

The documents in this folder are **unreviewed drafts** and may contain hallucinations. Do not treat them as authoritative specifications.

## Before implementing anything from these docs

- Verify third-party API endpoints against official documentation (e.g. Liftosaur REST API, Garmin Connect IQ, MediaPipe)
- Confirm that libraries named here exist and support the claimed functionality
- Flag any technical claims that seem uncertain rather than implementing them blindly
- Treat open questions in the PRD as unresolved — don't pick an answer silently

## What these docs are good for

- Understanding the intent and direction of the project
- Getting a feel for the data model and feature scope
- Starting points for discussion — not final decisions

## What to watch for

- The Liftoscript format examples may be fabricated — verify against the real Liftosaur repo
- API routes like `GET /api/v1/history` and `PUT /api/v1/programs/current` need real-world verification
- Library choices (NativeWind, react-native-ble-plx, etc.) should be checked for current maintenance status and Expo SDK 51+ compatibility

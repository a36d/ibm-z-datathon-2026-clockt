# Clockt Frontend

Clockt is a React and Electron productivity assistant for identifying repeated work and suggesting ways to save time.

## Run locally

```sh
npm install
npm run dev
```

To run the Electron desktop shell with Vite:

```sh
npm start
```

The frontend uses React Router for these screens:

- `/` — prioritized AI suggestions and recently engaged conversations
- `/analytics` — activity and application analytics
- `/activities` — activity entry and analysis
- `/recommendations` — recommendation list
- `/settings` — suggestion preferences, account personalization, and local-data cleanup
- `/account` — sign-up/sign-in preview

## Local data and backend

The current dashboard suggestions, conversations, preferences, and profile name/email are saved in browser local storage under `clockt:workspace`. Interacting with an unaccepted suggestion starts a 24-hour cleanup timer. Automatic cleanup can be toggled in Settings; the manual cleanup action removes expired tips and conversation history while retaining unexpired suggestions and preferences.

Activity and analytics requests use the FastAPI service configured with `VITE_API_URL`, defaulting to `http://127.0.0.1:8000`. The account screen is a frontend preview only: it does not authenticate against FastAPI, transmit passwords, or save passwords. Connect it to the backend’s secure authentication endpoints before using it for real accounts.

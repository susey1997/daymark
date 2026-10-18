# Daymark

Daymark is a personal productivity dashboard for tasks, projects, habits, calendar events, reminders, and focused work sessions. It works locally without an account; optional cloud sync uses Supabase Auth and a private database table.

## Run locally

1. Open `index.html` in a current browser (double-click the file, or drag it into a browser window).
2. Your information is saved automatically in that browser on this device.

For more consistent browser behavior, serve this folder with any local static file server and open its local address. No app installation or compilation is needed.

## Publish free with GitHub Pages

1. Create a new **public** repository on GitHub named `daymark`. Leave the options to add a README, `.gitignore`, or license unchecked so the repository starts empty.
2. Download and unzip `daymark-github-pages.zip` from the provided package.
3. In the new repository, choose **Add file → Upload files** and upload `index.html`, `styles.css`, `app.js`, and `README.md` from the unzipped folder. Commit the upload to the `main` branch.
4. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, and save.
5. Wait a few minutes. The published address will appear on the Pages settings screen, usually `https://YOUR-USERNAME.github.io/daymark/`.

The repository must be public for GitHub Pages on GitHub Free. This publishes the app source code. It does not publish your personal tracker data: that stays in each browser’s local storage. Avoid putting private information in the source files.

## What’s included

- A today dashboard with due tasks, progress, habits, calendar, and upcoming schedule
- Project-linked tasks with due dates, times, priorities, repeat options, and reminders
- Recurring daily and weekly tasks that create their next occurrence when completed
- Habit check-ins with weekly history and streaks
- A month calendar for scheduled events and tasks
- Focus, short break, and long break timer with adjustable durations and session history
- Search across tasks, habits, and projects
- Responsive layout for desktop and mobile screens

## Storage and deployment

Without cloud sync, data stays in that browser on that device. When cloud sync is configured and you sign in, Daymark keeps a local copy and synchronizes your tracker data through your private account.

## Sync across devices

Cloud sync is connected for the GitHub Pages version. Open **Sync** in the top bar and create an account with an email address and password. If you receive a confirmation email, confirm your address, return to Daymark, and sign in. On each other device, open the same Daymark address and sign in with the same account.

Daymark keeps a local copy and synchronizes projects, tasks, habits, events, and focus sessions with your private account. Row-level security restricts each account to its own data. The browser app uses only the public publishable key; database access is protected by sign-in and row-level security. Never put a service-role or secret key in the site.

The Supabase project is on the free tier. Free projects may pause after a period of inactivity; opening Daymark may then take a little longer while the project wakes up. See the official [Supabase Auth](https://supabase.com/docs/guides/auth) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) documentation.


# Daymark

Daymark is a personal productivity dashboard for tasks, projects, habits, calendar events, reminders, and focused work sessions. It is a static web app with no account, subscription, build step, or external service requirement.

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

Data is stored in the browser’s local storage. It remains available when you reopen Daymark in the same browser, but is not synced across devices and can be cleared by browser data cleanup. For a basic static deployment, publish this folder to any static web host. A future multi-device version would need a hosted database and sign-in.

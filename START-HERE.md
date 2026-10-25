# Sidequest Connect — install in your existing project

This is an add-on, not a replacement app. It adds a Connect ✦ button to your current header and a separate dark planning room. Your current script.js, styles.css, feed and planner are preserved.

## Install (Windows / VS Code)

1. Unzip this download.
2. Copy its files into your existing Sidequest folder, **beside server.mjs and index.html**. Do not put them inside another connect-feature folder. If you already have tests, merge the tests folder.
3. Stop your running server with Ctrl+C in the VS Code terminal.
4. Run:

```powershell
node install-connect.mjs
node server.mjs
```

5. Open your usual website, refresh, and click **Connect ✦** at the top.

No npm install needed. Requires Node 24 (you already have it). The installer makes server.mjs.before-connect and index.html.before-connect backups and can be rerun. It adds its handler ahead of your existing routes, without changing your server's port, host address, or API planner.

If node isn't recognized, use your existing working Node command, e.g.:

```powershell
& "C:\Program Files\nodejs\node.exe" install-connect.mjs
& "C:\Program Files\nodejs\node.exe" server.mjs
```

If the installer says it cannot recognize your server, it stops before modifying your server or index. Share server.mjs for the small hook adjustment. Do not share .env.

## The 90-second demo

1. In your normal browser, Connect → create a connection named **A little creative break**.
2. Add your contribution: **drawing**, **virtual**, **30 minutes**, **$0**. Save.
3. Copy the invitation. Open it in an **Incognito / InPrivate window**, and join with a different name. A second tab in the same browser shares the same participant key, so use a private window.
4. In that window contribute **music**, **virtual**, **20 minutes**, **$0**. Save.
5. Return to the host window. Updates appear within three seconds. Choose a future start time and meeting details, then **Plan with Meta**.
6. The proposal explains each person's contribution. Each browser independently clicks **I'm in**.
7. Once both accept, **Add to calendar** downloads an .ics file. Open it to import. **Save a copy to My plans** puts a personal copy in that browser's existing feed.

Pitch: **“Sidequest turns everyone's small contributions into one shared plan. AI helps find the overlap; people make the final choice.”**

## Meta API

The add-on reads your existing .env next to server.mjs:

```dotenv
MODEL_API_KEY=your_existing_key
```

Do not duplicate, commit or paste your real key into frontend JavaScript. Restart after environment changes. It calls Meta's chat-completions endpoint server-side with muse-spark-1.3; META_MODEL optionally overrides that model. The Meta button needs credits and model access. A separate **Test with a labeled sample** button works without credits, and is clearly identified as an example rather than AI. API errors stay visible; it never silently switches to a sample.

The AI receives the room goal and saved contributions (names, interests, wishes, mode, time and budget). Room members see these contributions too. AI output is checked for each participant, compatible mode, and the lowest declared time/budget caps. These checks cannot guarantee that an AI's suggested real-world activity is suitable or correctly priced; the group still reviews it.

## What is real, and what is still prototype

- Room membership, contributions, proposals and confirmations are stored on your Node server. A second browser gets the same shared room; it does not rely on fabricated participants.
- Each browser has its own secret participant key. A participant can edit only their contribution and confirmation. Only the host generates proposals. Editing a contribution, joining/leaving or generating another proposal clears prior confirmations.
- Invitation links are bearer access: **anyone with the link can join and then read the room's contributions**. Names are self-entered, not authenticated identities or verified friends. This is not the feed's close-friends permission system. Don't use sensitive information in a hackathon demo.
- A localhost link works only on the same computer. Use Incognito for the demo. Friends on other devices need the same reachable hosted server; public hosting is not installed by this add-on. Keep the server running.
- Rooms expire from access after 48 hours, allow up to eight participants, and are stored in .sidequest-connect/rooms.json (added to .gitignore). Expired stored records are purged when another room is created. The host can end a room and delete its record sooner.
- This is single-server JSON storage for a small demo. Production needs accounts, stronger access controls and moderation, HTTPS, a database, and durable hosting. Do not run multiple Node processes against the same room file.
- Confirmed calendar exports and personal feed copies are snapshots. Subsequent edits do not update calendar imports or other copies. The chosen start time is a proposal; there is no live calendar availability lookup.
- Existing feed posts, profiles and close-friends options keep their existing behavior. Connect does not add general user accounts or messaging.

## Validation

```powershell
node --test tests/connect.test.mjs
```

Five tests cover the shared two-participant flow, permissions, constraint validation, confirmation resets, calendar gating, mocked Meta payload and stale-result rejection, and installer idempotence. The Meta response is mocked in automated tests: live API behavior still needs your key and credits. Syntax and route checks passed. Automated browser/visual checks were unavailable in the build environment; run the demo above before judging.

## Undo

Stop the server. Restore server.mjs.before-connect over server.mjs and index.html.before-connect over index.html. Restart normally. This removes the integration while keeping your old feed files. The add-on files can remain unused or be removed separately.

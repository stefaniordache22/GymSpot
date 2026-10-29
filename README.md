# GymSpot

A working local browser app based on the GymSpot Figma design. Node.js 22+ and VS Code are available on this machine.

## Run

Open `GymSpot.code-workspace` in VS Code. In **Run and Debug**, select **GymSpot: Run app** and press **F5**. This starts the server (or reuses an existing GymSpot server), waits for it to be ready, and opens your Windows default browser automatically. If VS Code asks whether you trust this folder, allow workspace trust for this project to enable running tasks. Pressing Stop ends the browser launcher session; the server task stays available for the next launch.

You can also double-click `Start-GymSpot.cmd`, or run `powershell -NoProfile -ExecutionPolicy Bypass -File ./start.ps1` in a terminal and open http://localhost:5173. `pnpm dev` also starts it if Node is on PATH. The launch script finds the existing Node runtime on this machine, so no separate Node installation is needed.

Install dependencies with `pnpm install`. If pnpm is not on PATH on this machine, use `C:\Users\STEFAN\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install`.

## Working features

- Navigate Home, Discover, Chat, and Profile with a responsive layout.
- Log workouts and view real weekly totals and charts. New accounts start at zero.
- Filter training partners by interests and level. Browse gym businesses separately on the map without tracking or plotting people.
- Opt in to live chat, find other members on your GymSpot server, and exchange persistent messages across devices. Demo conversations remain clearly labeled.
- Schedule sessions, share the plan in live chat, and mark sessions complete to log activity.
- Edit name, age, training level, gender, gym, and interests; choose light, dark, or system appearance.
- Profile, messages, sessions, and workouts persist in browser local storage.

## Apple Health and iOS menus

Profile → **Import Health export** accepts Apple Health's `export.xml` or `export.zip`. In Apple's Health app, tap your profile picture → **Export All Health Data**, save the ZIP to Files, then select it in GymSpot. The import reads only workout entries, updates the activity charts, and deduplicates repeat imports. Files are processed locally and are never uploaded. Exports larger than 128 MB are rejected to keep phone memory use bounded.

The native iOS app includes a read-only HealthKit bridge and shows **Connect / sync Apple Health** in Profile. Direct sync is unavailable in Safari or Android. The Xcode project is at `ios/App/App.xcodeproj`; build/sign/install instructions are in `native/ios/README.md`. Native Swift compilation, the permission prompt, and on-device Health reads have not been verified on this Windows computer.

Dropdown controls open animated iOS-style sheets, support keyboard navigation and Escape/Done dismissal, and respect Reduce Motion. These are web animations; Apple's exact system menu animations are controlled by iOS and aren't exposed to websites.

Existing profiles and activity migrate from the old Spotter storage key when saved. The current app layout and color styles were retained. Figma edits were not overwritten: the Figma connector reached its account tool-call quota, so the latest edited design could not be read or updated. Design synchronization remains pending access to that file.

## Open on iPhone or Android

Keep the PC running GymSpot and connect your phone to the same router / Wi-Fi. On this PC the current phone URL is **http://192.168.0.54:5173**. Open it in Safari on iPhone or Chrome on Android. The PC can use Ethernet while the phone uses Wi-Fi, provided both are on the same local network. `server.mjs` prints the current network addresses each time it starts; the IP may change.

On iPhone, use Safari's Share menu → **Add to Home Screen** to add a launcher. The manifest and home-screen icons are included. The server must stay running for this HTTP LAN version. On Android, use the browser menu to add a home-screen shortcut. Full install/offline capabilities on a phone require serving the app over HTTPS; service workers are intentionally disabled on plain HTTP LAN addresses. Offline shell loading is tested on the secure localhost development origin.

The Windows firewall rule **GymSpot local phone testing** allows only TCP 5173, only from the local subnet, and only on Private networks. To enable it again, run `Enable-PhoneAccess.ps1` as administrator. Guest Wi-Fi / client isolation may prevent phones from accessing PCs even with that rule.

The browser app works on both phone platforms; these are not native App Store or Play Store builds. Settings are saved separately on each phone/browser.

## Mobile verification

`node mobile-test.cjs` runs touch flows in Playwright WebKit with iPhone emulation and Chromium with Android emulation against the HTTP LAN address. To use another address, set `SPOTTER_TEST_URL`. Install WebKit for the tests with `PLAYWRIGHT_BROWSERS_PATH` set to this project's `.playwright` folder and run `pnpm exec playwright-core install webkit`.

Verified: logging workouts, persistence, light/dark themes, partner filtering, session creation on an insecure LAN origin, chat, resized chat viewport, landscape, 320px width, manifest/icons, and offline shell loading on localhost. Actual on-device keyboard behavior and Safari/Chrome home-screen installation still need device verification; desktop engine emulation cannot reproduce all phone OS behavior.

Safe-area styling follows [WebKit's iPhone guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/). Offline availability follows the browser's [secure-context requirements](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

## Google Maps

In **Profile → Google Maps**, enter your Maps JavaScript API key and optionally a Map ID, then choose **Save Maps settings**. Open Discover to load the map. The key is stored on that device; it is not posted to the chat server. If a map has already loaded with an old key, refresh the page after saving a new one. **Remove saved Maps key** removes the device override.

Alternatively, copy `.env.example` to `.env`, set `GOOGLE_MAPS_API_KEY` (and optionally `GOOGLE_MAPS_MAP_ID`), and restart the server to configure Maps for all browser clients. Enable **Maps JavaScript API**, **Places API (New)**, and billing in Google Cloud. Restrict the key to those APIs and your website addresses, including `http://localhost:5173/*` and your actual phone URL, currently `http://192.168.0.54:5173/*`. See [Google's API key guidance](https://developers.google.com/maps/api-security-best-practices).

Discover → **Find surrounding gyms** searches a city or area you type. You can also pan/zoom and choose **Search this map area**. Markers and result cards represent gym businesses returned by Google's Places API; no member or user pins are created. The map never requests device GPS access. The chosen browse area stays local to the device and is sent to Google only to perform the search; it is not included in chat profiles. See [Google's gym/place search API](https://developers.google.com/maps/documentation/javascript/place-search).

Previous shared gym-coordinate fields are removed from local profile storage when the app opens and from the server database on startup. The server ignores coordinates submitted in profile requests and never returns them in the member directory. Existing preferred gym names remain part of an explicitly opted-in chat profile; they are not plotted on the map. Partner filtering does not reset the map or automatically trigger another Google search. Tests use mocked Google results; real gym availability and Google API authorization require your enabled key.

## Live chat

Open **Chat → Join live chat** on both devices. Each browser/device receives its own chat identity. The shared directory shows other people who have opted in on the same server; select one to send messages. Messages are polled approximately every 2.5 seconds while the app is visible, and history survives server restarts. Saving a session plan also sends it to a live partner. Drafts remain in place while new messages arrive. Offline/failed sends show an error and retain the message for retry.

Only your name, preferred gym name, training level, and interests are shared. Coordinates, chosen map search areas, age, gender, workouts, and Apple Health data are not shared in chat profiles. Shared profiles and censored messages are stored in the protected `.gymspot-data/chat.json` file, which is excluded from Git and cannot be downloaded through the static server. Session tokens are stored only as hashes on the server. Use **Delete shared chat profile** to remove your profile and related server conversations.

Native iOS builds can specify a reachable HTTPS backend under **Chat server address**. The current local server is for private-network testing and uses per-device identities, not email/password accounts or account recovery. Internet deployment and production authentication are not configured.

## Language filtering

Chat messages, profile names and gym names are censored in the app and again by the server. Existing local text is also filtered when displayed. The shared vocabulary in `moderation.js` covers English slurs/profanity and a selection of Romanian profanity, with handling for common leetspeak, spaced spelling, repeated letters, accents, zero-width characters, and some lookalike characters. Whole-word boundaries avoid ordinary words such as “class” and “assistant.” Extend the vocabulary for additional languages or missed expressions; this dictionary is not a complete abuse-detection system.

## Scope

This is a functional private-network app with a persistent shared chat backend and per-device chat identities. It supports opted-in members using this server. The preloaded Maya, Radu, and Emma profiles are demo examples; they are not real recipients. A public production service still needs hardened account authentication/recovery, deployment over HTTPS, abuse reporting/blocking, and operational monitoring.

Navigation SVGs come from the editable Figma file; Inter is installed locally through @fontsource/inter. No CDN fonts are required.

## Verification

`node smoke-test.cjs` tests core user flows with installed Microsoft Edge through Playwright. Screenshots are saved in `test-results/`. Run `pnpm check` for syntax checks. Google Maps integration follows [Google's loading and marker documentation](https://developers.google.com/maps/documentation/javascript/load-maps-js-api); live map verification requires your key.

`node backend-test.mjs` verifies server censorship, authorization, private-conversation isolation, send idempotency, history persistence, deletion, and rejection/cleanup of profile coordinates. `node features-test.cjs` verifies two-way live chat, profile moderation, HTML safety, Maps setup, gyms-only markers, manual city/visible-area search, empty results, absence of GPS calls, and local coordinate cleanup with a mocked Google loader.


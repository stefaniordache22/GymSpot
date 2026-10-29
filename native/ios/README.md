# GymSpot native Apple Health integration

The browser app cannot access HealthKit. This Capacitor iOS wrapper includes a read-only HealthKit plugin, permission usage text, and entitlement. A Mac with Xcode is required to compile, sign, and install it. Windows cannot validate the Swift build or Apple permission sheet.

On a Mac:

1. Install Node 22+, pnpm, and the Xcode version required by Capacitor 8.
2. Run `pnpm install`, then `pnpm build`.
3. If `ios/` is not present, run `pnpm exec cap add ios`.
4. Run `node scripts/configure-ios.mjs`, then `pnpm exec cap sync ios`.
5. Run `pnpm exec cap open ios`. Select your signing team and a unique bundle identifier. Confirm **HealthKit** is enabled under Signing & Capabilities.
6. Install on your physical iPhone. Open Profile → **Connect / sync Apple Health** and approve read access to workouts.

The plugin imports workouts from the last 30 days. It never writes Health data or requests heart rate, location, or other unrelated health types. Permissions are requested only after tapping the button. Empty query results cannot distinguish denied read access from no data; the UI says so. Repeated native syncs deduplicate by HealthKit workout UUID. Export imports deduplicate by export identifiers; do not combine the same workouts from both native sync and export import, because the two formats use different identifiers.

Health data remains in the device's app storage and contributes to local activity charts. It isn't included in partner profiles or messages. Exercise counts do not claim to reproduce Apple's Activity rings. A real HealthKit permission and data-read check on an iPhone is required before shipping.

References: [Capacitor custom iOS plugins](https://capacitorjs.com/docs/ios/custom-code), [Apple HealthKit authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data).

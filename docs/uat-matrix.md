# UAT matrix (D-36 / Phase 5 verification)

Owner: Илья Р. (физический real-device тест — Claude не может execute эти шаги).

## Required devices

| Device          | Browser                    | Status | Tester | Date | Notes |
| --------------- | -------------------------- | ------ | ------ | ---- | ----- |
| iPhone iOS 17+  | Safari                     | [ ]    |        |      |       |
| iPhone iOS 17+  | Yandex Browser (если есть) | [ ]    |        |      |       |
| Android 14+     | Chrome                     | [ ]    |        |      |       |
| Android 14+     | Yandex Browser             | [ ]    |        |      |       |
| Desktop Chrome  | latest stable              | [ ]    |        |      |       |
| Desktop Firefox | latest stable              | [ ]    |        |      |       |
| Desktop Safari  | latest stable              | [ ]    |        |      |       |
| iPhone iOS 17+  | VK in-app webview          | [ ]    |        |      |       |
| Android 14+     | VK in-app webview          | [ ]    |        |      |       |
| iPhone iOS 17+  | Telegram in-app webview    | [ ]    |        |      |       |
| Android 14+     | Telegram in-app webview    | [ ]    |        |      |       |

## Optional devices

| Device         | Browser | Status | Tester | Date | Notes |
| -------------- | ------- | ------ | ------ | ---- | ----- |
| iPad iOS 17+   | Safari  | [ ]    |        |      |       |
| Android Tablet | Chrome  | [ ]    |        |      |       |

For each device, complete all 10 (or 12 incl. VK/TG) flows from `uat-flows-checklist.md`. Tick `[X]` when all flows pass on that device.

## Found bugs (track here)

| #   | Device | Flow # | Severity | Description | Status |
| --- | ------ | ------ | -------- | ----------- | ------ |
|     |        |        |          |             |        |

Severity: P0 (block merge) / P1 (hot-fix post-merge) / P2 (v1.x backlog) / P3 (cosmetic).

## Sign-off

- [ ] All required devices passed (or P0 issues escalated and fixed)
- [ ] VK/TG flows pass with timer-fallback (Pitfall 7 acceptable degradation)
- [ ] No P0 unresolved
- Tested by: \***\*\_\_\*\*** Date: \***\*\_\_\*\***

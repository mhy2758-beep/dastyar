---
name: Expo SQLite web bundling
description: Expo SDK 54 SQLite setup detail for web-compatible Metro bundles.
---

Expo SQLite 16 can bundle for web in this workspace only when Metro includes `wasm` in `config.resolver.assetExts`.

**Why:** Without that asset configuration, Metro fails to resolve `expo-sqlite/web/wa-sqlite/wa-sqlite.wasm` during web export even though the native Android bundle is compatible.

**How to apply:** Keep the Metro `.wasm` asset extension whenever Expo SQLite is used in this app. Native Android/iOS still require no additional SQLite setup beyond the Expo package.
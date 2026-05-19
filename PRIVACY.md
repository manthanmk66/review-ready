# Privacy Policy — Review Ready

**Last updated:** 2026-05-19

## Summary

Review Ready is a Claude Code plugin that runs entirely on your machine. **It does not collect, transmit, store, or share any user data, project data, or telemetry.**

## What the plugin does

Review Ready reads files in the project directory you are working on (such as `app.json`, `Info.plist`, `AndroidManifest.xml`, `package.json`, and source code files) to check them against Apple App Store Review Guidelines and Google Play Developer Policy. All analysis happens locally inside your Claude Code session.

## What the plugin does NOT do

- **No network requests.** The plugin does not connect to any external server, API, or service.
- **No telemetry.** The plugin does not report usage, errors, scan results, or any other information back to the author or any third party.
- **No data collection.** The plugin does not gather personal information, project metadata, source code, or credentials.
- **No data storage.** The plugin does not write any data outside the files it is explicitly invoked to edit (and only when you, the user, approve those edits).
- **No third-party services.** The plugin has no third-party dependencies at runtime beyond what Claude Code itself uses.

## What Claude Code sends to Anthropic

When you use Review Ready, your interactions with the Claude Code agent (including any project file contents Claude reads while running the plugin's skills) are processed by Anthropic's Claude model per Anthropic's standard terms. This is governed by Anthropic's own privacy policy, not by this plugin.

See: [Anthropic Privacy Policy](https://www.anthropic.com/privacy)

## Open source

The plugin's full source code is publicly auditable at:
https://github.com/manthanmk66/review-ready

If you find any behavior that contradicts this privacy policy, please open an issue immediately.

## Changes

If the plugin's data handling ever changes, this file will be updated and the change noted in `CHANGELOG.md`. Reinstalling the plugin will pull the latest version.

## Contact

For privacy questions, open an issue at:
https://github.com/manthanmk66/review-ready/issues

# Changelog

## 1.5.0 - 2026-08-16

- Fixed user-added prompts being reset to the four seed prompts after a DSH restart. The desktop app serves the Web UI on a fresh port each launch, which isolates browser `localStorage` by origin; the prompt library is now mirrored to a durable local file (`$DSH_HOME/dsh-prompt-manager/prompts.json`) and restored from it when the browser copy is missing.
- Fixed the primary "新建"/"New" button blending text into its background in both light and dark themes. It now uses the DSH button fill and foreground tokens instead of the non-inverting `brand-primary-invert` token, and the picker check mark follows the same fix.

## 1.4.1 - 2026-08-15

- Kept mouse-wheel and touchpad scrolling inside the prompt picker instead of scrolling the conversation behind it.
- Contained overscroll at both ends of the prompt list so the background remains still while the picker is open.

## 1.4.0 - 2026-08-15

- Rebuilt the composer picker as a compact menu anchored directly above the Prompts control, matching DSH's model menu behavior.
- Added multi-select injection so a session can use several ordered prompts at once and remove them independently.
- Migrated existing single-prompt browser records automatically and preserved prompt-set inheritance across conversation branches.
- Replaced fixed success-green injection styling with DSH theme tokens so active states follow the selected theme color.
- Removed the redundant Done button from the always-visible Settings library.

## 1.3.0 - 2026-08-15

- Moved prompt activation into a compact control inside the composer tool row, beside the access-mode control.
- Added a searchable composer popup for selecting, switching, and removing the current session prompt.
- Removed Inject actions and active badges from Settings so the prompt library is clearly management-only.
- Made forked sessions inherit the nearest ancestor prompt and show that inherited state in the composer.
- Added persistent per-session disable overrides so removing an inherited prompt remains effective after restart.

## 1.2.0 - 2026-08-15

- Changed prompt selection from inserting text into the composer to injecting it as a session-level system prompt.
- Added an active-prompt status bar above the composer with one-click removal and retry states.
- Added Inject actions and active-state badges to Prompt Manager settings.
- Kept injections isolated by session and restored them after a DSH restart from browser-local state.
- Added loopback-only mutation protection, same-origin checks, input limits, and Host regression tests.
- Escaped `{{placeholder}}` pairs so user templates cannot accidentally trigger DSH system-prompt variable errors.

## 1.1.0 - 2026-08-15

- Added Chinese and English interfaces that follow the DSH language setting.
- Added JSON backup import and export with merge and replace modes.
- Added favorites, usage-aware ordering, and both `/提示词` and `/prompt` aliases.
- Added schema validation, legacy-data migration, storage failure warnings, and reliable cross-tab clearing.
- Improved keyboard, mobile, focus, and touch accessibility.
- Fixed whitespace handling in slash-menu descriptions.
- Added core regression tests and official DSH bundle metadata.

## 1.0.0

- Initial prompt library, search, editing, clipboard copy, and `/提示词` insertion.

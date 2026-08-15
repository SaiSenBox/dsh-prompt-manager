# dsh-prompt-manager

[中文](./README.md)

A small personal prompt library for DeepSeek Harness Web.

I kept rewriting the same instructions across conversations—how to review code, what tests should cover, or how a weekly update should be structured. Keeping them in a separate notes app worked, but broke the flow. This plugin keeps those prompts inside DSH and makes them available with a quick `/prompt`.

## What it does

- Create, edit, delete, and search prompts from **Settings → Prompt Manager**.
- Favorite the useful ones; ordering also learns from use count and recency.
- Open the prompt list with `/prompt` or `/提示词`, or search directly with `/keyword`.
- Use the **Prompts** control inside the composer tool row. Its compact menu opens against the control and lets you search, select multiple prompts, or remove them independently.
- Once active, the control shows the prompt name. Branches created from that session inherit the prompt and show the same state.
- Export the library as a JSON backup, then import it by merging or replacing.
- Follow DSH's Chinese or English language setting.
- Keep all prompt data in the current browser. The plugin does not upload it.

Four editable examples are included on first use.

## Install

The recommended installation uses DSH's plugin command and the npm package:

```powershell
dsh plugin --profile web add dsh-prompt-manager
```

Restart DSH Web after installation.

For local source development, run this from the project directory instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

The script copies the plugin to `$DSH_HOME/local-plugins/dsh-prompt-manager`, adds it to the Web profile, and safely updates `cordis.patch.yml`.

## Use

1. Open **Settings → Prompt Manager** in DSH Web. This page is only for creating, editing, organizing, and backing up prompts.
2. Choose **New**, then add a title, tags, and the prompt body. `{{placeholders}}` remain literal text and cannot be mistaken for DSH's internal variables.
3. Return to the chat box and click **Prompts** beside the access-mode control, then search for and select one or more prompts.
4. The control now shows the active prompt name or count. Open it again to add more or remove prompts independently. They apply as system instructions and are not posted as chat messages.
5. You can also type `/prompt`, `/提示词`, or `/keyword` for quick selection. The slash token disappears after a pick.

Use `Ctrl + Enter` (`⌘ + Enter` on macOS) to save while editing.

## Backups and privacy

Prompts are stored in browser `localStorage` under `dsh-prompt-manager.prompts`. Active per-session prompt sets are stored under `dsh-prompt-manager.session-injections`. That means:

- tabs in the same browser stay in sync;
- exporting is recommended before clearing site data, changing browsers, or switching the address used to open DSH;
- **Merge** keeps local entries and lets matching IDs from the backup win;
- **Replace** replaces the whole library with the backup.

The system-prompt section itself lives only in the current DSH process. After a DSH restart, the Web client restores it for sessions that still exist using browser-local state. A fork inherits the nearest ancestor prompt set but can add or remove individual prompts locally. By default, only the local machine's Web UI can change injection state.

Imported and stored data are validated. If data is damaged or the browser refuses a write, the UI reports it instead of silently claiming success.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```

The plugin and its profile registration are removed. Browser-local prompts are left intact.

## Development checks

```powershell
npm run check
npm test
npm run pack:check
```

## License

[MIT](./LICENSE) © 2026 SaiSenBox

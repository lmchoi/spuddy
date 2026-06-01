# Maestro cheat sheet

## Flow structure

```yaml
appId: com.mchoi.spuddy
---
- launchApp
- tapOn: "Button"
- assertVisible: "Text"
```

`appId` + `---` separator, then a flat list of commands. Subflows omit `appId`.

## Commands used in this project

| Command | Usage |
|---|---|
| `launchApp` | `- launchApp` or `- launchApp: { clearState: true }` |
| `tapOn` | `- tapOn: "Label"` or `- tapOn: { text: "Label", id: "res_id" }` |
| `inputText` | `- inputText: "some text\nwith newlines"` |
| `assertVisible` | `- assertVisible: "Text"` |
| `assertNotVisible` | `- assertNotVisible: "Text"` |
| `waitForAnimationToEnd` | `- waitForAnimationToEnd: { timeout: 10000 }` |
| `takeScreenshot` | `- takeScreenshot: my-name` |
| `back` | `- back` |

## Other commands you'll likely need

| Command | Usage |
|---|---|
| `scrollUntilVisible` | `- scrollUntilVisible: { text: "Item" }` |
| `hideKeyboard` | `- hideKeyboard` (add before assertions when keyboard is open) |
| `extendedWaitUntil` | `- extendedWaitUntil: { visible: { text: "Done" }, timeout: 5000 }` |
| `runFlow` | `- runFlow: { file: flows/sub.yaml, variables: { key: value } }` |

## Selectors

Prefer stability order: `id` > `text` > `index` (avoid index — fragile).

```yaml
- tapOn:
    text: "Save"        # visible label
    below:
      text: "Section"   # relative position when label isn't unique
```

State filters: `enabled: true`, `checked: true`, `focused: true`

## Gotchas

- **Element not found** → use `extendedWaitUntil` or `scrollUntilVisible`
- **Keyboard blocking assertion** → add `hideKeyboard` first
- **Animation timing** → add `waitForAnimationToEnd` before next step
- **State carryover** → use `clearState: true` in `launchApp` to reset between tests

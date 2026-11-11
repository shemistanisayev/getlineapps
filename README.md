# Line apps

Free, open source Chrome extensions for marketers, analysts and SEOs. No account, no paid plan, no tracking.

Website: [getlineapps.com](https://getlineapps.com)

## The tools

| Tool                                         | What it does                                                | Status                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [Hitline](https://getlineapps.com/hitline)   | Tracking debugger for GA4, Meta, TikTok and more            | [Chrome Web Store](https://chromewebstore.google.com/detail/hitline-tracking-debugger/aemdmmghojdopdjjhggajgdedmejkoaf) |
| [Serpline](https://getlineapps.com/serpline) | SEO checker: will Google and AI search show this page well? | Coming soon                                                                                                             |
| [Rivaline](https://getlineapps.com/rivaline) | Competitor research: brand, tech stack and ad libraries     | Coming soon                                                                                                             |
| [Foldline](https://getlineapps.com/foldline) | Landing page audit: what visitors see before they scroll    | Coming soon                                                                                                             |
| [Markline](https://getlineapps.com/markline) | Screenshot annotation: show exactly what to fix             | Coming soon                                                                                                             |

## Privacy

The extensions collect no data. There is no analytics, telemetry or remote code, and they only store your settings locally in your browser. Each tool asks for the smallest set of permissions it needs. Full details per tool: [getlineapps.com/privacy](https://getlineapps.com/privacy).

## Support

- **Found a bug or have an idea?** [Open an issue](https://github.com/shemistanisayev/getlineapps/issues/new/choose).
- **Prefer not to use GitHub?** Use the feedback form on the tool's page at [getlineapps.com](https://getlineapps.com).

See [SUPPORT.md](SUPPORT.md) for what to include in a report.

## Development

This is a pnpm monorepo: the extensions are built with WXT, React and TypeScript, the website with Astro.

```bash
pnpm install
pnpm check
```

`pnpm check` runs typecheck, lint, unit tests and the build for every app and package.

## License

[MIT](LICENSE)

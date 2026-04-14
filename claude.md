* Never make any changes that aren't strongly typed.  No undefined types allowed ever.
* Never run build, install, test, or dev commands on the host (no `npx`, `npm`, `node`, `poetry`, `pip`, `pytest`, etc. directly). Everything runs in Docker — use `docker compose build`, `docker compose up`, `docker compose run --rm <service> <cmd>`. The host should not have project toolchains installed or invoked.
* To add or change dependencies, **edit the manifest file directly** (`frontend/package.json`, `backend/pyproject.toml`) — never run `npm install <pkg>` or `poetry add <pkg>` on the host. Then rebuild the image: `docker compose build <service>` (or `docker compose up --build`). The install happens inside the container, where it belongs.

## Frontend styling

* All frontend visual properties (color, font size, font weight, font family, spacing, radius) must come from the MUI theme defined in `frontend/app/theme/theme.ts`. The theme is the single source of truth — never hardcode colors, sizes, or fonts in components.
* Render with MUI primitives (`Box`, `Stack`, `Typography`, etc.), not bare HTML elements like `<h1>`, `<p>`, `<div>`.
* Text must use a `<Typography variant="...">` from the theme. If no existing variant fits, **add a new variant to `theme.ts`** (with module augmentation so it stays strongly typed) rather than overriding styles inline.
* Colors must come from palette keys (`primary.main`, `text.secondary`, etc.). If a new color is needed, add it to the palette.
* Spacing must use the `sx` spacing scale (`sx={{ p: 4 }}`, `spacing={2}`), not literal `"2rem"` / `"16px"` values.
* Never use `style={{ ... }}` inline styles or `sx` with hardcoded color/size/font literals. If you catch yourself writing a hex code, px value, or `fontFamily` string in a component, stop and extend the theme instead.


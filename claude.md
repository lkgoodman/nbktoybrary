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

## Frontend data fetching

* All frontend data fetching must go through the React Query (`@tanstack/react-query`) provider mounted in `frontend/app/layout.tsx`. Use `useQuery` / `useMutation` hooks consistently for every new feature — never call `fetch` directly from components, and do not use server-component `await fetch` for API data.
* Add new query/mutation hooks in `frontend/app/lib/queries.ts` alongside a `queryKeys` entry, and new typed fetchers in `frontend/app/lib/api.ts` (with endpoint URLs registered in the central `endpoints` object). Components consume the hooks only.
* Backend API types live in `frontend/app/lib/types.ts` and must mirror the FastAPI Pydantic schemas exactly — no `any`, no loose `Record` types.

## Backend API conventions

* All backend endpoints must follow strict REST conventions: resources are nouns (plural), and the four verbs are `POST /resource`, `GET /resource`, `GET /resource/{id}`, `PATCH /resource/{id}`, `DELETE /resource/{id}`.
* Never add identity- or context-shortcut endpoints like `/me`, `/current`, `/my-toys`, `/mine`, etc. The authenticated user is derived from the auth token on the server side; clients filter by the real resource id. Example: use `GET /users/{id}` with the caller's own id, not `GET /users/me`.
* To narrow a collection, use query-string filters on the resource (`GET /checkouts?user_id=...&returned=false`), not bespoke sub-paths. Sub-paths are only for true nested resources (`GET /toys/{id}/images`).
* No action-verb endpoints (`/toys/{id}/approve`, `/requests/{id}/cancel`). Express state changes as `PATCH` on the resource with the new field value (e.g. `PATCH /membership-requests/{id}` with `{"status": "approved"}`).


## Running locally

**Prerequisites:** Node.js 22+ and npm.

1. Clone the repository:
```bash
   git clone https://github.com/Marsden-tech/clinic-stock-console.git
   cd clinic-stock-console
```

2. Install dependencies:
```bash
   npm install
```

   If this fails with an `npm error ... edgesOut` error (a dependency-resolution bug on some npm versions), try:
```bash
   npm install --legacy-peer-deps
```

3. Run the development server:
```bash
   ng serve
```

4. Open `http://localhost:4200` in your browser.

5. Sign in using any test user from [DummyJSON's user list](https://dummyjson.com/users) — for example:
   - Username: `emilys`
   - Password: `emilyspass`

**Running tests:**
```bash
npm test
```

**Running lint and format checks:**
```bash
npm run lint
npm run format:check
```

## Section 1: Design

### Components and layout

Components: auth, category filter, search+sort, item list, item detail, stock correction, shared loading/error/empty wrapper. Sidebar pushes layout, doesn't overlay. Item detail is own route not modal, so links shareable.

### State

For state I keep search, category, sorting, and pagination in the URL so the current view can be preserved and shared. Server state handles the actual data, while UI-only states such as the sidebar, edit mode, and saving status remain local.

### Data fetching, caching and invalidation

List data is kept when navigating between the list and detail views, so returning to the list does not require an unnecessary fetch. Categories are loaded once and reused, while stock updates do not manually modify the cache because the server does not persist those changes.

### Visual design (layout, spacing, colour, typography)

I used Angular Material because it provides accessible, consistent components out of the box and allowed me to build the interface efficiently within the available time.

### Accessibility

I use native controls where possible, such as a standard select for sorting. Since the sidebar pushes the page rather than overlaying it, there is no need for a focus trap, and focus is moved to the heading when navigating to a new route.

### Decision log

**1. Decision:** I chose not to update the list with the corrected stock value after a successful stock correction. The list may therefore continue showing the old value because the mock API does not actually persist the change.

**Alternative rejected:** Updating the client-side cache immediately after the correction.

**Why:** Updating the cache would make the UI appear as though the change had been saved when it had not. Since this is a demo using a non-persisting mock API, I preferred to represent the actual system behavior rather than create the impression of persistence that does not exist.

**2. Decision:** I chose to cancel an in-flight request when a new request replaces it, using proper request cancellation such as `AbortController`.

**Alternative rejected:** Allowing previous requests to finish and simply ignoring stale responses when they return.

**Why:** Cancelling the request prevents outdated results from affecting the UI while also avoiding unnecessary network and server work. This is a better fit for slow or unreliable network conditions, where keeping unnecessary requests running can waste resources.

**3. Decision:** I chose a push-layout sidebar that moves the page content instead of using an overlay with a backdrop.

**Alternative rejected:** Using an overlay sidebar with a backdrop.

**Why:** The push layout avoids the additional focus-trapping and accessibility complexity that comes with overlays. It also works well on smaller screens, including around 360px wide, because the content can naturally stack instead of being covered by the sidebar.

**4. Decision:** I chose Angular Material and its built-in components instead of creating the UI components from scratch.

**Alternative rejected:** Building custom components or using another UI library such as PrimeNG or NG-Zorro.

**Why:** Angular Material integrates well with Angular and provides accessible components out of the box, including keyboard support, ARIA attributes, and focus handling. This saves development time while still meeting the keyboard-only and small-screen requirements, which was important given the limited implementation time.

## Section 2: Build

### What was built

- **Sign-in and token expiry:** The app has a sign-in screen that authenticates against the DummyJSON auth endpoint and stores the returned access token for authenticated requests. When the token is no longer valid or has expired, the app handles the 401 response by clearing the session and redirecting the user back to sign in while preserving their original destination, so they can return to the page they were trying to access after re-authenticating.

- **Stock list:** The main stock view loads products from DummyJSON and provides text search, category filtering, sorting, and pagination. Because of the API limitation where category and search cannot be combined in one request, category filtering takes priority and the search control is disabled while a category is selected.

- **Item detail and stock correction:** Selecting a stock item opens its detail view through a dedicated shareable `/items/:id` route, so the URL can be copied or pasted directly to open that specific item. The detail view shows the relevant product information, including its current stock, and allows the user to make a stock correction through the update flow, which sends a `PUT /products/{id}` request. Since DummyJSON doesn't actually persist those updates, the implementation deliberately does not fake persistence through the client-side cache.

- **Tooling:** The project also has repository-level development tooling in place, including a code formatter, linter, and commit hooks, so formatting and code-quality checks are applied consistently before changes are committed.

### Mock API limitations

- **`PUT /products/{id}` does not persist updates:** The mock API accepts product update requests but does not reliably persist the changes, meaning an updated product may revert when fetched again. Rather than introducing artificial persistence by modifying or relying on the client-side cache, I kept the implementation aligned with the mock API's actual behaviour and treated the update as a successful request without attempting to fake server-side persistence.

- **Category and search cannot be used together:** The mock API does not provide a single endpoint that supports both category filtering and text search simultaneously. I resolved this by giving category filtering priority; when a category is selected, search is disabled to avoid sending an unsupported combination of parameters.

## Section 3: Deployment & CI/CD

**Public URL:** https://clinic-stock-console.vercel.app/

**Deploy trigger:** Pushes/merges to `main` (Vercel auto-deploys on every push to this branch via its GitHub integration).

**CI pipeline:** GitHub Actions, runs on every pull request into `main`. Checks: Prettier formatting (`format:check`), ESLint (`lint`), commit message format (commitlint, Conventional Commits), and the test suite. Any failing check blocks the PR from being merged.
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
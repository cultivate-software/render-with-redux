# Render decorators 🪆 for Redux

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cultivate-software/render-with-redux/release.yml?branch=main)
![Code Coverage](docs/coverage-badge.svg)
![npm (scoped)](https://img.shields.io/npm/v/@render-with/redux)
![NPM](https://img.shields.io/npm/l/@render-with/redux)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-bright%20green)
[![All Contributors](https://img.shields.io/github/all-contributors/cultivate-software/render-with-decorators?color=orange)](#contributors)

Use one of these decorators if your component under test requires a [Redux](https://redux.js.org) store:

- `withState(..)`
- `withStore(..)`

Example:

```jsx
import { render, withState } from './test-utils'

it('shows loaded users', () => {
  render(<Users />, withState({ users: [ { name: 'John' } ] }))
  // ...
})
```

_Note: Refer to the [core library](https://github.com/cultivate-software/render-with-decorators) to learn more about how decorators can simplify writing tests for React components with [React Testing Library](https://www.npmjs.com/package/@testing-library/react)._

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Test Scenarios](#test-scenarios)
- [Mock store](#mock-store)
- [Mock thunk middleware](#mock-thunk-middleware)
- [API](#api)
- [Issues](#issues)
- [Changelog](#changelog)
- [Contributors](#contributors)
- [LICENSE](#license)

## Installation

This library is distributed via [npm](https://www.npmjs.com/), which is bundled with [node](https://nodejs.org/) and should be installed as one of your project's `devDependencies`.

First, install the [core library](https://github.com/cultivate-software/render-with-decorators) with a render function that supports decorators:

```shell
npm install --save-dev @render-with/decorators
```

Next, install the Redux decorators provided by this library:

```shell
npm install --save-dev @render-with/redux
```

or

for installation via [yarn](https://classic.yarnpkg.com/):

```shell
yarn add --dev @render-with/decorators
yarn add --dev @render-with/redux
```

This library has the following `peerDependencies`:

![npm peer dependency version](https://img.shields.io/npm/dependency-version/@render-with/redux/peer/@reduxjs/toolkit)<br />
![npm peer dependency version](https://img.shields.io/npm/dependency-version/@render-with/redux/peer/react-redux)

and supports the following `node` versions:

![node-current (scoped)](https://img.shields.io/node/v/@render-with/redux)

## Setup

In your test-utils file, re-export the render function that supports decorators and the Redux decorators:

```javascript
// test-utils.js
// ...
export * from '@testing-library/react'  // makes all React Testing Library's exports available
export * from '@render-with/decorators' // overrides React Testing Library's render function
export * from '@render-with/redux'      // makes decorators like withState(..) available
```

And finally, use the Redux decorators in your tests:

```jsx
import { render, withState } from './test-utils'

it('shows loaded users', () => {
  render(<Users />, withState({ users: [ { name: 'John' } ] }))
  // ...
})
```

## Test Scenarios

The following examples represent tests for this `<Users />` component:

```jsx
const Users = () => {
  const users = useSelector(state => state.users)
  const dispatch = useDispatch()
  
  useEffect(() => {
    dispatch(loadUsers())
  }, [])
  
  return (
    <div>
      <h1>Users</h1>
      {users ? (
        <ul>
          users.map(user => <li>user</li>)
        </ul>
      ) : (
        <div>Loading users...</div>
      )}
    </div>
  )
}
```

### Just need a Redux store?

If your test does not care about the initial state, state changes, or dispatched actions, you can use the `withStore(..)` decorator and omit the store argument. The decorator will create and use a [mock store](#mock-store) for you:

```jsx
import { render, screen, withStore } from './test-utils'

it('shows loading indicator initially', () => {
  render(<Users />, withStore())
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

### Need to verify dispatched actions?

If your test cares about dispatched actions, you can pass a mock store and inspect the recorded actions:

```jsx
import { render, screen, withStore, configureMockStore } from './test-utils'

it('loads users', () => {
  const mockStore = configureMockStore()
  render(<Users />, withStore(mockStore))
  expect(mockStore.getActions()).toContainEqual(loadUsers())
})
```

### Need to provide an initial state?

If your test cares about the initial state, you can use the `withState(..)` decorator:

```jsx
import { render, screen, withState } from './test-utils'

it('loads users', () => {
  render(<Users />, withState({ users: [ { name: 'John' } ] }))
  expect(screen.getByRole('listitem')).toHaveTextContent('John')
})
```

### Need to observe state changes or side effects?

If your test cares about state changes, you can pass an actual Redux store:

```jsx
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, withStore } from './test-utils'

it('shows loaded users', async () => {
  fetch.mockResponse([ { name: 'John' } ])
  const store = configureStore({ reducer: { users: usersReducer } })
  render(<Users />, withStore(store))
  expect(await screen.findByRole('listitem')).toHaveTextContent('John')
})
```

## Mock store

If not specified otherwise, the decorators will create, configure, and use a mock store defined by [`redux-mock-store`](https://www.npmjs.com/package/redux-mock-store).

You can create, configure and pass your own mock store with `createMockStore(..)`, which is re-exported by this library.

## Mock thunk middleware

If not specified otherwise, the decorators will create a mock store using a mock-thunk middleware.

The mock thunk middleware will translate thunks into action objects with the `{ type: 'THUNK' }` and mocked thunks into action objects with the `{ type: 'MOCKED_THUNK' }`.

Replacing thunks with action objects is mainly done to avoid confusion when working with a mock store and thunks in tests.

Dispatched thunks will not be executed when using a mock store. Instead, they would end up in the recorded list of actions as follows:

```
console.log(mockStore.getActions()) // [ [Function] ]
```

This information is not very helpful and can be confusing when debugging a failing test. This is especially true when the thunks are defined as returning lambda functions (that have no name during runtime).

```javascript
export const loadUsers = () => (dispatch, getState) => { /* ... */ }
```

And that's why the mock thunk middleware translates dispatched thunks into an action object with the type `THUNK`:

```
console.log(mockStore.getActions()) // [ { type: 'THUNK' } ]
```

The problem gets worse when the thunks are mocked and no return value (function) is configured:

```
console.log(mockStore.getActions()) // [ undefined ]
```

That's why the mock thunk middleware translates mocked thunks into an action object with the type `MOCKED_THUNK`:

```
console.log(mockStore.getActions()) // [ { type: 'MOCKED_THUNK' } ]
```

## API

_Note: This API reference uses simplified types. You can find the full type specification [here](https://github.com/cultivate-software/render-with-redux/blob/main/types/index.d.ts)._

```
function withState<S>(state?: State<S>): Decorator
```

Wraps component under test in a mock store initialized with the given state.

```
function withStore<S>(store?: Store<S>): Decorator
```

Wraps component under test in the given store.

```
function configureMockStore<S>(state?: S, middlewares?: Middleware[]): MockStore<S>
```

Returns a mock store initialized with the given state and configured to use the given middlewares.

```
const mockThunk: Middleware
```

A middleware that replaces thunks and mocked thunks with corresponding action objects.

## Issues

Looking to contribute? PRs are welcome. Checkout this project's [Issues](https://github.com/cultivate-software/render-with-redux/issues?q=is%3Aissue+is%3Aopen) on GitHub for existing issues.

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[See Bugs](https://github.com/cultivate-software/render-with-redux/issues?q=is%3Aissue+label%3Abug+is%3Aopen+sort%3Acreated-desc)

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding a 👍. This helps maintainers prioritize what to work on.

[See Feature Requests](https://github.com/cultivate-software/render-with-redux/issues?q=is%3Aissue+label%3Aenhancement+sort%3Areactions-%2B1-desc+is%3Aopen)

### 📚 More Libraries

Please file an issue on the core project to suggest additional libraries that would benefit from decorators. Vote on library support adding a 👍. This helps maintainers prioritize what to work on.

[See Library Requests](https://github.com/cultivate-software/render-with-decorators/issues?q=is%3Aissue+label%3Alibrary+sort%3Areactions-%2B1-desc+is%3Aopen)

### ❓ Questions

For questions related to using the library, file an issue on GitHub.

[See Questions](https://github.com/cultivate-software/render-with-redux/issues?q=is%3Aissue+label%3Aquestion+sort%3Areactions-%2B1-desc)

## Changelog

Every release is documented on the GitHub [Releases](https://github.com/cultivate-software/render-with-redux/releases) page.

## Contributors

Thanks goes to these people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/davidbieder"><img src="https://avatars.githubusercontent.com/u/9366720?v=4?s=100" width="100px;" alt="David Bieder"/><br /><sub><b>David Bieder</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://cultivate.software"><img src="https://avatars.githubusercontent.com/u/31018345?v=4?s=100" width="100px;" alt="cultivate(software)"/><br /><sub><b>cultivate(software)</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mauricereichelt"><img src="https://avatars.githubusercontent.com/u/31188606?v=4?s=100" width="100px;" alt="Maurice Reichelt"/><br /><sub><b>Maurice Reichelt</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jeromeweiss"><img src="https://avatars.githubusercontent.com/u/59569084?v=4?s=100" width="100px;" alt="Jerome Weiß"/><br /><sub><b>Jerome Weiß</b></sub></a><br /></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

## LICENSE

[MIT](LICENSE)
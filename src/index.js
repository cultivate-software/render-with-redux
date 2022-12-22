import { Provider as StoreProvider } from 'react-redux'
import configureStoreMock from 'redux-mock-store'

export const mockThunk = () => next => action => {
  if (!action) return next({ type: 'MOCKED_THUNK' })
  if (typeof action === 'function') return next({ type: 'THUNK' })
  return next(action)
}

export const configureMockStore = (state = {}, middlewares = [ mockThunk ]) => configureStoreMock(middlewares)(state)

export const withStore = (store = configureMockStore({})) => node => <StoreProvider store={store}>{node}</StoreProvider>

export const withState = (state = {}) => withStore(configureMockStore(state))

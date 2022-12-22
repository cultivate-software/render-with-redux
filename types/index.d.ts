import { Decorator } from '@render-with/decorators'
import { Middleware, PreloadedState, Store } from '@reduxjs/toolkit'
import { MockGetState, MockStoreEnhanced } from 'redux-mock-store'

export function withState<S = {}>(state?: PreloadedState<S>): Decorator

export function withStore<S = {}>(store?: Store<S>): Decorator

export function configureMockStore<S = {}, DispatchExts = {}>(
  state?: S | MockGetState<S>,
  middlewares?: Middleware[],
): MockStoreEnhanced<S, DispatchExts>

export const mockThunk: Middleware
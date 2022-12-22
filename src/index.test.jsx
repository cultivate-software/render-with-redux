import { render } from '@render-with/decorators'
import { screen } from '@testing-library/react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { configureMockStore, withState, withStore } from './index'

const StateSelector = () => {
  const state = useSelector(state => state)
  return <>
    <h1>Needs store</h1>
    <div>{JSON.stringify(state)}</div>
  </>
}

const ActionDispatcher = ({ action }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(action)
  }, [])
  return <h1>Action Dispatcher</h1>
}

describe('withState', () => {
  it('decorates component that requires state', () => {
    render(<StateSelector />, withState())
    expect(screen.getByRole('heading', { name: /needs store/i })).toBeInTheDocument()
  })

  it('initializes state with empty object', () => {
    render(<StateSelector />, withState())
    expect(screen.getByText('{}')).toBeInTheDocument()
  })

  it('uses given state', () => {
    render(<StateSelector />, withState({ some: 'state' }))
    expect(screen.getByText('{"some":"state"}')).toBeInTheDocument()
  })
})

describe('withStore', () => {
  it('decorates component that requires state', () => {
    render(<StateSelector />, withStore())
    expect(screen.getByRole('heading', { name: /needs store/i })).toBeInTheDocument()
  })

  it('initializes state with empty object', () => {
    render(<StateSelector />, withStore())
    expect(screen.getByText('{}')).toBeInTheDocument()
  })

  it('uses given mock store', () => {
    const mockStore = configureMockStore()
    render(<ActionDispatcher action={{ type: 'ACTION' }} />, withStore(mockStore))
    expect(mockStore.getActions()).toEqual([ { type: 'ACTION' } ])
  })

  it('uses given mock store with state', () => {
    const mockStore = configureMockStore({ some: 'state' })
    render(<StateSelector />, withStore(mockStore))
    expect(screen.getByText('{"some":"state"}')).toBeInTheDocument()
  })

  it('uses given mock store with middleware', () => {
    const mockFunction = jest.fn()
    const mockStore = configureMockStore({}, [ () => () => mockFunction ])
    render(<ActionDispatcher action={{ type: 'ACTION' }} />, withStore(mockStore))
    expect(mockFunction).toHaveBeenCalledWith({ type: 'ACTION' })
  })

  it('uses given production store', () => {
    const store = configureStore({ reducer: { some: () => 'state' } })
    render(<StateSelector />, withStore(store))
    expect(screen.getByText('{"some":"state"}')).toBeInTheDocument()
  })

  it('dispatches thunk as action of type THUNK', () => {
    const mockStore = configureMockStore()
    render(<ActionDispatcher action={() => {}} />, withStore(mockStore))
    expect(mockStore.getActions()).toEqual([ { type: 'THUNK' } ])
  })

  it('dispatches mocked thunk as action of type MOCKED_THUNK', () => {
    const mockStore = configureMockStore()
    render(<ActionDispatcher action={undefined} />, withStore(mockStore))
    expect(mockStore.getActions()).toEqual([ { type: 'MOCKED_THUNK' } ])
  })
})
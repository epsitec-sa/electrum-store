'use strict';

import State from './state.js';

/******************************************************************************/

function patchState (store, state) {
  store._states[state.id] = state;
  return state;
}

function changeGeneration (store) {
  return ++store._generation;
}

function updateTree (store, state, mutation) {
  const parentId = State.getParentId (state.id);
  if (parentId) {
    const parentState = store.find (parentId) || State.create (parentId);
    updateTree (store, parentState, mutation);
  }
  return patchState (store, State.with (state, mutation));
}

const secretKey = {};

/******************************************************************************/

class Store {
  constructor (id, key, values) {

    if (key !== secretKey) {
      throw new Error ('Do not call Store constructor directly; use Store.create instead');
    }

    this._states = {};
    this._generation = 0;
    this._rootState = State.createRootState (this, values);
    this._id = id;
  }

  select (id) {
    if (arguments.length === 0) {
      return this._rootState;
    }
    return this.find (id) ||
           this.setState (State.create (id));
  }

  setState (state) {
    if (typeof state === 'string') {
      state = State.create (state);
    }
    if (!state || !state.id || !(state instanceof State)) {
      throw new Error ('Invalid state');
    }

    if (state === this.find (state.id)) { // No mutation
      return state;
    } else {
      const mutation = {
        store: this,
        generation: changeGeneration (this)
      };
      return updateTree (this, state, mutation);
    }
  }

  find (id) {
    if (arguments.length === 0) {
      return this._rootState;
    }
    if (typeof id !== 'string') {
      throw new Error ('Invalid state id');
    }
    if (id.length === 0) {
      return this._rootState;
    } else {
      return this._states[id];
    }
  }

  get id () {
    return this._id;
  }

  get generation () {
    return this._generation;
  }

  get root () {
    return this._rootState;
  }

  get stateCount () {
    return Object.keys (this._states).length;
  }

/* static methods */

  static create (id, values) {
    return new Store (id, secretKey, values);
  }

  static link (props, id, override) {
    const {state} = props;
    let theme = props.theme;
    if (override) {
      if (override.theme) {
        theme = override.theme;
      }
    }
    return {
      state: state.getChild (id),
      theme
    };
  }

  static read (props, id) {
    const {state} = props;
    return state.getValue (id);
  }
}

module.exports = Store;

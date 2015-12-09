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
    this._states[''] = State.createRootState (this, values);
    this._id = id;
  }

  select (id) {
    if (arguments.length === 0) {
      return this.root;
    }
    return this.find (id) ||
           this.setState (State.create (id));
  }

  setState (state) {
    if (typeof state === 'string') {
      state = State.create (state);
    }
    if (!state || !(state instanceof State)) {
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
      return this.root;
    }
    if (typeof id !== 'string') {
      throw new Error ('Invalid state id');
    }
    if (id.length === 0) {
      return this.root;
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
    return this._states[''];
  }

  get stateCount () {
    return Object.keys (this._states).length - 1;
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
      state: state.select (id),
      theme
    };
  }

  static read (props, id) {
    const {state} = props;
    return state.get (id);
  }
}

module.exports = Store;

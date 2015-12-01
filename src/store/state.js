'use strict';

const emptyValues = {};
const secretKey = {};

class State {
  constructor (key, id, store, generation, values) {
    if (key !== secretKey) {
      throw new Error ('Do not call State constructor directly; use State.create instead');
    }
    if ((typeof id !== 'string') ||
        (!store && (id.length === 0)) ||
        (store && store._rootState && (id.length === 0))) {
      throw new Error ('State expects a valid id');
    }
    if (typeof generation !== 'number') {
      throw new Error ('State expects a valid generation');
    }
    if (typeof values !== 'object') {
      throw new Error ('State expects valid initial values');
    }

    this._id = id;
    this._store = store;
    this._generation = generation;
    this._values = values;
  }

  get id () {
    return this._id;
  }

  get store () {
    return this._store;
  }

  get generation () {
    return this._generation;
  }

  get value () {
    return this.getValue ('');
  }

  getValue (id) {
    return this._values[id];
  }

  getChild (id) {
    if (this._id.length === 0) {
      return this._store.getState (id);
    } else {
      return this._store.getState (State.join (this._id, id));
    }
  }

  static create (id) {
    return new State (secretKey, id, null, 0, emptyValues);
  }

  static createRootState (store, values) {
    return new State (secretKey, '', store, 0, values || emptyValues);
  }

  static join (...args) {
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if ((typeof arg !== 'string') || arg.length === 0) {
        throw new Error ('State.join expects non-empty string ids');
      }
    }

    return args.join ('.');
  }

  static getParentId (id) {
    const pos = id.lastIndexOf ('.');
    if (pos < 0) {
      return null;
    } else {
      return id.substring (0, pos);
    }
  }

  static withValue (state, id, value) {
    if (state._values[id] === value) {
      return state;
    } else {
      return State.withValues (state, id, value);
    }
  }

  static withValues (state, ...args) {
    if (args.length === 0) {
      return state;
    }
    if (args.length % 2 !== 0) {
      throw new Error ('Invalid number of arguments');
    }

    var values;

    for (let i = 0; i < args.length; i += 2) {
      const id = args[i + 0];
      const value = args[i + 1];
      if (state._values[id] !== value) {
        if (!values) {
          values = {};
          Object.assign (values, state._values);
        }
        values[id] = value;
      }
    }

    if (!values) {
      return state;
    } else {
      return State.with (state, {values: values});
    }
  }

  static with (state, mutation) {
    if (state.id.length === 0) {
      throw new Error ('Root state cannot be mutated');
    }
    const generation = mutation.generation || state._generation;
    const store = mutation.store || state._store;
    const values = mutation.values || state._values;

    if ((state._generation === generation) &&
        (state._store === store) &&
        (state._values === values)) {
      return state;
    } else {
      state = new State (secretKey, state._id, store, generation, values);
      // If the state was already attached to a store, we have to update the
      // store so that the new state will be used from now on...
      if (state._store) {
        // ...however, if the mutation includes a store specification, then
        // this means that the store is actually calling us, because it is
        // already updating this very state. If so, don't notify the store.
        if (!mutation.store) {
          return state._store.setState (state);
        }
      }
      return state;
    }
  }
}

module.exports = State;

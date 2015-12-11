'use strict';

const emptyValues = {};
const secretKey = {};

function verifyMutationKeys (mutation) {
  if (typeof mutation !== 'object') {
    throw new Error ('Invalid mutation object');
  }
  for (let key of Object.getOwnPropertyNames (mutation)) {
    switch (key) {
      case 'generation':
      case 'store':
      case 'values':
        break;
      default:
        throw new Error ('Unexpected key ' + key + ' in mutation');
    }
  }
}

/******************************************************************************/

class State {
  constructor (key, id, store, generation, values) {
    if (key !== secretKey) {
      throw new Error ('Do not call State constructor directly; use State.create instead');
    }
    if (typeof generation !== 'number') {
      throw new Error ('State expects a valid generation');
    }
    if (typeof values !== 'object') {
      throw new Error ('State expects valid initial values');
    }
    if (values.length === 0) {
      values = emptyValues; // optimize for values set to {}
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
    return this.get ();
  }

  get (id) {
    if (id === undefined) {
      id = '';
    }
    return this._values[id];
  }

  set (...args) {
    if (args.length === 1) {
      return this.set ('', args[0]);
    }
    return State.withValues (this, ...args);
  }

  select (id) {
    if ((id === undefined) && (arguments.length === 0)) {
      return this;
    }
    if (id === '') {
      return this;
    }
    if (typeof id !== 'string') {
      throw new Error ('Invalid state id');
    }
    if (this._id.length === 0) {
      return this._store.select (id);
    } else {
      return this._store.select (State.join (this._id, id));
    }
  }

  static create (...args) {
    if (args.length === 0) {
      throw new Error ('No id was provided to State.create()');
    }
    if (args.length > 2) {
      throw new Error ('Too many arguments provided to State.create()');
    }

    const id = args[0];
    const values = args[1];

    if ((typeof id !== 'string') ||
        (id.length === 0)) {
      throw new Error ('State expects a valid id');
    }
    return new State (secretKey, id, null, 0, values || emptyValues);
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
    if (typeof id !== 'string') {
      throw new Error ('State.getParentId expects a string id');
    }
    const pos = id.lastIndexOf ('.');
    if (pos < 0) {
      return id !== '' ? '' : undefined;
    } else {
      return id.substring (0, pos);
    }
  }

  static withValue (state, id, value) {
    if (arguments.length !== 3) {
      throw new Error ('Invalid number of arguments');
    }
    if (state._values[id] === value) {
      return state;
    } else {
      return State._withValues (state, [id, value]);
    }
  }

  static withValues (state, ...args) {
    if (args.length === 0) {
      return state;
    }
    if (args.length % 2 !== 0) {
      throw new Error ('Invalid number of arguments');
    }

    return State._withValues (state, args);
  }

  static _withValues (state, args) {
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
    verifyMutationKeys (mutation);
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

/******************************************************************************/

module.exports = State;

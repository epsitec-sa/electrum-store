# Electrum Store

[![NPM version](https://img.shields.io/npm/v/electrum-store.svg)](https://www.npmjs.com/package/electrum-store)
[![Build Status](https://travis-ci.org/epsitec-sa/electrum-store.svg?branch=master)](https://travis-ci.org/epsitec-sa/electrum-store)
[![Build status](https://ci.appveyor.com/api/projects/status/21n8c0j8aexkwg8e?svg=true)](https://ci.appveyor.com/project/epsitec/electrum-store)

Electrum Store (`electrum-store`) provides a store implementation tailored
for use with `electrum-arc`, the Electrum Agnostic Reactive Components.

The **store** maintains **state** organized as a tree. State is
**immutable**. When the store is updated, new state is produced and
nodes get replaced in the tree.

Neither the store nor its states will emit notifications when things
change, since `electrum` does not need the feature.

Thanks to immutability, whole trees can be compared for equality
with `===`. Whenever a (sub-)tree changes, the store guarantees that
the `state` objects change too, from the node in the tree where the
change happened up to the root of the tree (_change percolation_).

# Store
## Create a store

To create a store, call `Store.create()`. The constructor is not available
for public consumption and should not be called.

```javascript
const store = Store.create ();
```

## Access state in the store

The store maintains its state as a tree. Selecting state located at `a.b.c`
will automatically create `a`, `a.b` and `a.b.c` if they did not yet exist
in the tree. You can call `select()` on a `state` object, which can be used
to navigate down the tree.

`select()` creates missing nodes whereas `find()` returns `undefined` if
it does not find the specified nodes.

```javascript
const store = Store.create ();
const state1 = store.select ('a.b.c');
const state2 = store.select ('a').select ('b.c');
const state3 = store.find ('a.b.c');
const state4 = store.find ('x.y');
expect (state1).to.equal (state2);
expect (state1).to.equal (state3);
expect (state4).to.equal (undefined);
```

## Mutate the store

Whenever new state needs to be recorded in the store, the tree will be
updated and new _generation_ tags will be applied to the parts of the
tree which changed as a result of this.

Setting `a.b.c` first will produce nodes `a`, `b` and `c` in generation 1.
Adding `a.b.d` will mutate `a.b` (it contains a new child `d`) and
also mutate `a` (it contains an updated `a.b`); all this will happen
inside generation 2. Nodes `a`, `b` and `d` will have `generation:2`
whereas node `c` will remain at `generation:1`.

```javascript
const store = Store.create ();
store.select ('a.b.c'); // generation 1
store.select ('a.b.d'); // generation 2
expect (store.find ('a').generation).to.equal (2);
expect (store.find ('a.b').generation).to.equal (2);
expect (store.find ('a.b.c').generation).to.equal (1);
expect (store.find ('a.b.d').generation).to.equal (2);
```

A state (with all its children) can also be removed from the store:

```javascript
const store = Store.create ();
store.select ('a.b.c'); // generation 1
store.select ('a.b.d'); // generation 2
store.remove ('a.b'); // generation 3
expect (store.find ('a').generation).to.equal (3);
expect (store.find ('a.b')).to.not.exist ();
expect (store.find ('a.b.c')).to.not.exist ();
expect (store.find ('a.b.d')).to.not.exist ();
```

## Explicitly set state

State is usually updated using `with()`, `withValue()` and `withValues()`
or created implicitly by `select()`. It is also possible to set state
explicitly:

```javascript
const store = Store.create ();
const state1 = State.create ('x.y');
const state2 = store.setState (state1);
expect (state1.generation).to.equal (0);
expect (state1).to.not.equal (state2);
expect (state2.generation).to.equal (1);
```

## Check the generation

State has an intrinsic _generation_ which can be retrieved with the
`generation` property. As soon as a state is attached to a store, its
generation will be a strictly positive integer (1...n).

The helper method `shouldUpdate()` returns `true` when the provided
generation is compatible with the state's own generation (i.e. equal
or more recent to the state generation).

```javascript
const store = Store.create ();
store.select ('a');
store.select ('a.b');
const state = store.select ('a.b');
expect (state.generation).to.equal (2);
expect (state.shouldUpdate (1)).to.be.false ();  // provided gen=1 older than state.generation
expect (state.shouldUpdate (2)).to.be.true ();
expect (state.shouldUpdate (3)).to.be.true ();
```

## Merge an object into the state

Setting the state in the store requires calls to `select()` to proper
node and then changing the state's internal values using `set()`. This
can quickly become cumbersome if the state we want to set is stored as
a Plain Old JavaScript Object (POJO).

```javascript
const store = Store.create ();
store.select ('a.b').set ('x', 10, 'y', 20);
const pojo = {x: 15, name: 'foo', c: {value: 'bar'}};
store.merge ('a.b', pojo);
expect (store.select ('a.b').get ('x')).to.equal (15);
expect (store.select ('a.b').get ('y')).to.equal (20);
expect (store.select ('a.b').get ('name')).to.equal ('foo');
expect (store.select ('a.b.c').get ('value')).to.equal ('bar');
```

The `merge()` method also accepts objects with arrays, such as:

```javascript
const store = Store.create ();
const pojo = {items: ['x', {value: 'bar'}]};
store.merge ('a', pojo);
expect (store.select ('a.items.0').get ()).to.equal ('x');
expect (store.select ('a.items.1').get ('value')).to.equal ('bar');
```

...or even arrays, directly:

```javascript
const store = Store.create ();
const pojo = ['x', {value: 'bar'}];
store.merge ('a', pojo);
expect (store.select ('a.0').get ()).to.equal ('x');
expect (store.select ('a.1').get ('value')).to.equal ('bar');
```

## Apply changes, interpret collection items

Sometimes, we need to fill the state with a collection of items,
but we need to be able to specify the index of very item (e.g.
to display lists in the user interface).

* `applyChanges (id, array, defaultKey = '')` &rarr; sets nodes
  on the store, starting at root `id`. If `defaultKey` is provided,
  it is used to `set()` the values on the nodes; otherwise, values
  are set using the keyless `set(value)` method.

The specialized `applyCollection()` method interprets the provided
array and populates the store by creating nodes using a set of
conventions. The array items should be objects with at least
following properties:

* `offset` &rarr; the index (key) into the collection.
* `value` &rarr; the value to apply or set.
  * If the value is an object, its content will be interpreted to create children nodes.
  * If the value is missing or `undefined`, the corresponding subtree will be removed.
  * If the value is an array, it will be interpreted.
  * If the value is a simple value type, it will be set on the state node directly.

```javascript
const store = Store.create ();
const array = [
  {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}}, // children year and name
  {offset: 12, id: 'y', value: {year: 1984, name: 'bar'}}, // children year and name
  {offset: 13, id: 'z', value: 'hello'} // no children, plain value only
];

// Create 3 nodes in the tree, with children for nodes 10 and 12
store.applyChanges ('root', array);
expect (store.find ('root.10.year').get ()).to.equal (2016);
expect (store.find ('root.12.name').get ()).to.equal ('bar');
expect (store.find ('root.10').get ('value')).to.not.exist ();
expect (store.find ('root.13').get ('value')).to.equal ('hello');

// Replace entry 12 by updating only the year; the name won't be updated
store.applyChanges ('root', [{offset: 12, id: 'y', value: {year: 1986}}]);
expect (store.find ('root.12.year').get ()).to.equal (1986);
expect (store.find ('root.12.name').get ()).to.equal ('bar');

// Remove entry 12 in the store - no value specified...
store.applyChanges ('root', [{offset: 12}]);
expect (store.find ('root.12')).to.not.exist ();
```

## Setting properties on nodes

The `store.applyChanges()` method can also be used to set the
key/value properties on the nodes, rather than creating child
nodes for every provided object property.

Object properties will be interpreted as node properties if
the object contains the special property `$apply` set to
`props`.

```javascript
const store = Store.create ();
const array = [
  {offset: 10, id: 'x', value: {year: 2016, name: 'foo'}},
  {offset: 12, id: 'y', value: {$apply: 'props', year: 1984, name: 'bar'}}
];

// Properties year/name will be set on node 12 directly
store.applyChanges ('root', array);
expect (store.find ('root.10.year').get ()).to.equal (2016);
expect (store.find ('root.10.name').get ()).to.equal ('foo');
expect (store.find ('root.12.year')).to.not.exist ();
expect (store.find ('root.12.name')).to.not.exist ();
expect (store.find ('root.12').get ('year')).to.equal (1984);
expect (store.find ('root.12').get ('name')).to.equal ('bar');
```

## Special `array` property

When applying specially tagged objects (using `$apply: 'props'`),
a property `array` will be treated as if it had been set at the
containing level:

```javascript
const store = Store.create ();
const changes = {
  $apply: 'props',
  name: 'John',
  age: 42,
  array: [
    {offset: 1, id: 'x', value: {x: 10}},
    {offset: 2, id: 'y', value: {y: 20}}
  ]
};

// Properties name/age will be set on root node directly, and
// the array will be applied on root too.
store.applyChanges ('root', changes);
expect (store.find ('root').get ('name')).to.equal ('John');
expect (store.find ('root').get ('age')).to.equal (42);
expect (store.find ('root.1.x').get ()).to.equal (10);
expect (store.find ('root.2.y').get ()).to.equal (20);
```

# State

State holds following information:

* `id` &rarr; the absolute path of the node (e.g. `'a.b.c'`).
* `key` &rarr; the local path of the node (e.g. `'c'` if the `id` is `'a.b.c'`).
* `store` &rarr; a reference to the containing store.
* `generation` &rarr; the generation number of last update.
* `values` &rarr; a collection of values - this is never accessed directly.

The default value is accessed with `state.value`. Named values can be
accessed using `state.get(name)`.

## Read back values from the state

* `get (name)` or `get ()` &rarr; the value for `name` (or the default value if
  no name is specified), if it exists; otherwise `undefined`.
* `getInherited (name)` &rarr; the value for `name` if it can be found on the
  state or any of its parent nodes, otherwise `undefined`.
* `contains (name)` &rarr; `true` if a value exists for `name`, otherwise `false`.
* `getPojo ()` &rarr; the values as a plain old JavaScript object (POJO); the
  object is a copy of the internal state values.

## States as arrays

When a state (a node of the tree) contains multiple child nodes, and when these
nodes have an integer `key` (zero or positive), this can be considered as a poor
men's array. The keys are then equivalent to the indexes into the array. They
can have gaps and need not be consecutive: `[23, 24, 37]` would be valid index
keys.

## Explore the tree from the state

* `any (id)` or `any ()` &rarr; `true` if the state specified by `id` exists
  and if it is non-empty.
* `exists (id)` &rarr; `true` if the state specified by `id` exists.
* `keys` &rarr; an array of all the `key`s found for the state's child nodes.  
  Example: `['a', '0', '12', 'b']`
* `indexKeys` &rarr; an array of all the indexes of the state's child nodes;
  nodes will only be reported if their `key` is **zero** or a positive
  integer. The values will always be sorted.  
  Example: `[0, 1, 34]`

The state can also be used as a starting point for `find()` and `select()`.
Without any argument, they return the state itself.

* `select()` creates missing nodes.
* `find()` returns `undefined` if it does not find the specified child.
* `remove()` removes the node (if called without arguments) or the specified
  child, if an `id` is provided.

`select()`, `find()`, `remove()` and `any()` accept a child `id` or an index,
which will be converted to a key and used to look up the child.

## Working with state ids

State ids are similar to _paths_ where the elements are separated by `.`.
Class `State` provides some static methods to manipulate these ids:

* `State.join (a, b, c, ...)` &rarr; returns the joined path.
* `State.getLeafId (id)` &rarr; returns the last element of the path.
* `State.getParentId (id)` &rarr; returns the path of the immediate parent.
* `State.getAncestorId (id, part)` &rarr; returns the path of the first ancestor
  which contains the specified part (path element); if the last element of the
  `id` matches `part`, the full `id` will be returned.

```javascript
expect (State.join ('a', 'b', 'c')).to.equal ('a.b.c');
expect (State.getLeafId ('a.b.c')).to.equal ('c');
expect (State.getParentId ('a.b.c')).to.equal ('a.b');
expect (State.getAncestorId ('a.b.c', 'b')).to.equal ('a.b');
```

## Adding items to an array

Arrays can be built using `state.add()`:

* `add ()` &rarr; a new child state, where the `key` is equal to the current
  highest index, plus one.

This is an easy way to add new states to an array of states.

```javascript
const store = Store.create ();
store.select ('a.1');
store.select ('a.2');
store.select ('a.5');

expect (store.select ('a').add ().key).to.equal ('6');
expect (store.select ('a').indexKeys).to.deep.equal ([1, 2, 5, 6]);
```

## Create state

To create state with an initial value, use `State.create()`.

```javascript
const state1 = State.create ('empty');
expect (state1.value).to.equal (undefined);

const state2 = State.create ('message', {'': 'Hello'});
expect (state2.value).to.equal ('Hello');

const state3 = State.create ('person', {name: 'Joe', age: 78});
expect (state3.get ('name')).to.equal ('Joe');
expect (state3.get ('age')).to.equal (78);
```

## Mutate state

State objects are immutable. Updating state will produce a copy of
the state object with the new values.

```javascript
const state1 = State.create ('a', {x: 1, y: 2});
const state2 = State.withValue (state1, 'x', 10);
const state3 = State.withValues (state1, 'x', 10, 'y', 20);
const state4 = State.with (state1, {values: {x: 10, y: 20}});

// Setting same values does not mutate state:
const state5 = State.with (state1, {values: {x: 1, y: 2}});
expect (state1).to.equal (state5); // same values, same state
```

It is also possible to use method `set()` to create a new state;
this is just syntactic sugar over the `State.withValue()` static
methods.

```javascript
const state1 = State.create ('a');
const state2 = state1.set ('x', 1);
const state3 = state2.set ('a'); // set default value
const state4 = state1.set ('x', 1, 'y', 2);
expect (state2.get ('x')).to.equal (1);
expect (state3.get ()).to.equal ('a');
expect (state4.get ('x')).to.equal (1);
expect (state4.get ('y')).to.equal (2);
```

## Setting values freezes them

When setting values on a state object, we do not want them to be
mutated arbitrarily by an external source (at least at the top
level).

In order to prevent mutation of values stored in a state object,
every value is automatically frozen (`Object.freeze()`):

```javascript
const state = State.create ('a').set ('x', {foo: 'bar'});
expect (Object.isFrozen (state.get ('x'))).to.be.true ();
expect (() => state.get ('x').foo = 'baz').to.throw ();
```

If the value is an array, the values of the array will also be
frozen (recursively for sub-arrays).

## Explicit freeze API

The `State` class exposes two methods to explicitly freeze
objects:

* `State.freeze(obj)` &rarr; freezes recursively the full object
  tree.
* `State.freezeTop(obj)` &rarr; freezes the object; if it is an
  array, then every item of the array will be frozen by calling
  `freezeTop()` recursively.

## Mutate state in a store

When a state attached to a store is being mutated, the new state will
be stored in the tree, and all nodes up to the root will get updated
while doing so.

```javascript
const store = Store.create ();
expect (store.select ('a.b.c').generation).to.equal (1);  // gen. 1
expect (store.select ('a.b.d').generation).to.equal (2);  // gen. 2
State.withValue (store.select ('a.b.c'), 'x', 10); // gen. 3
expect (store.select ('a.b.c').generation).to.equal (3);
expect (store.select ('a.b.d').generation).to.equal (2); // unchanged
expect (store.select ('a.b').generation).to.equal (3);
expect (store.select ('a').generation).to.equal (3);
State.withValue (store.select ('a.b'), 'y', 20); // gen. 4
expect (store.select ('a.b.c').generation).to.equal (3); // unchanged
expect (store.select ('a.b.d').generation).to.equal (2); // unchanged
expect (store.select ('a.b').generation).to.equal (4);
expect (store.select ('a').generation).to.equal (4);
```

## Invalidate full store

If for some reason, you want to trigger a full update of the UI,
you might need to mark all nodes in the store as being dirty by
mutating them.

This can be done by calling `store.mutateAll()`. Every state in
the store will be cloned and its generation will be updated.

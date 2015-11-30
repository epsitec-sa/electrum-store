'use strict';

export default function (timings) {
  const transitions = {
    defaultTransition: {
      duration: timings.timeBase * 2,
      enter: {
        opacity: [1, 0]
      },
      leave: {
        opacity: [0, 1]
      }
    },
    rotate: {
      duration: timings.timeBase,
      enter: {
        translateZ: 0, // Force HA by animating a 3D property
        rotateZ: '360deg'
      },
      leave: {
        translateZ: 0, // Force HA by animating a 3D property
        rotateZ: '-360deg'
      }
    },
    slide: {
      duration: timings.timeBase,
      enter: {
        translateZ: 0, // Force HA by animating a 3D property
        translateX: ['0%', '-100%']
      },
      leave: {
        translateZ: 0, // Force HA by animating a 3D property
        translateX: ['100%', '0%']
      }
    },
    overlay: {
      duration: timings.timeBase * 2,
      enter: {
        opacity: [1, 0]
      },
      leave: {
        opacity: [0, 1]
      }
    },
    leftPanel: {
      duration: timings.timeBase,
      enter: {
        translateZ: 0, // Force HA by animating a 3D property
        translateX: ['0%', '-100%']
      },
      leave: {
        translateZ: 0, // Force HA by animating a 3D property
        translateX: ['100%', '0%']
      }
    },
    easeOutFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeInOutFunction: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)'
  };

  function easeOut (duration, property, delay, easeFunction) {
    easeFunction = easeFunction || transitions.easeOutFunction;
    return create (duration, property, delay, easeFunction);
  }

  function create (duration, property, delay, easeFunction) {
    duration = duration || timings.timeBase;
    property = property || 'all';
    delay    = delay || 0;
    easeFunction = easeFunction || 'linear';

    return property + ' ' + duration + 'ms ' + easeFunction + ' ' + delay + 'ms';
  }

  transitions.easeOut = easeOut;
  transitions.create = create;

  return transitions;
}

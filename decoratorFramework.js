'use strict'

import immutable from 'immutable'
import {atom, derivation, lens, transact} from 'derivable'

window.immutable = immutable
window.Record = immutable.Record
window.List = immutable.List
window.IMap = immutable.Map
window.atom = atom
window.derivation = derivation
window.transact = transact
window.lens = lens

window.initProp = (view, prop) => {
  view.prop = prop
  for (propName in view.prop) {
    // Tag the prop atom/lens with its propName for debugging
    view.prop[propName].name = `${view.name}.${propName}`
  }
  for (propName in view.props) {
    if (view.prop[propName]) {
      view.prop[propName].set(view.props[propName])
    }
  }
  return view.prop
}

window.initContext = (view, context) => {
  view.mContext = context
  for (let contextName in M.context) {
    view.mContext[contextName] = view.mContext[contextName] || atom()
    view.mContext[contextName].name = `${view.name}.mContext.${contextName}`
  }
  view.props.mContext.forEach((contextValue, contextName) => {
    view.mContext[contextName].set(contextValue)
  })
  return view.mContext
}

window.initData = (view, data) => {
  view._data = data
  view.data = {}

  for (let dataKey in view._data) {
    // Shorthand for quickly mapping a Firebase ref into an atom
    if (typeof view._data[dataKey] == 'function' || view._data[dataKey] instanceof Array) {
      view._data[dataKey] = {
        ref: view._data[dataKey],
        value: true
      }
    }

    view.data[dataKey] = atom()

    view._data[dataKey].derPathParts = derivation(() => {
      if (typeof view._data[dataKey].ref == 'function') {
        const pathParts = view._data[dataKey].ref()
        if (!pathParts || pathParts.findIndex(pp => pp === undefined) >= 0) {
          return undefined
        } else if (pathParts.findIndex(pp => !pp) >= 0) {
          throw new Error(`Invalid path part for ${view.name}.data.${dataKey}:`
            + ` ${JSON.stringify(pathParts)}`
          )
        } else {
          return List(pathParts)
        }
      } else {
        return List(view._data[dataKey].ref)
      }
    })

    view._data[dataKey].handlers = {} // eventType: handler

    view._data[dataKey].refReactor = view._data[dataKey].derPathParts.reactor(pathParts => {
      const oldRef = view._data[dataKey].oldRef

      for (let eventType in view._data[dataKey].handlers) {
        const handler = view._data[dataKey].handlers[eventType]
        oldRef.off(eventType, handler)
        delete view._data[dataKey].handlers[eventType]

        // Bookkeeping for debugging
        const refKey = oldRef.toString().replace(/^.*firebaseio.com\//, '')
        const i = M._refs[refKey].findIndex(log => {
          return log.eventType == eventType && log.handler == handler
        })
        M._refs[refKey].splice(i, 1)
        if (M._refs[refKey].length == 0) {
          delete M._refs[refKey]
        }
        // console.debug(`*off ${view.name} ${refKey} ${eventType}`)
      }

      view.data[dataKey].set(undefined)

      const refOptions = view._data[dataKey].refOptions || (ref => ref)

      const ref = pathParts? refOptions(M.ref.child(pathParts.join('/'))) : null

      view._data[dataKey].oldRef = ref

      if (!ref) return

      for (let eventType in view._data[dataKey]) {
        if ([
          'value', 'child_added', 'child_changed', 'child_moved', 'child_removed'
        ].indexOf(eventType) >= 0) {
          const handler = ref.on(eventType, (snapshot, prevChildKey) => {
            if (eventType == 'value' && view._data[dataKey][eventType] === true) {
              view.data[dataKey].set(snapshot.val())

            } else {
              const returnValue = view._data[dataKey][eventType](snapshot, prevChildKey)

              if (eventType == 'value'){
                view.data[dataKey].set(returnValue)
              }
            }
          })

          // Bookkeeping for debugging
          const refKey = ref.toString().replace(/^.*firebaseio.com\//, '')
          M._refs[refKey] = M._refs[refKey] || []
          M._refs[refKey].push({viewName: view.name, view, eventType, handler})
          // console.debug(`on ${view.name}#${view.id} ${refKey} ${eventType}`)

          view._data[dataKey].handlers[eventType] = handler
        }
      }
    }).start().force()
  }

  view.on.unmount(() => {
    if (view.debug) {
      console.log(`${view.name}#${view.id} on.unmount`)
    }

    for (let dataKey in view._data) {
      view._data[dataKey].refReactor.stop()

      const oldRef = view._data[dataKey].oldRef

      for (let eventType in view._data[dataKey].handlers) {
        const handler = view._data[dataKey].handlers[eventType]
        oldRef.off(eventType, handler)
        delete view._data[dataKey].handlers[eventType]

        // Bookkeeping for debugging
        const refKey = oldRef.toString().replace(/^.*firebaseio.com\//, '')
        const i = M._refs[refKey].findIndex(log => {
          return log.eventType == eventType && log.handler == handler
        })
        M._refs[refKey].splice(i, 1)
        if (M._refs[refKey].length == 0) {
          delete M._refs[refKey]
        }
        // console.debug(`off ${view.name}#${view.id} ${refKey} ${eventType}`)
      }
    }
  })

  return view.data
}

let nextId = 0
window.views = {}

const decorator = (view) => {
  nextId += 1
  view.id = nextId

  if (view.name != 'Main' && !view.mContext) {
    initContext(view, {})
  }

  const addContextToTree = (tree) => {
    let contextValues
    if (view.name == 'Main') {
      contextValues = {}
      for (contextName in M.context) {
        contextValues[contextName] = M.context[contextName].get()
      }
      contextValues = IMap(contextValues)
    } else {
      contextValues = view.props.mContext
    }

    if (tree instanceof Array || (tree && typeof tree == 'object' && (
      tree instanceof List || (window.Symbol && tree[Symbol.iterator])
    ))) {
      return tree.map(addContextToTree)
    } else if (tree && typeof tree == 'object') {
      const newTree = Object.assign({}, tree)
      newTree.props = Object.assign({mContext: contextValues}, newTree.props)
      if (newTree.props.children) {
        newTree.props.children = addContextToTree(newTree.props.children)
      }
      return newTree
    } else {
      return tree
    }
  }

  const contentMakers = view.renders
  const NOT_RENDERING_YET = {}

  const renderDerivations = contentMakers.map((contentMaker, i) => {
    const renderDerivationI = derivation(() => {
      if (view.isRendering) {
        if (view.debug) {
          console.log(`Render ${view.name}#${view.id}[${i}]`)
        }

        const tree = contentMaker.call(view)
        if (view.debug) {
          console.log(`Add context to ${view.name}#${view.id}[${i}]`, tree)
        }

        // Call these getters to set up a dependency between every component's
        // render function and its view of the context.
        for (let contextName in M.context) {
          if (view.name == 'Main') {
            M.context[contextName].get()
          } else {
            view.mContext[contextName].get()
          }
        }

        return addContextToTree(tree)
      } else {
        if (view.debug) {
          console.log(`Premature ${view.name}#${view.id}[${i}]`)
        }
        renderDerivationI.fakeEntropy.get()
        view.update()
        return NOT_RENDERING_YET
      }
    })

    renderDerivationI.fakeEntropy = atom(0)

    return renderDerivationI
  })

  view.renders = renderDerivations.map((d, i) => () => {
    const dValue = d.get()
    let tree
    if (dValue === NOT_RENDERING_YET) {
      d.fakeEntropy.set(d.fakeEntropy.get() + 1)
      tree = d.get()
    } else {
      tree = dValue
    }
    if (view.debug) {
      console.log(`Tree for ${view.name}#${view.id}[${i}]`, tree)
    }
    return tree
  })

  const renderReactors = renderDerivations.map((d, i) => d.reactor(() => {
    view.update()
  }))

  view.on.mount(() => {
    window.views[view.id] = view
    renderReactors.forEach(reactor => reactor.start())
  })

  view.on.unmount(() => {
    renderReactors.forEach(reactor => reactor.stop())
    delete window.views[view.id]
  })

  view.on.props(() => {
    if (view.debug) {
      console.info(
        view.name, view.id, 'on props', view.props,
        view.isRendering, view.mounted
      )
    }

    // Update view.prop atoms
    if (!view.mounted) {
      if (!view.firstRender && view.debug) {
        console.log(`Ignoring ${view.name}#${view.id}.on.props`)
      }
      return
    }

    transact(() => {
      if (view.prop) {
        for (propName in view.props) {
          if (view.prop[propName]) {
            view.prop[propName].set(view.props[propName])
          }
        }
      }
      if (view.mContext) {
        view.props.mContext.forEach((contextValue, contextName) => {
          if (contextName in view.mContext) {
            if (view.debug) {
              console.log(`Set context on ${view.name}#${view.id}: ` +
                `${contextName}=${JSON.stringify(contextValue)}`
              )
            }
            view.mContext[contextName].set(contextValue)
          }
        })
      }
    })
  })

  view.shouldUpdate(() => false)

  view.findId = (elemId) => {
    const domNode = ReactDOM.findDOMNode(view)
    return (
      domNode.getElementsByTagName(elemId)[0] ||
      domNode.getElementsByClassName(elemId)[0]
    )
  }
}

Flint.decorateViews(decorator)

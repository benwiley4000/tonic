const test = require('tape')
const Tonic = require('..')

test('sanity', t => {
  t.ok(true)
  t.end()
})

test('attach to dom', t => {
  class ComponentA extends Tonic {
    render () {
      return `<div></div>`
    }
  }

  document.body.innerHTML = `
    <component-a></component-a>
  `

  Tonic.add(ComponentA)

  const div = document.querySelector('div')
  t.ok(div, 'a div was created and attached')
  t.end()
})

test('pass props', t => {
  const d = { message: 'hello' }

  document.body.innerHTML = `

    <component-b
      id="x"
      test-item="true"
      disabled
      empty=''
      data='${JSON.stringify(d)}'>
    </component-b>

  `

  Tonic.add(class ComponentB extends Tonic {
    connected () {
      this.root.setAttribute('id', this.props.id)
      t.equal(this.props.disabled, 'disabled', 'disabled property was found')
      t.ok(this.props.testItem, 'automatically camelcase props')
    }
    render () {
      return `<div>${this.props.data.message}</div>`
    }
  })

  const div1 = document.querySelector('div')
  const div2 = document.getElementById('x')
  t.equal(div1.textContent, 'hello', 'div contains the prop value')
  t.ok(div2)

  const expectedProps = {
    id: 'x',
    testItem: 'true',
    disabled: 'disabled',
    empty: 'empty',
    data: {
      message: 'hello'
    }
  }

  t.deepEqual(div2.getProps(), expectedProps, 'get props matches expected')
  t.end()
})

test('get element by id and set properties via the api', t => {
  document.body.innerHTML = `
    <component-c number=1></component-c>
  `

  class ComponentC extends Tonic {
    willConnect () {
      this.root.setAttribute('id', 'test')
    }
    render () {
      return `<div>${this.props.number}</div>`
    }
  }

  Tonic.add(ComponentC)

  {
    const div = document.getElementById('test')
    t.ok(div, 'a component was found by its id')
    t.equal(div.textContent, '1', 'initial value is set by props')
    t.ok(div.setProps, 'a component has the setProps method')
  }

  const div = document.getElementById('test')
  div.setProps({ number: 2 })
  t.equal(div.textContent, '2', 'the value was changed by setProps')
  t.end()
})

test('construct from api', t => {
  document.body.innerHTML = ''

  class ComponentD extends Tonic {
    render () {
      return `<div number="${this.props.number}"></div>`
    }
  }

  Tonic.add(ComponentD)
  const d = new ComponentD()
  document.body.appendChild(d.root)

  d.setProps({ number: 3 })
  const div1 = document.body.querySelector('div')
  t.equal(div1.getAttribute('number'), '3', 'attribute was set in component')

  d.setProps({ number: 6 })
  const div2 = document.body.querySelector('div')
  t.equal(div2.getAttribute('number'), '6', 'attribute was set in component')
  t.end()
})

test('fail to connect before setProps', t => {
  document.body.innerHTML = ''

  class ComponentE extends Tonic {
    render () {
      return `<div number="${this.props.number}"></div>`
    }
  }

  Tonic.add(ComponentE)
  const c = document.createElement('component-e')

  t.ok(!c.setProps, 'Component not yet connected')
  t.end()
})

test('stylesheet & prefixing', t => {
  document.body.innerHTML = `
    <component-f number=1></component-f>
  `

  class ComponentF extends Tonic {
    style () {
      return `component-f div { color: red; }`
    }

    render () {
      return `<div></div>`
    }
  }

  Tonic.add(ComponentF)
  const style = document.head.getElementsByTagName('style')[0]
  const expected = `component-f div { color: red; }`
  t.equal(style.textContent, expected, 'style was prefixed')
  t.end()
})

test('component composition', t => {
  document.body.innerHTML = `
    A Few
    <bar></bar>
    Noisy
    <bar></bar>
    Text Nodes
  `

  class Foo extends Tonic {
    render () {
      return `<div class="foo"></div>`
    }
  }

  class Bar extends Tonic {
    render () {
      return `
        <div class="bar">
          <foo></foo>
          <foo></foo>
        </div>
      `
    }
  }

  Tonic.add(Foo)
  Tonic.add(Bar)

  t.equal(document.body.querySelectorAll('.bar').length, 2, 'two bar divs')
  t.equal(document.body.querySelectorAll('.foo').length, 4, 'four foo divs')
  t.end()
})

test('lifecycle events', t => {
  document.body.innerHTML = `<quxx></quxx>`

  class Bazz extends Tonic {
    constructor (p) {
      super(p)
      t.ok(true, 'calling bazz ctor')
    }

    disconnected () {
      t.ok(true, 'disconnected event fired')
    }
    render () {
      return `<div class="bar"></div>`
    }
  }

  class Quxx extends Tonic {
    constructor (p) {
      super(p)
      t.ok(true, 'calling quxx ctor')
    }

    willConnect () {
      t.ok(true, 'willConnect event fired')
      const expected = `<quxx></quxx>`
      t.equal(document.body.innerHTML, expected, 'nothing added yet')
    }

    connected () {
      t.ok(true, 'connected event fired')
      const expected = `<quxx><div class="quxx"><bazz><div class="bar"></div></bazz></div></quxx>`
      t.equal(document.body.innerHTML, expected, 'rendered')
    }

    render () {
      t.ok(true, 'render event fired')
      return `<div class="quxx"><bazz></bazz></div>`
    }
  }

  Tonic.add(Bazz)
  Tonic.add(Quxx)
  const q = document.querySelector('quxx')
  q.setProps({})
  const refsLength = Tonic.refs.length

  // once again to overwrite the old instances
  q.setProps({})
  t.equal(Tonic.refs.length, refsLength, 'Cleanup, refs correct count')

  // once again to check that the refs length is the same
  q.setProps({})
  t.equal(Tonic.refs.length, refsLength, 'Cleanup, refs still correct count')
  t.end()
})

test('cleanup, ensure exist', t => {
  t.end()
  process.exit(0)
})

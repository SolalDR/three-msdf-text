window.pane = new Tweakpane.Pane()

const demoName = window.location.href.match(/(\w+?)\.html/)

window.state = {
  demo: demoName ? demoName[1] : 'basic',
}

pane
  .addBlade({
    view: 'list',
    label: 'demo',
    options: [
      { text: 'basic', value: 'basic' },
      { text: 'stroke', value: 'stroke' },
      { text: 'pbr', value: 'standard' },
      // {text: 'animation (letter)', value: 'char_animation'},
      // {text: 'animation (fragment)', value: 'frag_animation'},
      // {text: 'editor', value: 'editor'},
    ],
    value: state.demo,
  })
  .on('change', ev => {
    window.location.href = window.location.href.replace(
      /\/[\w.]*?$/,
      `/${ev.value}.html`,
    )
  })

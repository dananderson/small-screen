/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react'
import { main, Style, StyleSheet, FocusGroup, Application, Input } from '../lib/export'

const styles = StyleSheet({
  background: {
    ...Style.absoluteFillObject,
    backgroundColor: '#305093'
  },
  tabControl: {
    flexDirection: 'column',
    ...Style.absoluteFillObject
  },
  tabs: {
    flexDirection: 'row',
    marginLeft: 40,
    marginTop: 20
  },
  page: {
    flex: 1,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFF4'
  },
  tabBackground: {
    ...Style.absoluteFillObject,
    borderRadiusTopLeft: 14,
    borderRadiusTopRight: 14,
    backgroundColor: '#FFF4'
  },
  tab: {
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 5,
    paddingTop: 5,
    marginRight: 10
  },
  tabText: {
    fontFamily: 'Roboto',
    fontSize: 36,
    color: '#999'
  },
  tabTextFocus: {
    fontFamily: 'Roboto',
    fontSize: 36,
    color: 'white'
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  gridImageCell: {
    width: 275,
    height: 275,
    backgroundColor: 'lightgray'
  },
  gridTextCell: {
    width: 275,
    height: 200,
    backgroundColor: 'lightgray',
    marginBottom: 10,
    padding: 5
  },
  image: {
    ...Style.absoluteFillObject,
    padding: 5,
    overflow: 'hidden'
  },
  gamepadDetailsList: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  gamepadDetailsListItem: {
    fontFamily: 'Roboto',
    fontSize: 20,
    marginRight: 10
  },
  gamepadName: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    fontSize: 24
  },
  text: {
    fontFamily: 'Roboto',
    fontSize: 24,
    color: 'black'
  }
})

const Tab = (props) => {
  const [ focused, setFocused ] = useState(false)

  const onFocus = () => {
    setFocused(true)
    props.onTabFocus && props.onTabFocus()
  }

  return (
    <box id={props.id} focusable style={styles.tab} onFocus={onFocus} onBlur={() => setFocused(false)}>
      <div style={styles.tabBackground} visible={focused} />
      <text style={focused ? styles.tabTextFocus : styles.tabText}>{props.children}</text>
    </box>
  )
}

const ImagePage = (props) => {
  return (
    <box style={styles.grid}>
      <box style={styles.gridImageCell}>
        <img style={[ styles.image, { objectFit: 'fill' } ]} src='beach.jpg' />
      </box>
      <box style={styles.gridImageCell}>
        <img style={[ styles.image, { objectFit: 'contain' } ]} src='beach.jpg' />
      </box>
      <box style={styles.gridImageCell}>
        <img style={[ styles.image, { objectFit: 'cover' } ]} src='beach.jpg' />
      </box>
      <box style={styles.gridImageCell}>
        <img style={[ styles.image, { objectFit: 'scale-down' } ]} src='beach.jpg' />
      </box>
    </box>
  )
}

const TextPage = (props) => {
  return (<box style={styles.grid}>
    <box style={styles.gridTextCell}>
      <text style={[ styles.text, { textAlign: 'left', maxLines: 0 } ]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </text>
    </box>
    <box style={styles.gridTextCell}>
      <text style={[ styles.text, { textAlign: 'center', maxLines: 0 } ]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </text>
    </box>
    <box style={styles.gridTextCell}>
      <text style={[ styles.text, { textAlign: 'right', maxLines: 0 } ]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </text>
    </box>
    <box style={styles.gridTextCell}>
      <text style={[ styles.text, { textAlign: 'left', maxLines: 1, textOverflow: 'ellipsis', fontStyle: 'italic' } ]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </text>
    </box>
    <box style={styles.gridTextCell}>
      <text style={[ styles.text, { textAlign: 'left', maxLines: 3, textOverflow: 'clip', fontWeight: 'bold' } ]}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </text>
    </box>
  </box>)
}

const GamepadPage = (props) => {
  let list = []

  for (const gamepad of Input.getGamepads()) {
    list.push(
      <box key={gamepad.id}>
        <text style={styles.gamepadName}>{gamepad.name}</text>
        <box style={styles.gamepadDetailsList}>
          <text style={styles.gamepadDetailsListItem}>{`Instance ID: ${gamepad.id}`}</text>
          <text style={styles.gamepadDetailsListItem}>{`GUID: ${gamepad.uuid}`}</text>
          <text style={styles.gamepadDetailsListItem}>{`Buttons: ${gamepad.buttons.length}`}</text>
          <text style={styles.gamepadDetailsListItem}>{`Axes: ${gamepad.axes.length}`}</text>
        </box>
      </box>
    )
  }

  if (list.length === 0) {
    list.push(<text key={1} style={styles.gamepadName}>No gamepads connected.</text>)
  }

  return (<box style={{ flexDirection: 'column' }}>{list}</box>)
}

const Demo = () => {
  const [ page, setPage ] = useState({ component: ImagePage })
  const Page = page.component

  useEffect(() => {
    Application.getViewById('tab1').requestFocus()
  }, [])

  return (
    <box style={styles.background}>
      <box style={styles.tabControl}>
        <FocusGroup navigation='horizontal' style={styles.tabs}>
          <Tab id='tab1' onTabFocus={() => setPage({ component: ImagePage })}>Image</Tab>
          <Tab id='tab2' onTabFocus={() => setPage({ component: TextPage })}>Text</Tab>
          <Tab id='tab3' onTabFocus={() => setPage({ component: GamepadPage })}>Gamepads</Tab>
        </FocusGroup>
        <box style={styles.page}>
          <Page />
        </box>
      </box>
    </box>
  )
}

main({
  width: 1280,
  height: 720,
  fullscreen: false,
  resourcePath: 'example',
  app: <Demo />,
  start: true,
  title: 'Example App',
  images: [
    // Photo source: https://unsplash.com/photos/TWoL-QCZubY
    'beach.jpg'
  ],
  fonts: [
    // Roboto Font (Apache License, Version 2.0): https://fonts.google.com/specimen/Roboto
    { uri: 'Roboto-Regular.ttf', fontFamily: 'Roboto' },
    { uri: 'Roboto-Bold.ttf', fontFamily: 'Roboto', fontWeight: 'bold' },
    { uri: 'Roboto-Italic.ttf', fontFamily: 'Roboto', fontWeight: 'normal', fontStyle: 'italic' }
  ]
})

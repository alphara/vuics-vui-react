import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Consumer
} from './provider'

class Oscilloscope extends Component {
  static propTypes = {
    canvasWrapperClassName: PropTypes.string.isRequired,
    canvasClassName: PropTypes.string.isRequired
  }

  render = () => (
    <Consumer>
      {
        ({
          getCanvasWrapperRef,
          getCanvasRef,
          width,
          height
        }) => (
          <div
            className={this.props.canvasWrapperClassName}
            ref={getCanvasWrapperRef}
          >
            <canvas
              className={this.props.canvasClassName}
              ref={getCanvasRef}
              width={width}
              height={height}
            />
          </div>
        )
      }
    </Consumer>
  )
}

export default Oscilloscope

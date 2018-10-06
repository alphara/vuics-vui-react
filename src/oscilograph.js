import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Consumer
} from './provider'

class Oscillograph extends Component {
  static propTypes = {
    canvasWrapperClassName: PropTypes.string.isRequired,
    canvasClassName: PropTypes.string.isRequired
  }

  render = () => (
    <Consumer>
      {
        ({
          canvasWrapperRef,
          canvasRef,
          width,
          height
        }) => (
          <div
            className={this.props.canvasWrapperClassName}
            ref={canvasWrapperRef}
          >
            <canvas
              className={this.props.canvasClassName}
              ref={canvasRef}
              width={width}
              height={height}
            />
          </div>
        )
      }
    </Consumer>
  )
}

export default Oscillograph

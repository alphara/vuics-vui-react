import React from 'react'
import PropTypes from 'prop-types'

import {
  Consumer
} from './provider'

const ButtonDefault = ({ className }) => (
  <Consumer>
    {
      ({ onClick, children, state, message }) => (
        <button
          type='button'
          tabIndex='0'
          onClick={onClick}
          className={className}
        >
          {message}
        </button>
      )
    }
  </Consumer>
)

ButtonDefault.propTypes = {
  className: PropTypes.string.isRequired
}

export default ButtonDefault

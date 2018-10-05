import React from 'react'
import PropTypes from 'prop-types'

import {
  Consumer
} from './provider'

const ButtonDefault = ({ className }) => (
  <Consumer>
    {
      ({ buttonRef, onClick, disabled, children, state, message }) => (
        <button
          ref={buttonRef}
          type='button'
          tabIndex='0'
          onClick={onClick}
          className={className}
          disabled={disabled}
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

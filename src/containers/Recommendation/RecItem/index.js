/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as _get } from 'lodash';
import action from '../../../actions';
import stdout from '../../../stdout';

const debug = stdout('container/Home/RecItem');

class RecItem extends React.Component {
  static propTypes = {
    rec: PropTypes.object.isRequired,
    token: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    debug(e.target, this.props.rec);
    const { rateMovie, token, rec } = this.props;
    const score = e.target
    rateMovie(rec.id, 5, token);
  }

  render() {
    const { rec } = this.props;
    return (
      <li key={`rec${rec.id}`}>
        {rec.title}
        <span onClick={this.onClick}>5</span>
      </li>
    );
  }
}

export function mapStateToProps(state) {
  return {
    token: _get(state, 'global.token', ''),
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    rateMovie: (movieId, rating, token) => {
      dispatch(action.rateMovie(movieId, rating, token));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RecItem);

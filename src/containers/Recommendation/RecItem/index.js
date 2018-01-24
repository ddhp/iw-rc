/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as _get } from 'lodash';
import action from '../../../actions';
import stdout from '../../../stdout';
import './style.scss'


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
    const score = e.target.innerHTML;
    rateMovie(rec.id, score, token);
  }

  render() {
    const { rec } = this.props;
    return (
      <li className="rec__item">
        <span className="title">{rec.title}</span>
        <div className="score-wrapper">
          <span className="score" onClick={this.onClick}>5</span>
          <span className="score" onClick={this.onClick}>4</span>
          <span className="score" onClick={this.onClick}>3</span>
          <span className="score" onClick={this.onClick}>2</span>
          <span className="score" onClick={this.onClick}>1</span>
        </div>
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

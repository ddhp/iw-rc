import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { get as _get } from 'lodash';
import action from '../../actions';
import stdout from '../../stdout';
import RecItem from './RecItem';

import './style.scss';

const debug = stdout('container/Home');

export class Home extends React.Component {
  static propTypes = {
    getMe: PropTypes.func.isRequired,
    getRecommendations: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    recs: PropTypes.arrayOf(PropTypes.object),
    liked: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    recs: [],
    liked: [],
  }

  componentDidMount() {
    this.props.getRecommendations(this.props.token);
    this.props.getMe(this.props.token);
  }

  render() {
    debug('render method');
    const { recs, liked } = this.props;
    const recItems = recs.map(r => (
      <RecItem key={`rec${r.id}`} rec={r} />
    ));

    const likedItems = liked.map(r => (
      <li key={`liked${r.id}`}>
        {r.title}
      </li>
    ));
    debug(liked);

    return (
      <div className="page--home">
        <Helmet>
          <title>Home</title>
          <meta name="description" content="home page shows posts" />
          <meta name="og:title" content="home page" />
        </Helmet>

        <div className="liked">
          <h2>Rated</h2>
          <ul>
            {likedItems}
          </ul>
        </div>

        <div className="rec">
          <h2>Recommends</h2>
          <ul>
            {recItems}
          </ul>
        </div>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  const movieEntity = _get(state, 'entities.movie', {});
  const recIds = _get(state, 'pages.rec.recs', []);
  const likedIds = _get(state, 'global.me.liked', []);
  const recs = recIds.map(id => movieEntity[id] || {});
  const liked = likedIds.map(id => movieEntity[id] || {});

  return {
    token: _get(state, 'global.token', ''),
    recs,
    liked,
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    getRecommendations: (token) => {
      dispatch(action.getRecommendations(token));
    },
    getMe: (token) => {
      dispatch(action.getMe(token));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);

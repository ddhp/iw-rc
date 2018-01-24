import update from 'immutability-helper';
import { get as _get, isEqual as _isEqual } from 'lodash';
// import stdout from '../../stdout';
//
// const debug = stdout('reducer:post');
const initialState = {};

export default function postReducer(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case 'GET_RECOMMENDATIONS': {
      const movieEntities = _get(payload, 'entities.movies', {});

      // don't update if there are the same
      if (!_isEqual(movieEntities, state)) {
        return update(state, {
          $merge: movieEntities,
        });
      }
      return state;
    }

    case 'GET_ME': {
      const movieEntities = _get(payload, 'entities.movies', {});

      return update(state, {
        $merge: movieEntities,
      });
    }

    case 'RATE_MOVIE': {
      const movieEntities = _get(payload, 'entities.movies', {});

      return update(state, {
        $merge: movieEntities,
      });
    }

    default:
      return state;
  }
}

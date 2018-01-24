import update from 'immutability-helper';
import { get as _get } from 'lodash';
import stdout from '../../stdout';

const debug = stdout('reducer:rec');

const initialState = {
  recs: [],
};

export default function homeReducer(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case 'GET_RECOMMENDATIONS': {
      const result = _get(payload, 'result', []);
      debug(result);
      return update(state, {
        recs: {
          $set: result,
        },
      });
    }

    case 'RATE_MOVIE': {
      const recommendations = _get(payload, 'result.recommendations', []);
      return update(state, {
        recs: {
          $set: recommendations,
        },
      });
    }

    default:
      return state;
  }
}

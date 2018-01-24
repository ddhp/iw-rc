import update from 'immutability-helper';
import { get as _get } from 'lodash';
// import stdout from '../../stdout';
//
// const debug = stdout('reducer:home');

const initialState = {
  me: {},
};

export default function globalReducer(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case 'LOGIN':
      return update(state, {
        $merge: {
          me: payload,
        },
      });

    case 'SET_TOKEN_IN_COOKIES':
      return update(state, {
        $merge: {
          token: payload,
        },
      });

    case 'GET_ME': {
      const user = payload.entities.users[payload.result];
      return update(state, {
        $merge: {
          me: user,
        },
      });
    }

    case 'RATE_MOVIE': {
      const liked = _get(payload, 'result.allLiked', []);
      return update(state, {
        me: {
          liked: {
            $set: liked,
          },
        },
      });
    }

    default:
      return state;
  }
}

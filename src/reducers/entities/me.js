const initialState = {
  id: 'anonymous',
  name: 'anonymous',
};

export default function meReducer(state = initialState, action) {
  const { payload } = action;
  switch (action.type) {
    case 'UPDATE_ME_ID':
      return Object.assign({}, state, {
        id: payload,
      });

    case 'UPDATE_ME_NAME':
      return Object.assign({}, state, {
        name: payload,
      });

    case 'UPDATE_ME':
      return Object.assign({}, state, payload);

    case 'LOGIN':
      return Object.assign({}, state, payload);

    case 'SET_TOKEN_IN_COOKIES':
      return Object.assign({}, state, { token: payload });

    case 'GET_ME':
      return Object.assign({}, state, payload);

    default:
      return state;
  }
}

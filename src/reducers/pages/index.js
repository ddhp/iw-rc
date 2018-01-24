import { combineReducers } from 'redux';
import homeReducer from './home';
import recReducer from './rec';

export default combineReducers({
  home: homeReducer,
  rec: recReducer,
});

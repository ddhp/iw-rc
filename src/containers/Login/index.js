import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get as _get } from 'lodash';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import action from '../../actions';
import stdout from '../../stdout';
import './style.scss';

const debug = stdout('container/Login');

export class FormPost extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    login: PropTypes.func.isRequired,
  }

  static validateShowError = text => text.length < 256

  static validate = text => text.length > 0 && text.length < 256

  constructor(props) {
    super(props);

    const { location } = props;
    const parsed = queryString.parse(location.search);
    const notice = parsed.ltc ? 'Please login first' : '';
    this.state = {
      usernameValue: '',
      passwordValue: '',
      isShowUsernameInvalid: false,
      isShowPasswordInvalid: false,
      notice,
      errorMessage: '',
    };

    this.onUsernameChanged = this.onUsernameChanged.bind(this);
    this.onPasswordChanged = this.onPasswordChanged.bind(this);
    this.onPostSubmit = this.onPostSubmit.bind(this);
  }

  onUsernameChanged(e) {
    const usernameValue = e.target.value;
    // const isShowUsernameInvalid = !FormPost.validateShowError(usernameValue);
    this.setState({
      usernameValue,
      // isShowUsernameInvalid,
    });
  }

  onPasswordChanged(e) {
    const passwordValue = e.target.value;
    // const isShowPasswordInvalid = !FormPost.validateShowError(passwordValue);
    this.setState({
      passwordValue,
      // isShowPasswordInvalid,
    });
  }

  onPostSubmit(e) {
    e.preventDefault();
    const { usernameValue, passwordValue } = this.state;
    const { login, history } = this.props;
    const payload = {
      username: usernameValue,
      password: passwordValue,
    };
    // if (FormPost.validate(usernameValue)) {
    login(payload)
      .then(() => {
        history.push('/');
      })
      .catch((err) => {
        let resText;
        try {
          resText = JSON.parse(err.response.text);
        } catch (error) {
          debug(error);
        }
        const message = resText.message ? resText.message : 'something went wrong';
        this.setState({
          errorMessage: message,
        });
      });
    // }
  }

  render() {
    const {
      isShowUsernameInvalid,
      isShowPasswordInvalid,
      notice,
      errorMessage,
    } = this.state;

    return (
      <form className="form--post" onSubmit={this.onPostSubmit}>
        <p className="notice">
          {notice}
        </p>
        <div className="form-row">
          <p className="title">User Name</p>
          <input
            className={classNames('input--username', {
              'is-error': isShowUsernameInvalid,
            })}
            value={this.state.usernameValue}
            onChange={this.onUsernameChanged}
          />
        </div>
        <div className="form-row">
          <p className="title">Password</p>
          <input
            type="password"
            className={classNames('input--passwd', {
              'is-error': isShowPasswordInvalid,
            })}
            value={this.state.passwordValue}
            onChange={this.onPasswordChanged}
          />
        </div>
        <p className="error-message">
          {errorMessage}
        </p>
        <div className="btn-wrapper">
          <button className="btn--post-submit" type="submit">Submit</button>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  const entities = _get(state, 'entities');
  const name = _get(entities, 'me.name');

  return {
    name,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login: ({ username, password }) => dispatch(action.login(username, password)),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FormPost));

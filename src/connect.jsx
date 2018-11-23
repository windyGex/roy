import React from 'react';
import ReactDOM from 'react-dom';
import T from 'prop-types';
import Store from './store';
import { isArray } from './utils';

const connect = function (mapStateToProps = state => state) {
    return function withStore(Component) {
        class StoreWrapper extends React.Component {
            static contextTypes = {
                store: T.any
            };
            store = this.context.store || Store.get();
            constructor(props, context) {
                super(props, context);
                this._deps = {};
                this._change = obj => {
                    const state = {};
                    let matched;
                    obj = isArray(obj) ? obj : [obj];
                    for (let index = 0; index < obj.length; index++) {
                        const item = obj[index];
                        const match = Object.keys(this._deps).some(dep => item.key.indexOf(dep) === 0);
                        if (match) {
                            matched = match;
                            state[item.key] = this.store.get(item.key);
                        }
                    }
                    if (matched) {
                        this.setState(state);
                    }
                };
                this._get = data => {
                    this._deps[data.key] = true;
                    console.log(this._deps)
                };
                this.store.on('change', this._change);
                this.store.history = this.store.history || this.props.history;
            }
            componentWillUnmount() {
                this.store.off('change', this._change);
            }
            componentDidMount() {
                const node = ReactDOM.findDOMNode(this);
                node._instance = this;
            }
            beforeRender() {
                this.store.on('get', this._get);
            }
            afterRender() {
                this.store.off('get', this._get);
            }
            render() {
                this.beforeRender();
                const props = mapStateToProps(this.store.state);
                this.afterRender();
                const dispatch = this.store.dispatch;
                return <Component {...this.props} {...props} dispatch={dispatch} />;
            }
        }
        return StoreWrapper;
    };
};

export default connect;

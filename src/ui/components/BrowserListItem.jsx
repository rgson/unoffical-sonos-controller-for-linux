import _ from 'lodash';

import React, { Fragment, Component, PureComponent, createRef } from 'react';
import { connect } from 'react-redux';
import shallowCompare from 'shallow-compare';

import { getClosest } from '../helpers/dom-utility';
import classnames from 'classnames';

import AlbumArt from './AlbumArt';

import {
    select,
    playNow,
    playNext,
    addQueue,
    replaceQueue,
    removeService,
    addService,
} from '../reduxActions/BrowserListActions';

const mapDispatchToProps = (dispatch) => {
    return {
        select: (item) => dispatch(select(item)),
        playNow: (item) => dispatch(playNow(item)),
        playNext: (item) => dispatch(playNext(item)),
        addQueue: (item) => dispatch(addQueue(item)),
        replaceQueue: (item) => dispatch(replaceQueue(item)),
        removeService: (item) => dispatch(removeService(item)),
        addService: (item) => dispatch(addService(item)),
    };
};

class InlineMenu extends PureComponent {
    _playNow = (e) => {
        const item = _.get(this, 'props.model.parent') || this.props.model;
        this.props.playNow(item);
        this.props.toggle(e);
    };

    _playNext = (e) => {
        const item = _.get(this, 'props.model.parent') || this.props.model;
        this.props.playNext(item);
        this.props.toggle(e);
    };

    _addQueue = (e) => {
        const item = _.get(this, 'props.model.parent') || this.props.model;
        this.props.addQueue(item);
        this.props.toggle(e);
    };

    _replaceQueue = (e) => {
        const item = _.get(this, 'props.model.parent') || this.props.model;
        this.props.replaceQueue(item);
        this.props.toggle(e);
    };

    _removeService = (e) => {
        const item = this.props.model;
        this.props.removeService(item.service);
        this.props.toggle(e);
    };

    render() {
        const {
            model: item,
            isExpanded,
            onMouseOut,
            onMouseOver,
            containerRef,
        } = this.props;

        if (!isExpanded) {
            return null;
        }

        const isPlayNow =
            item.class === 'object.item.audioItem' ||
            (item.metadata &&
                item.metadata.class === 'object.item.audioItem.audioBroadcast');

        const isService = item.action === 'service';

        const scrollContainerNode = getClosest(
            containerRef.current,
            '.scrollcontainer'
        );

        const inlineMenutOffset = isPlayNow || isService ? 37 : 37 * 4;

        const { top, height: listItemHeight } = getComputedStyle(
            containerRef.current
        );
        const { height: scrollContainerHeight } = getComputedStyle(
            scrollContainerNode
        );

        const openUpwards =
            parseInt(scrollContainerHeight) - parseInt(top) < inlineMenutOffset;

        const menuTop = openUpwards
            ? 10 - inlineMenutOffset
            : parseInt(listItemHeight) - 10;

        const menuClass = classnames({
            'inline-menu': true,
            upwards: openUpwards,
        });

        const styles = {
            top: `${menuTop}px`,
        };

        return (
            <ul
                style={styles}
                className={menuClass}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
            >
                {isPlayNow ? (
                    <li onClick={this._playNow}>Play Now</li>
                ) : isService ? (
                    <li onClick={this._removeService}>Remove</li>
                ) : (
                    <Fragment>
                        <li onClick={this._playNow}>Play Now</li>
                        <li onClick={this._playNext}>Play Next</li>
                        <li onClick={this._addQueue}>Add to Queue</li>
                        <li onClick={this._replaceQueue}>Replace Queue</li>
                    </Fragment>
                )}
            </ul>
        );
    }
}

export class BrowserListItem extends Component {
    constructor() {
        super();
        this.liRef = createRef();
        this.state = {
            isExpanded: false,
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    }

    componentDidUpdate(prevProps) {
        if (this.props.model !== prevProps.model && this.clickedOnce) {
            console.log('reset');
            this.clickedOnce = false;
            this._delayedClick = null;
        }
    }

    _onClick = () => {
        const item = this.props.model;

        if (
            item.class === 'object.item.audioItem.musicTrack' ||
            item.class === 'object.item.audioItem' ||
            item.trackMetadata
        ) {
            this.props.playNow(item);
        } else if (item.action === 'addService') {
            this.props.addService(item);
        } else {
            this.props.select(item);
        }

        return false;
    };

    handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!this._delayedClick) {
            this._delayedClick = _.debounce(this._onClick, 200);
        }
        if (this.clickedOnce) {
            this._delayedClick.cancel();
            this.clickedOnce = false;
            console.log('double click');
        } else {
            this._delayedClick(e);
            this.clickedOnce = true;
        }
    };

    _toggle = (e) => {
        this.setState({
            isExpanded: !this.state.isExpanded,
        });
        e.preventDefault();
        e.stopPropagation();
    };

    _hideMenu = () => {
        if (this.state.isExpanded) {
            this.setState({
                isExpanded: false,
            });
        }
    };

    _onMouseOut = (e) => {
        this._hideTimeout = window.setTimeout(this._hideMenu, 500);
        e.preventDefault();
        e.stopPropagation();
    };

    _onMouseOver = (e) => {
        if (this._hideTimeout) {
            window.clearTimeout(this._hideTimeout);
        }
        e.preventDefault();
        e.stopPropagation();
    };

    render() {
        let inlineMenuButton;
        const item = this.props.model;
        let className = 'trackinfo';

        let artistInfo;

        if (
            item.class ||
            item.action === 'service' ||
            item.trackMetadata ||
            JSON.parse(String(item.canPlay || 'false')) ||
            JSON.parse(String(_.get(item, 'parent.canPlay') || 'false'))
        ) {
            className = className + ' playable ';

            if (item.class) {
                className = className + /\.([-\w]+)$/gi.exec(item.class)[1];
            }

            if (item.itemType) {
                className = className + item.itemType;
            }

            inlineMenuButton = (
                <i
                    className="material-icons arrow"
                    onClick={this._toggle.bind(this)}
                >
                    arrow_drop_down_circle
                </i>
            );
        }

        const creator =
            item.creator || item.artist || _.get(item, 'trackMetadata.artist');

        const albumArtURI =
            item.albumArtURI || _.get(item, 'trackMetadata.albumArtURI');

        const serviceId =
            _.get(this, 'props.model.service.service.Id') ||
            _.get(this, 'props.model.data.Id');

        if (creator) {
            className += ' with-creator';

            artistInfo = <p className="creator">{creator}</p>;
        }

        return (
            <li
                ref={this.liRef}
                onClick={this.handleClick}
                onMouseOut={this._onMouseOut}
                onMouseOver={this._onMouseOver}
                data-position={this.props.position}
                style={this.props.style}
            >
                <AlbumArt src={albumArtURI} serviceId={serviceId} />

                <div className={className}>
                    <p className="title">{item.title}</p>
                    {artistInfo}
                </div>
                <InlineMenu
                    {...this.props}
                    containerRef={this.liRef}
                    isExpanded={this.state.isExpanded}
                    toggle={this._toggle}
                    onMouseOut={this._onMouseOut}
                    onMouseOver={this._onMouseOver}
                />
                {inlineMenuButton}
            </li>
        );
    }
}

export default connect(null, mapDispatchToProps)(BrowserListItem);

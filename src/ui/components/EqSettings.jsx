import React, { Component } from 'react';
import { connect } from 'react-redux';

import classnames from 'classnames';

import {
    hide,
    setValue,
    select,
    breakPair,
    createPair,
} from '../reduxActions/EqActions';

import { getPlayers } from '../selectors/GroupManagementSelectors';

import ValueSlider from './ValueSlider';

const mapStateToProps = (state) => {
    return {
        ...state.eq,
        players: getPlayers(state),
    };
};

const mapDispatchToProps = {
    hide,
    setValue,
    select,
    breakPair,
    createPair,
};

const toPercentage = (input, min, max) =>
    Math.round(((input - min) * 100) / (max - min));

const fromPercentage = (percentage, min, max) =>
    Math.round((percentage * (max - min)) / 100 + min);

export class EqSettings extends Component {
    state = {
        pairOn: 'LF',
    };

    static getDerivedStateFromProps(nextProps, ownState) {
        const { players, host, visible } = nextProps;

        if (!host || !visible) {
            return null;
        }

        const player = players.find((p) => p.host === host) || players[0];
        const pairablePlayers = players.filter(
            (p) =>
                p.model === player.model &&
                p.UUID !== player.UUID &&
                !p.isPaired
        );

        const pairWith = ownState.pairWith || (pairablePlayers[0] || {}).UUID;

        return {
            pairablePlayers,
            player,
            pairWith,
        };
    }

    _changeValue = (name, value) => {
        const { host, setValue } = this.props;

        setValue({
            host,
            name,
            value,
        });
    };

    _hide = () => {
        this.props.hide();
    };

    _breakPair = (player) => {
        this.props.breakPair(player);
    };

    _createPair = () => {
        const { players } = this.props;
        const { pairOn, pairWith, player } = this.state;

        const { UUID } = player;

        const left = pairOn === 'RF' ? UUID : pairWith;
        const right = pairOn === 'LF' ? UUID : pairWith;

        const target =
            pairOn === 'RF' ? player : players.find((p) => p.UUID === pairWith);

        const channelMap = `${left}:LF,LF;${right}:RF,RF`;

        this.props.createPair(target, channelMap);
    };

    render() {
        const { visible, players, host, eqState } = this.props;

        if (!visible || !host) {
            return null;
        }

        const { bass = 0, treble = 0, loudness = 0, balance = 0 } =
            eqState[host] || {};

        const { pairOn, pairWith, pairablePlayers, player } = this.state;
        const { isStereo, isPaired } = player;

        return (
            <div
                id="eq-settings-management"
                className={classnames({
                    modal: true,
                })}
            >
                <div id="eq-settings-container" className="modal-inner">
                    <h3>EQ {player.ZoneName}</h3>

                    <select
                        className="player-selector"
                        onChange={(e) => this.props.select(e.target.value)}
                        value={host}
                    >
                        {players.map((p) => (
                            <option key={p.UUID} value={p.host}>
                                {p.ZoneName}
                            </option>
                        ))}
                    </select>

                    <div className="row">
                        <span className="label">Bass ({bass})</span>
                        <ValueSlider
                            value={toPercentage(bass, -10, +10)}
                            dragHandler={(percentage) =>
                                this._changeValue(
                                    'bass',
                                    fromPercentage(percentage, -10, +10)
                                )
                            }
                        />
                    </div>

                    <div className="row">
                        <span className="label">Treble ({treble})</span>
                        <ValueSlider
                            value={toPercentage(treble, -10, +10)}
                            dragHandler={(percentage) =>
                                this._changeValue(
                                    'treble',
                                    fromPercentage(percentage, -10, +10)
                                )
                            }
                        />
                    </div>

                    {isStereo ? (
                        <div className="row">
                            <span className="label">
                                Balance (
                                {100 - Math.abs(Math.abs(balance) - 100)}
                                {balance === 0 ? '' : balance > 0 ? 'L' : 'R'})
                            </span>
                            <ValueSlider
                                value={toPercentage(balance, +100, -100)}
                                dragHandler={(percentage) =>
                                    this._changeValue(
                                        'balance',
                                        fromPercentage(percentage, +100, -100)
                                    )
                                }
                            />
                        </div>
                    ) : null}

                    <div className="row">
                        <span className="label">Loudness</span>
                        <input
                            type="checkbox"
                            checked={loudness}
                            value={loudness}
                            onChange={(e) => {
                                this._changeValue(
                                    'loudness',
                                    e.target.value == 1 ? 0 : 1
                                );
                            }}
                        />
                    </div>

                    {isPaired ? (
                        <button
                            onClick={() => this._breakPair(player)}
                            className="cancel-button"
                        >
                            Break stereo pair
                        </button>
                    ) : null}

                    {!isPaired && pairablePlayers.length ? (
                        <div className="row pairing">
                            <button
                                onClick={() => this._createPair()}
                                className="button"
                            >
                                Create stereo pair
                            </button>
                            with
                            <select
                                className="pairing-player-selector"
                                onChange={(e) =>
                                    this.setState({
                                        pairWith: e.target.value,
                                    })
                                }
                                value={pairWith}
                            >
                                {pairablePlayers.map((p) => (
                                    <option key={p.UUID} value={p.UUID}>
                                        {p.ZoneName}
                                    </option>
                                ))}
                            </select>
                            to the
                            <select
                                className="pairing-player-position-selector"
                                onChange={(e) =>
                                    this.setState({
                                        pairOn: e.target.value,
                                    })
                                }
                                value={pairOn}
                            >
                                <option value="LF">Left</option>
                                <option value="RF">Right</option>
                            </select>
                        </div>
                    ) : null}

                    <button onClick={this._hide} className="save-button">
                        Done
                    </button>
                </div>
            </div>
        );
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(EqSettings);

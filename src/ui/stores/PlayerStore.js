import events from 'events';
import _ from "lodash";

import Dispatcher from '../dispatcher/AppDispatcher'
import Constants  from '../constants/Constants'

const CHANGE_EVENT = 'change';

var PlayerStore = _.assign({}, events.EventEmitter.prototype, {

	_playing : false,
	_positionInfo: null,
	_currentTrack: null,
	_nextTrack: null,
	_muted: false,
	_volume: 0,

	emitChange () {
		this.emit(CHANGE_EVENT);
	},

	addChangeListener (listener) {
		this.on(CHANGE_EVENT, listener);
	},

	isPlaying () {
		return this._playing;
	},

	setPlaying (playing) {
		this._playing = playing;
	},

	getPositionInfo () {
		return this._positionInfo ;
	},

	setPositionInfo (info) {
		this._positionInfo = info;
	},

	getCurrentTrack () {
		return this._currentTrack ;
	},

	setCurrentTrack (info) {
		this._currentTrack = info;
	},

	getNextTrack () {
		return this._nextTrack ;
	},

	setNextTrack (info) {
		this._nextTrack = info;
	},

	getMuted () {
		return this._muted ;
	},

	setMuted (muted) {
		this._muted = muted;
	},

	getVolume () {
		return this._volume;
	},

	setVolume (volume) {
		this._volume = volume;
	},
});

Dispatcher.register(action => {
	switch (action.actionType) {

		case Constants.PLAYER_SEEK:
			break;

		case Constants.PLAYER_PAUSE:
			PlayerStore.setPlaying(false);
			PlayerStore.emitChange();
			break;

		case Constants.PLAYER_PLAY:
			PlayerStore.setPlaying(true);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_PLAYSTATE_UPDATE:
			let state = action.state;
			let playing = false;

			if(state === 'transitioning') {
				return;
			}

			if(state === 'playing') {
				playing = true;
			}

			PlayerStore.setPlaying(playing);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_POSITION_INFO_UPDATE:
			PlayerStore.setPositionInfo(action.info);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_CURRENT_TRACK_UPDATE:
			PlayerStore.setCurrentTrack(action.track);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_NEXT_TRACK_UPDATE:
			PlayerStore.setNextTrack(action.track);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_MUTED_UPDATE:
			PlayerStore.setMuted(action.muted);
			PlayerStore.emitChange();
			break;

		case Constants.SONOS_SERVICE_VOLUME_UPDATE:
			PlayerStore.setVolume(action.volume);
			PlayerStore.emitChange();
			break;

		case Constants.ZONE_GROUP_SELECT:
			PlayerStore.setCurrentTrack(null);
			PlayerStore.setNextTrack(null);
			PlayerStore.emitChange();
			break;
	}
});

export default PlayerStore;


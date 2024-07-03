import * as $ from "jquery";
import EventEmitter from "eventemitter3";

const DEBUG = false;

/**
 * Top level ReadiumSDK namespace
 * @namespace
 */
const Globals = {
    /**
     * Current version of the JS SDK
     * @static
     * @return {string} version
     */
    version() {
        return "0.8.0";
    },
    /**
     * @namespace
     */
    Views: {
        /**
         * Landscape Orientation
         */
        ORIENTATION_LANDSCAPE: "orientation_landscape",
        /**
         * Portrait Orientation
         */
        ORIENTATION_PORTRAIT: "orientation_portrait",
    },
    /**
     * @namespace
     */
    Events: {
        /**
         * @event
         */
        READER_INITIALIZED: "ReaderInitialized",
        /**
         * This gets triggered on every page turnover. It includes spine information and such.
         * @event
         */
        PAGINATION_CHANGED: "PaginationChanged",
        /**
         * @event
         */
        SETTINGS_APPLIED: "SettingsApplied",
        /**
         * @event
         */
        FXL_VIEW_RESIZED: "FXLViewResized",
        /**
         * @event
         */
        READER_VIEW_CREATED: "ReaderViewCreated",
        /**
         * @event
         */
        READER_VIEW_DESTROYED: "ReaderViewDestroyed",
        /**
         * @event
         */
        CONTENT_DOCUMENT_LOAD_START: "ContentDocumentLoadStart",
        /**
         * @event
         */
        CONTENT_DOCUMENT_LOADED: "ContentDocumentLoaded",
        /**
         * @event
         */
        CONTENT_DOCUMENT_UNLOADED: "ContentDocumentUnloaded",
        /**
         * @event
         */
        MEDIA_OVERLAY_STATUS_CHANGED: "MediaOverlayStatusChanged",
        /**
         * @event
         */
        MEDIA_OVERLAY_TTS_SPEAK: "MediaOverlayTTSSpeak",
        /**
         * @event
         */
        MEDIA_OVERLAY_TTS_STOP: "MediaOverlayTTSStop",
        /**
         * @event
         */
        PLUGINS_LOADED: "PluginsLoaded",
    },
    /**
     * Internal Events
     *
     * @desc Should not be triggered outside of {@link Views.ReaderView}.
     * @namespace
     */
    InternalEvents: {
        /**
         * @event
         */
        CURRENT_VIEW_PAGINATION_CHANGED: "CurrentViewPaginationChanged",
    },

    logEvent(eventName, eventType, eventSource) {
        if (DEBUG) {
            console.debug(
                `#### ReadiumSDK.Events.${eventName} - ${eventType} - ${eventSource}`
            );
        }
    },
};

$.extend(Globals, new EventEmitter());

export default Globals;

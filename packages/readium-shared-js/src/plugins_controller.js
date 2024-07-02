define(["jquery", "underscore", "eventEmitter"], function ($, _, EventEmitter) {
    var _registeredPlugins = {};

    /**
     * A  plugins controller used to easily add plugins from the host app, eg.
     * ReadiumSDK.Plugins.register("footnotes", function(api){ ... });
     *
     * @constructor
     */
    var PluginsController = function () {
        var self = this;

        this.initialize = function (reader) {
            var apiFactory = new PluginApiFactory(reader);

            if (!reader.plugins) {
                //attach an object to the reader that will be
                // used for plugin namespaces and their extensions
                reader.plugins = {};
            } else {
                throw new Error("Already initialized on reader!");
            }
            _.each(_registeredPlugins, function (plugin) {
                plugin.init(apiFactory);
            });
        };

        this.getLoadedPlugins = function () {
            return _registeredPlugins;
        };

        // Creates a new instance of the given plugin constructor.
        this.register = function (name, optDependencies, initFunc) {
            if (_registeredPlugins[name]) {
                throw new Error(
                    "Duplicate registration for plugin with name: " + name
                );
            }

            var dependencies;
            if (typeof optDependencies === "function") {
                initFunc = optDependencies;
            } else {
                dependencies = optDependencies;
            }

            _registeredPlugins[name] = new Plugin(name, dependencies, function (
                plugin,
                api
            ) {
                if (!plugin.initialized || !api.host.plugins[plugin.name]) {
                    plugin.initialized = true;
                    try {
                        var pluginContext = {};
                        $.extend(pluginContext, new EventEmitter());

                        initFunc.call(pluginContext, api.instance);
                        plugin.supported = true;

                        api.host.plugins[plugin.name] = pluginContext;
                    } catch (ex) {
                        plugin.fail(ex);
                    }
                }
            });
        };
    };

    function PluginApi(reader, plugin) {
        this.reader = reader;
        this.plugin = plugin;
    }

    function PluginApiFactory(reader) {
        this.create = function (plugin) {
            return {
                host: reader,
                instance: new PluginApi(reader, plugin),
            };
        };
    }

    //
    //  The following is adapted from Rangy's Module class:
    //
    //  Copyright (c) 2014 Tim Down
    //
    //  The MIT License (MIT)
    //  Permission is hereby granted, free of charge, to any person obtaining a copy
    //  of this software and associated documentation files (the "Software"), to deal
    //  in the Software without restriction, including without limitation the rights
    //  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    //  copies of the Software, and to permit persons to whom the Software is
    //  furnished to do so, subject to the following conditions:
    //
    //  The above copyright notice and this permission notice shall be included in all
    //  copies or substantial portions of the Software.
    //
    //  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    //  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    //  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    //  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    //  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    //  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    //  SOFTWARE.

    function Plugin(name, dependencies, initializer) {
        this.name = name;
        this.dependencies = dependencies;
        this.initialized = false;
        this.supported = false;
        this.initializer = initializer;
    }

    Plugin.prototype = {
        init: function (apiFactory) {
            var requiredPluginNames = this.dependencies || [];
            for (
                var i = 0,
                    len = requiredPluginNames.length,
                    requiredPlugin,
                    PluginName;
                i < len;
                ++i
            ) {
                PluginName = requiredPluginNames[i];

                requiredPlugin = _registeredPlugins[PluginName];
                if (!requiredPlugin || !(requiredPlugin instanceof Plugin)) {
                    throw new Error(
                        "required Plugin '" + PluginName + "' not found"
                    );
                }

                requiredPlugin.init(apiFactory);

                if (!requiredPlugin.supported) {
                    throw new Error(
                        "required Plugin '" + PluginName + "' not supported"
                    );
                }
            }

            // Now run initializer
            this.initializer(this, apiFactory.create(this));
        },

        fail: function (reason) {
            this.initialized = true;
            this.supported = false;
            throw new Error(
                "Plugin '" + this.name + "' failed to load: " + reason
            );
        },

        warn: function (msg) {
            console.warn("Plugin " + this.name + ": " + msg);
        },

        deprecationNotice: function (deprecated, replacement) {
            console.warn(
                "DEPRECATED: " +
                    deprecated +
                    " in Plugin " +
                    this.name +
                    "is deprecated. Please use " +
                    replacement +
                    " instead"
            );
        },

        createError: function (msg) {
            return new Error("Error in " + this.name + " Plugin: " + msg);
        },
    };

    var instance = new PluginsController();
    return instance;
});

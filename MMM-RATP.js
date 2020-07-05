/*
 * This file is part of MMM-RATP (https://gitlab.com/closingin/mmm-ratp)
 * Copyright (C) 2020 Rémi Weislinger
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

Module.register('MMM-RATP', {
  requiresVersion: '2.1.0',

  /**
   * defaults - The default data that this module will use
   *
   * @type {Object}
   */
  defaults: {
    theme: 'mirror',
    debug: false, // TODO: Actually use this option
    showUpdateAnimation: true, // TODO: Actually use this option

    timetables: {
      title: 'Prochains passages',
      updateInterval: 1 * 60 * 1000, // Every minute
      config: [],
      nextPassesAmount: 2
    },

    traffic: {
      title: 'Infos trafic',
      updateInterval: 10 * 60 * 1000, // Every 10 minutes
      config: [],
      hideWhenNormal: false
    }
  },

  /**
   * setDefaults - Sets the default values for timetables and traffic if the user didn't set them
   *
   * @returns {void} This function doesn't return anything
   */
  setDefaults () {
    Object.keys(this.defaults.timetables).forEach((option) => {
      if (!(option in this.config.timetables)) {
        this.config.timetables[option] = this.defaults.timetables[option];
      }
    });

    Object.keys(this.defaults.traffic).forEach((option) => {
      if (!(option in this.config.traffic)) {
        this.config.traffic[option] = this.defaults.traffic[option];
      }
    });
  },

  /**
   * initializeModule - Registers the functions to call on refresh and runs the first fetch call
   *
   * @returns {void} This function doesn't return anything
   */
  initializeModule () {
    if (this.config.timetables.config.length) {
      setInterval(() => {
        this.sendSocketNotification('FETCH_TIMETABLES', this.config.timetables.config);
      }, this.config.timetables.updateInterval);
    }

    if (this.config.traffic.config.length) {
      setInterval(() => {
        this.sendSocketNotification('FETCH_TRAFFIC', this.config.traffic.config);
      }, this.config.traffic.updateInterval);
    }

    this.sendSocketNotification('FETCH_ALL', {
      timetables: this.config.timetables.config,
      traffic:  this.config.traffic.config
    });
  },

  /**
   * start - See https://docs.magicmirror.builders/development/core-module-file.html#start
   *
   * @returns {void} This function doesn't return anything
   */
  start () {
    this.apiData = { timetables: [], traffic: [] };

    this.setDefaults();
    this.initializeModule();
  },

  /**
   * getScripts - See https://docs.magicmirror.builders/development/core-module-file.html#getscripts
   *
   * @returns {String[]} The scripts to load
   */
  getScripts () {
    return [
      this.file('js/DOMBuilder.js')
    ];
  },

  /**
   * getStyles - See https://docs.magicmirror.builders/development/core-module-file.html#getstyles
   *
   * @returns {String[]} The styles to load
   */
  getStyles () {
    // NOTE: Add your custom theme to this array in order to be able to load it
    const themes = [
      'mirror',
      'dashboard'
    ];

    if (themes.indexOf(this.config.theme) === -1) {
      Log.error(`${this.name}: invalid theme, did you forget to add it to MMM-RATP::getStyles() ?`);
      return;
    }

    return [
      this.file(`${this.name}.css`),
      this.file(`css/${this.name}_positioning.css`),
      this.file(`css/${this.name}_components.css`),
      this.file(`css/themes/${this.name}_theme_${this.config.theme}.css`)
    ];
  },

  /**
   * getDom - See https://docs.magicmirror.builders/development/core-module-file.html#getdom
   *
   * @returns {HTMLElement} The wrapper for the module's content
   */
  getDom () {
    const wrapper = document.createElement('div');

    if (this.apiData.timetables.length) {
      wrapper.append(DOMBuilder.createTimetables(this.apiData.timetables, this.config.timetables));
    }

    if (this.apiData.traffic.length) {
      wrapper.append(DOMBuilder.createTraffic(this.apiData.traffic, this.config.traffic));
    }

    return wrapper;
  },

  /**
   * socketNotificationReceived - See https://docs.magicmirror.builders/development/core-module-file.html#socketnotificationreceived-function-notification-payload
   *
   * @param {String} notification The notification identifier
   * @param {*}      payload      The payload attached to the socket message
   *
   * @returns {void} This function doesn't return anything
   */
  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case 'DATA_ALL':
        this.apiData = payload;
        break;
      case 'DATA_TIMETABLES':
        this.apiData.timetables = payload;
        break;
      case 'DATA_TRAFFIC':
        this.apiData.traffic = payload;
        break;
    }

    this.updateDom();
  }
});
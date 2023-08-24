"use strict";
/***********************************************************************
 * Midea-Lan Homebridge Platform class
 *
 * Copyright (c) 2023 David Kerr
 *
 * Based on https://github.com/homebridge/homebridge-plugin-template
 * With thanks to https://github.com/hillaliy/homebridge-midea-lan
 *
 * This class is the main constructor for the plugin.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MideaPlatform = void 0;
const settings_1 = require("./settings");
const MideaAccessory_1 = require("./MideaAccessory");
// For bridge to midea-beautiful-air that is written in python...
const { py, python } = require('pythonia');
// To access network interface detail...
const os_1 = __importDefault(require("os"));
const Netmask = require('netmask').Netmask;
class MideaPlatform {
    /*********************************************************************
     *
     */
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.accessories = [];
        this.allCachedDeviceIds = [];
        this.mideaAccessories = [];
        this.cloud = {};
        this.log.debug('Finished initializing platform:', this.config.name);
        Error.stackTraceLimit = 100;
        // transform config list of devices into object that can be indexed by deviceId...
        const devices = {};
        if (this.config.devices) {
            this.config.devices.forEach(x => devices[String(x.deviceId).toLowerCase()] = x.config);
        }
        ;
        this.config.devices = devices;
        // Set defaults
        this.config.broadcastRetry ??= 2; // seconds
        this.config.broadcastTimeout ??= 2; // seconds
        this.config.interval ??= 30; // seconds to retrieve device status
        this.config.appCredentials ??= 'NetHomePlus';
        this.config.useDeviceList ??= false;
        this.log.debug(`Config:\n${JSON.stringify(this.config, null, 2)}`);
        this.appCredentials = {
            NetHomePlus: {
                appkey: "3742e9e5842d4ad59c2db887e12449f9",
                appid: 1017,
                api_url: "https://mapp.appsmb.com",
                sign_key: "xhdiwjnchekd4d512chdjx5d8e4c394D2D7S",
                proxied: null,
            },
            MideaAir: {
                appkey: "ff0cf6f5f0c3471de36341cab3f7a9af",
                appid: 1117,
                api_url: "https://mapp.appsmb.com",
                sign_key: "xhdiwjnchekd4d512chdjx5d8e4c394D2D7S",
                proxied: null,
            },
            MSmartHome: {
                appkey: "ac21b9f9cbfe4ca5a88562ef25e2b768",
                appid: 1010,
                api_url: "https://mp-prod.appsmb.com/mas/v5/app/proxy?alias=",
                sign_key: "xhdiwjnchekd4d512chdjx5d8e4c394D2D7S",
                iotkey: "meicloud",
                hmackey: "PROD_VnoClJI9aikS8dyy",
                proxied: "v5",
            },
        };
        api.on('didFinishLaunching', () => {
            this.onReady();
        });
    }
    ;
    /*********************************************************************
     * This function is invoked when homebridge restores cached accessories
     * from disk at startup.
     */
    configureAccessory(accessory) {
        this.log.info(`Loading accessory from cache: ${accessory.displayName}`);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
        // so we can quickly find out if device is already cached
        this.allCachedDeviceIds.push(accessory.context.deviceId);
    }
    ;
    /*********************************************************************
     * onReady
     * Homebridge has finished its initalization.  We now get all Midea devices
     * Logic...
     * 1) If we have a config.devices array then it is assumed to contain valid
     *    ip/Id/Token/Key and we do not do any device discovery, else...
     * 2) Do a local LAN discovery by broadcast, compare resulting list with list
     *    of previously cached accessories, if all previously existed then use
     *    cached list as it already contains Token/Key pairs, else...
     * 3) We need to find Token/Key pairs.  Login to Midea cloud service and do
     *    a local LAN discovery.  Update cached Token/Key pairs and/or register
     *    new Homebridge accessories.
     */
    async onReady() {
        try {
            this.midea_beautiful = await python('midea_beautiful');
            this.log.info('Load "midea_beautiful" successful');
            try {
                let devList = this.config.devices;
                if (devList && this.config.useDeviceList) {
                    // if devList exists then we assume that deviceId/ip/token/key are all
                    // valid and use those.
                    this.log.info('Configure devices from config file devices list');
                    this.log.warn('WARNING: All fields (deviceId/name/ip/token/key/type) are assumed to be present and correct');
                }
                else {
                    // Nothing defined in config file. Do a local LAN discovery
                    devList = await this.getDeviceList(null);
                    if (!Object.keys(devList).every(elem => this.allCachedDeviceIds.includes(elem))) {
                        // We have discovered new devices not previously cached, re-do discovery
                        // with cloud login so that we can retrieve token/key pairs for each device.
                        this.log.info('Something changed, login to cloud to retrieve new token/key pairs');
                        this.cloud = await this.login();
                        devList = await this.getDeviceList(this.cloud);
                    }
                    ;
                }
                ;
                this.log.debug(`Devices List:\n${JSON.stringify(devList)}`);
                await this.addAccessories(devList);
            }
            catch (e) {
                const msg = (e instanceof Error) ? e.stack : e;
                this.log.error('Fatal error during plugin initialization:\n' + msg);
            }
            ;
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Load "midea_beautiful" failed:\n' + msg);
        }
        ;
    }
    ;
    /*********************************************************************
     * ifBroadcastAddrs
     * find_appliances by default broadcasts to 255.255.255.255 which only gets sent out on the first
     * network interface.  This function finds all network interfaces and returns the broadcast address
     * for each in an array, e.g. ['192.168.1.255', '192.168.100.255'].  If there are multiple interfaces
     * this will cause broadcast to be sent out on each interface so all appliances are properly discovered.
     */
    ifBroadcastAddrs() {
        let list = [];
        try {
            const ifaces = os_1.default.networkInterfaces();
            for (let iface in ifaces) {
                for (let i in ifaces[iface]) {
                    const f = ifaces[iface][i];
                    if (!f.internal && f.family === 'IPv4') {
                        // only IPv4 addresses excluding any loopback interface
                        list.push(new Netmask(f.cidr).broadcast);
                    }
                }
            }
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Fatal error during plugin initialization:\n' + msg);
        }
        this.log.info(`Broadcast addresses: ${JSON.stringify(list)}`);
        return (list);
    }
    /*********************************************************************
     * login
     */
    async login() {
        try {
            const cloud = await this.midea_beautiful.connect_to_cloud$({
                account: this.config.user,
                password: this.config.password,
                ...this.appCredentials[this.config.appCredentials],
            });
            const cloudDict = await cloud.__dict__;
            this.log.debug(cloudDict);
            this.log.info('Login successful');
            return cloud;
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            throw new Error('Login to Midea cloud failed, check user/password credentials\n' + msg);
        }
    }
    /*********************************************************************
     * getDeviceList
     * Find all devices on LAN by sending broadcast over network(s).  If cloud object
     * provided then additionally connect to Midea cloud service to retrieve Token / Key
     */
    async getDeviceList(cloud) {
        let devList = {};
        try {
            let appliances;
            if (cloud) {
                this.log.info('Getting devices with Cloud and LAN discovery');
                appliances = await this.midea_beautiful.find_appliances$({
                    cloud: cloud,
                    addresses: this.ifBroadcastAddrs(),
                    retries: this.config.broadcastRetry,
                    timeout: this.config.broadcastTimeout,
                });
            }
            else {
                this.log.info('Getting devices with local LAN discovey');
                appliances = await this.midea_beautiful.find_appliances$({
                    addresses: this.ifBroadcastAddrs(),
                    retries: this.config.broadcastRetry,
                    timeout: this.config.broadcastTimeout,
                });
            }
            this.log.info(`Found ${await appliances.length} device(s)`);
            this.log.debug(appliances);
            for await (const [index, app] of await py.enumerate(appliances)) {
                // Loop through each device in discovered list and build device list array
                this.log.debug(await app);
                const appJson = this.pythonToJson(await app.state.__dict__.__str__());
                let deviceType = appJson.type;
                if (deviceType.toLowerCase() === 'ac') {
                    deviceType = 172;
                }
                else if (deviceType.toLowerCase() === 'dh') {
                    deviceType = 161;
                }
                else {
                    deviceType = Number(deviceType);
                }
                if (deviceType === 172 || deviceType === 161) {
                    this.log.info(`Found: ${appJson.name} (${appJson.id}) at ${await app.address}`);
                    devList[appJson.id] = {
                        ip: await app.address,
                        token: await app.token,
                        key: await app.key,
                        name: appJson.name,
                        type: deviceType,
                    };
                }
                else {
                    this.log.warn(`Device: ${appJson.name} (${appJson.id}) at ${await app.address} is of unsupported type: ${appJson.type} (${Number(deviceType)})`);
                    this.log.warn('Please open an issue on GitHub with your specific device model');
                }
            }
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Fatal error getting device list:\n' + msg);
        }
        return devList;
    }
    /*********************************************************************
     * addAccessories
     */
    async addAccessories(devList) {
        try {
            let configMsg = '';
            for (const [deviceId, config] of Object.entries(devList)) {
                let accessory = undefined;
                const uuid = this.api.hap.uuid.generate(`MideaLan-${deviceId}`);
                const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
                if (existingAccessory) {
                    accessory = existingAccessory;
                    this.log.info(`Restoring existing accessory from cache: ${accessory.displayName}`);
                    this.log.debug(`Context: ${JSON.stringify(accessory.context)}`);
                }
                else {
                    this.log.info(`Adding new device: ${config.name}`);
                    accessory = new this.api.platformAccessory(config.name, uuid);
                    this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
                }
                accessory.context.deviceId = deviceId; // Should never change
                accessory.context.address = config.ip; // Could change if DHCP reassigned
                accessory.context.type = Number(config.type); // A number
                if (config.token && config.token.length > 0) {
                    this.log.debug('Updating Name/Token/Key in accessory context');
                    accessory.context.token = config.token;
                    accessory.context.key = config.key;
                    accessory.context.name = config.name;
                }
                this.api.updatePlatformAccessories([accessory]);
                // Log configuration that could be copied/pasted into config file
                if (configMsg.length > 0) {
                    configMsg = ',\n  {\n';
                }
                else {
                    configMsg = '  {\n';
                }
                configMsg += `    "deviceId": "${deviceId}",\n`;
                configMsg += `    "config": {\n`;
                configMsg += `      "name": "${accessory.context.name}",\n`;
                configMsg += `      "ip": "${accessory.context.address}",\n`;
                configMsg += `      "token": "${accessory.context.token}",\n`;
                configMsg += `      "key": "${accessory.context.key}",\n`;
                configMsg += `      "type": ${Number(accessory.context.type)}\n`;
                configMsg += `    }\n  }`;
                const ma = new MideaAccessory_1.MideaAccessory(this, accessory);
                await ma.init();
                this.mideaAccessories.push(ma);
            }
            this.log.info(`Devices configuration:\n"devices": [\n${configMsg}\n]`);
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Fatal error adding accessories:\n' + msg);
        }
    }
    /*********************************************************************
     * getDeviceState
     */
    async getDeviceState(device) {
        // serialize sending commands to the device
        const releaseSemaphore = await device.semaphore.acquire('Obtain device semaphore for retrieve');
        try {
            this.log.debug(`Retieving state for accessory: ${device.name} (${device.deviceId})`);
            const appliance = await this.midea_beautiful.appliance_state$({
                address: device.address,
                token: device.token,
                key: device.key,
                appliance_id: device.deviceId,
            });
            device.appliance = appliance;
            this.log.debug(await appliance);
            return this.pythonToJson(await appliance.state.__dict__.__str__());
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            throw new Error('Error in getDeviceState:\n' + msg);
        }
        finally {
            releaseSemaphore();
        }
    }
    ;
    /*********************************************************************
     * sendUpdateToDevice
     */
    async sendUpdateToDevice(device, values) {
        const context = device.accessory.context;
        // serialize sending commands to the device
        const releaseSemaphore = await device.semaphore.acquire('Obtain device semaphore for send command');
        try {
            const appliance = (device.appliance) ? device.appliance :
                await this.midea_beautiful.appliance_state$({
                    address: context.address,
                    token: context.token,
                    key: context.key,
                    appliance_id: context.deviceId,
                });
            this.log.info(`Send command to: ${context.name} (${context.deviceId}): ${JSON.stringify(values)}`);
            await appliance.set_state$(values);
            // set state can take time, log when we return here
            this.log.debug(`Command success to: ${context.name} (${context.deviceId}): ${JSON.stringify(values)}`);
        }
        catch (e) {
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Error setting appliance state:\n' + msg);
        }
        finally {
            releaseSemaphore();
        }
    }
    ;
    /*********************************************************************
     * pythonToJson helper function
     * converts python string objects to javascript objects
     */
    pythonToJson(objectString) {
        try {
            this.log.debug(`PY in: ${objectString}`);
            objectString = objectString
                .replaceAll(/b'[^']*'/g, '\'\'') // binary data bounded in single quotes ignored
                .replaceAll(/b"[^"]*"/g, '\"\"') // binary data bounded in double quotes ignored
                .replaceAll(/: <[^<]*>,/g, ':\'\',')
                .replaceAll('{\'_', '{\'')
                .replaceAll(', \'_', ', \'')
                .replaceAll('\'', '"')
                .replaceAll(': None', ': null')
                .replaceAll(': True', ': true')
                .replaceAll(': False', ': false');
            this.log.debug(`JSON out: ${objectString}`);
            const json = JSON.parse(objectString);
            this.log.debug(`Parsed object:\n${JSON.stringify(json, null, 2)}`);
            return json;
        }
        catch (e) {
            // if something goes wrong don't crash out.  May be temporary problem.
            // Return empty object, hopefully next pass through it will work.
            const msg = (e instanceof Error) ? e.stack : e;
            this.log.error('Error converting from python to json:\n' + msg);
            return {};
        }
        ;
    }
    ;
}
exports.MideaPlatform = MideaPlatform;
;
//# sourceMappingURL=MideaPlatform.js.map
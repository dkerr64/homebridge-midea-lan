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
import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { MideaAccessory } from './MideaAccessory';
export declare class MideaPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    private readonly accessories;
    private readonly allCachedDeviceIds;
    private readonly mideaAccessories;
    private midea_beautiful;
    private cloud;
    private appCredentials;
    /*********************************************************************
     *
     */
    constructor(log: Logger, config: PlatformConfig, api: API);
    /*********************************************************************
     * This function is invoked when homebridge restores cached accessories
     * from disk at startup.
     */
    configureAccessory(accessory: PlatformAccessory): void;
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
    private onReady;
    /*********************************************************************
     * ifBroadcastAddrs
     * find_appliances by default broadcasts to 255.255.255.255 which only gets sent out on the first
     * network interface.  This function finds all network interfaces and returns the broadcast address
     * for each in an array, e.g. ['192.168.1.255', '192.168.100.255'].  If there are multiple interfaces
     * this will cause broadcast to be sent out on each interface so all appliances are properly discovered.
     */
    private ifBroadcastAddrs;
    /*********************************************************************
     * login
     */
    private login;
    /*********************************************************************
     * getDeviceList
     * Find all devices on LAN by sending broadcast over network(s).  If cloud object
     * provided then additionally connect to Midea cloud service to retrieve Token / Key
     */
    private getDeviceList;
    /*********************************************************************
     * addAccessories
     */
    private addAccessories;
    /*********************************************************************
     * getDeviceState
     */
    getDeviceState(device: MideaAccessory): Promise<object>;
    /*********************************************************************
     * sendUpdateToDevice
     */
    sendUpdateToDevice(device: MideaAccessory, values: {
        [attribute: string]: number | boolean;
    }): Promise<void>;
    /*********************************************************************
     * pythonToJson helper function
     * converts python string objects to javascript objects
     */
    private pythonToJson;
}
//# sourceMappingURL=MideaPlatform.d.ts.map
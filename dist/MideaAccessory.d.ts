/***********************************************************************
 * Midea-Lan Platform Accessory class
 *
 * Copyright (c) 2023 David Kerr
 *
 * Based on https://github.com/homebridge/homebridge-plugin-template
 * With thanks to https://github.com/hillaliy/homebridge-midea-lan
 *
 * An instance of this class is created for each accessory the platform registers.
 *
 */
import { PlatformAccessory } from 'homebridge';
import { MideaPlatform } from './MideaPlatform';
import { MideaDeviceType, airconditionerState, dehumidifierState } from './enums/MideaDeviceType';
import Semaphore from 'semaphore-promise';
export declare class MideaAccessory {
    readonly platform: MideaPlatform;
    readonly accessory: PlatformAccessory;
    deviceId: string;
    deviceType: MideaDeviceType;
    name: string;
    model: string;
    address: string;
    token: string;
    key: string;
    firmwareVersion: any;
    semaphore: Semaphore;
    appliance: any;
    deviceState: airconditionerState | dehumidifierState | undefined;
    private temperatureSteps;
    private minTemperature;
    private maxTemperature;
    private minHumidity;
    private maxHumidity;
    private service;
    /*********************************************************************
     *
     */
    constructor(platform: MideaPlatform, accessory: PlatformAccessory);
    /*********************************************************************
     * initialize the accessory.
     */
    init(this: MideaAccessory): Promise<void>;
    /*********************************************************************
     * initialize air conditioner accessory.
     */
    private initAirConditioner;
    /*********************************************************************
     * initialize dehumidifier accessory.
     */
    private initDehumidifier;
    /*********************************************************************
     * retrieve status from device, whether humidifier or air conditioner
     */
    private retrieveDeviceState;
    /*********************************************************************
     * AIR CONDITIONER and DEHUMIDIFIER helper functions follow....
     *
     */
    private handleActiveGet;
    private handleActiveSet;
    private SwingMode;
    private handleSwingModeGet;
    private handleSwingModeSet;
    /*********************************************************************
     * AIR CONDITIONER specific helper functions follow....
     *
     */
    private currentHeaterCoolerState;
    private handleCurrentHeaterCoolerStateGet;
    private targetHeaterCoolerState;
    private handleTargetHeaterCoolerStateGet;
    private handleTargetHeaterCoolerStateSet;
    private handleCurrentTemperatureGet;
    private handleThresholdTemperatureGet;
    private handleThresholdTemperatureSet;
    private rotationSpeed;
    private handleRotationSpeedGet;
    private handleRotationSpeedSet;
    private handleTemperatureDisplayUnitsGet;
    private handleTemperatureDisplayUnitsSet;
    private fanActive;
    private handleFanActiveGet;
    private handleFanActiveSet;
    private handleOutdoorTemperatureGet;
    /*********************************************************************
     * DEHUMIDIFIER specific helper functions follow....
     *
     */
    private currentHumidifierDehumidifierState;
    private handleCurrentHumidifierDehumidifierStateGet;
    private handleTargetHumidifierDehumidifierStateGet;
    private handleTargetHumidifierDehumidifierStateSet;
    private handleCurrentRelativeHumidityGet;
    private handleRelativeHumidityDehumidifierThresholdGet;
    private handleRelativeHumidityDehumidifierThresholdSet;
    private WindSpeed;
    private handleWindSpeedGet;
    private handleWindSpeedSet;
    private handleWaterLevelGet;
}
//# sourceMappingURL=MideaAccessory.d.ts.map
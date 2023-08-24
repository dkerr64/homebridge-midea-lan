"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MideaAccessory = void 0;
const MideaDeviceType_1 = require("./enums/MideaDeviceType");
//import { MideaSwingMode } from './enums/MideaSwingMode';
const MideaOperationalMode_1 = require("./enums/MideaOperationalMode");
const semaphore_promise_1 = __importDefault(require("semaphore-promise"));
class MideaAccessory {
    //private fanService!: Service;
    //private outdoorTemperatureService!: Service;
    /*********************************************************************
     *
     */
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.deviceId = '';
        this.deviceType = MideaDeviceType_1.MideaDeviceType.AirConditioner;
        this.name = '';
        this.model = '';
        this.address = '';
        this.token = '';
        this.key = '';
        this.firmwareVersion = require('../package.json').version;
        this.appliance = undefined;
        this.deviceState = undefined;
        this.temperatureSteps = 1;
        this.minTemperature = 17;
        this.maxTemperature = 30;
        this.minHumidity = 35;
        this.maxHumidity = 85;
        // initialize values from persistent context store
        this.deviceId = accessory.context.deviceId;
        this.deviceType = accessory.context.type;
        this.name = accessory.context.name;
        this.address = accessory.context.address;
        this.token = accessory.context.token;
        this.key = accessory.context.key;
        // We need to serialize requests to each device.  Multiple threads
        // can request state updates for a device at the same time.  This would not be good,
        // so we need a semaphore to make sure we don't send a 2nd request to the same
        // device before prior one has completed.
        this.semaphore = new semaphore_promise_1.default();
        if (this.deviceType === MideaDeviceType_1.MideaDeviceType.AirConditioner) {
            this.model = 'Air Conditioner';
        }
        else if (this.deviceType === MideaDeviceType_1.MideaDeviceType.Dehumidifier) {
            this.model = 'Dehumidifier';
        }
        else
            this.model = 'Undefined';
    }
    ;
    /*********************************************************************
     * initialize the accessory.
     */
    async init() {
        this.platform.log.info('Initialize Accessory:', this.name + ',', 'with ID:', this.deviceId + ',', 'and type:', this.deviceType);
        await this.retrieveDeviceState();
        if (!this.deviceState) {
            throw new Error(`Device ${this.name} (${this.deviceId}) failed to initialize, deviceState is undefined`);
        }
        // if deviceState is defined then we have a supported device type and can proceed to register with Homebridge
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Midea')
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.firmwareVersion)
            .setCharacteristic(this.platform.Characteristic.Model, this.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.deviceId);
        if (this.deviceType === MideaDeviceType_1.MideaDeviceType.AirConditioner) {
            this.initAirConditioner();
        }
        else if (this.deviceType === MideaDeviceType_1.MideaDeviceType.Dehumidifier) {
            this.initDehumidifier();
        }
    }
    ;
    /*********************************************************************
     * initialize air conditioner accessory.
     */
    initAirConditioner() {
        this.service = this.accessory.getService(this.platform.Service.HeaterCooler)
            || this.accessory.addService(this.platform.Service.HeaterCooler);
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.name);
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.handleActiveGet.bind(this, this.deviceState))
            .onSet(this.handleActiveSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
            .onGet(this.handleCurrentHeaterCoolerStateGet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
            .onGet(this.handleTargetHeaterCoolerStateGet.bind(this, this.deviceState))
            .onSet(this.handleTargetHeaterCoolerStateSet.bind(this, this.deviceState))
            .setProps({
            validValues: [
                this.platform.Characteristic.TargetHeaterCoolerState.AUTO,
                this.platform.Characteristic.TargetHeaterCoolerState.HEAT,
                this.platform.Characteristic.TargetHeaterCoolerState.COOL
            ]
        });
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.handleCurrentTemperatureGet.bind(this, this.deviceState))
            .setProps({
            minValue: -100,
            maxValue: 100,
            minStep: 0.1
        });
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .onGet(this.handleThresholdTemperatureGet.bind(this, this.deviceState))
            .onSet(this.handleThresholdTemperatureSet.bind(this, this.deviceState))
            .setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: this.temperatureSteps
        });
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .onGet(this.handleThresholdTemperatureGet.bind(this, this.deviceState))
            .onSet(this.handleThresholdTemperatureSet.bind(this, this.deviceState))
            .setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: this.temperatureSteps
        });
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onGet(this.handleRotationSpeedGet.bind(this, this.deviceState))
            .onSet(this.handleRotationSpeedSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.SwingMode)
            .onGet(this.handleSwingModeGet.bind(this, this.deviceState))
            .onSet(this.handleSwingModeSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
            .onGet(this.handleTemperatureDisplayUnitsGet.bind(this, this.deviceState))
            .onSet(this.handleTemperatureDisplayUnitsSet.bind(this, this.deviceState))
            .setProps({
            validValues: [
                this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT,
                this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS
            ]
        });
        // Update HomeKit every config interval seconds
        setInterval(async () => {
            //this.deviceState = await this.platform.getDeviceState(this) as airconditionerState;
            await this.retrieveDeviceState();
            if (this.deviceState) {
                this.service.updateCharacteristic(this.platform.Characteristic.Active, this.deviceState.running ? 1 : 0);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.currentHeaterCoolerState(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.targetHeaterCoolerState(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.deviceState.indoor_temperature);
                this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, this.deviceState.target_temperature);
                this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, this.deviceState.target_temperature);
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.rotationSpeed(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, this.SwingMode(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits, this.deviceState.fahrenheit);
            }
        }, this.platform.config.interval * 1000);
    }
    /*********************************************************************
     * initialize dehumidifier accessory.
     */
    initDehumidifier() {
        this.service = this.accessory.getService(this.platform.Service.HumidifierDehumidifier)
            || this.accessory.addService(this.platform.Service.HumidifierDehumidifier);
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.name);
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.handleActiveGet.bind(this, this.deviceState))
            .onSet(this.handleActiveSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
            .onGet(this.handleCurrentHumidifierDehumidifierStateGet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
            .onGet(this.handleTargetHumidifierDehumidifierStateGet.bind(this, this.deviceState))
            .onSet(this.handleTargetHumidifierDehumidifierStateSet.bind(this, this.deviceState))
            .setProps({
            validValues: [
                // this.platform.Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER_OR_DEHUMIDIFIER,
                // this.platform.Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER,
                this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER
            ]
        });
        this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.handleCurrentRelativeHumidityGet.bind(this, this.deviceState))
            .setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 1
        });
        this.service.getCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold)
            .onGet(this.handleRelativeHumidityDehumidifierThresholdGet.bind(this, this.deviceState))
            .onSet(this.handleRelativeHumidityDehumidifierThresholdSet.bind(this, this.deviceState))
            .setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 5
        });
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onGet(this.handleWindSpeedGet.bind(this, this.deviceState))
            .onSet(this.handleWindSpeedSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.SwingMode)
            .onGet(this.handleSwingModeGet.bind(this, this.deviceState))
            .onSet(this.handleSwingModeSet.bind(this, this.deviceState));
        this.service.getCharacteristic(this.platform.Characteristic.WaterLevel)
            .onGet(this.handleWaterLevelGet.bind(this, this.deviceState));
        // Update HomeKit every config interval seconds
        setInterval(async () => {
            await this.retrieveDeviceState();
            if (this.deviceState) {
                // Update Homebridge with retreived status
                this.service.updateCharacteristic(this.platform.Characteristic.Active, this.deviceState.running ? 1 : 0);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState, this.currentHumidifierDehumidifierState(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState, this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.deviceState.current_humidity);
                this.service.updateCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold, this.deviceState.target_humidity);
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.WindSpeed(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, this.SwingMode(this.deviceState));
                this.service.updateCharacteristic(this.platform.Characteristic.WaterLevel, this.deviceState.tank_level);
            }
            ;
        }, this.platform.config.interval * 1000);
    }
    /*********************************************************************
     * retrieve status from device, whether humidifier or air conditioner
     */
    async retrieveDeviceState() {
        // Note current status, deviceState will be undefined first time through.
        const running = this.deviceState?.running;
        const mode = this.deviceState?.mode;
        const tank_level = this.deviceState?.tank_level;
        const tank_full = this.deviceState?.tank_full;
        const fan_speed = this.deviceState?.fan_speed;
        const target_humidity = this.deviceState?.target_humidity;
        const target_temperature = this.deviceState?.target_temperature;
        // Retrieve status from the device
        try {
            if (this.deviceType === MideaDeviceType_1.MideaDeviceType.Dehumidifier) {
                this.deviceState = await this.platform.getDeviceState(this);
            }
            else if (this.deviceType === MideaDeviceType_1.MideaDeviceType.AirConditioner) {
                this.deviceState = await this.platform.getDeviceState(this);
            }
            else {
                this.platform.log.error(`Unsupported device type: ${MideaDeviceType_1.MideaDeviceType[this.deviceType]} (${this.deviceType})`);
                return;
            }
        }
        catch (e) {
            // something went wrong retrieving device state.  But it may be recoverable,
            // so catch the error here and return.  Next time might be okay!
            const msg = (e instanceof Error) ? e.stack : e;
            this.platform.log.error('Error retrieving device state:\n' + msg);
            return;
        }
        if (!this.deviceState) {
            // deviceState should never be undefined at this point. A problem with getDeviceState
            // would have thrown an error which would be caught above.  But, test just in case!
            return;
        }
        // Log any changes
        if (running !== this.deviceState.running) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) power: ${(this.deviceState.running) ? 'On' : 'Off'}`);
        }
        ;
        if (mode !== this.deviceState.mode) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) mode: ${this.deviceState.mode}`);
        }
        ;
        if (tank_full !== this.deviceState.tank_full) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) full tank: ${this.deviceState.tank_full}`);
        }
        ;
        if (tank_level !== this.deviceState.tank_level) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) tank level: ${this.deviceState.tank_level}`);
        }
        ;
        if (fan_speed !== this.deviceState.fan_speed) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) fan speed: ${this.deviceState.fan_speed}`);
        }
        ;
        if (target_humidity !== this.deviceState.target_humidity) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) target humidity: ${this.deviceState.target_humidity}`);
        }
        ;
        if (target_temperature !== this.deviceState.target_temperature) {
            this.platform.log.info(`Device ${this.name} (${this.deviceId}) target temperature: ${this.deviceState.target_temperature}`);
        }
        ;
    }
    /*********************************************************************
     * AIR CONDITIONER and DEHUMIDIFIER helper functions follow....
     *
     */
    // Handle requests to get the current value of the "Active" characteristic
    async handleActiveGet(state) {
        this.platform.log.debug(`Triggered Get Active, value: ${state.running}`);
        if (state.running) {
            return this.platform.Characteristic.Active.ACTIVE;
        }
        return this.platform.Characteristic.Active.INACTIVE;
    }
    ;
    // Handle requests to set the "Active" characteristic
    async handleActiveSet(state, value) {
        this.platform.log.debug(`Triggered SET Active To: ${value}`);
        state.running = (value === 1) ? true : false;
        this.platform.sendUpdateToDevice(this, { running: state.running });
    }
    ;
    // Get the current value of the "swingMode" characteristic
    SwingMode(state) {
        if (state.vertical_swing === true || state.horizontal_swing === true) {
            return this.platform.Characteristic.SwingMode.SWING_ENABLED;
        }
        return this.platform.Characteristic.SwingMode.SWING_DISABLED;
    }
    ;
    // Handle requests to get the current value of the "swingMode" characteristic
    async handleSwingModeGet(state) {
        this.platform.log.debug(`Triggered GET SwingMode, value: ${this.SwingMode(state)}`);
        return this.SwingMode(state);
    }
    ;
    // Handle requests to set the "swingMode" characteristic
    async handleSwingModeSet(state, value) {
        this.platform.log.debug(`Triggered SET SwingMode To: ${value}`);
        if (value === 1) {
            state.vertical_swing = true;
            state.horizontal_swing = true;
        }
        else {
            state.vertical_swing = false;
            state.horizontal_swing = false;
        }
        ;
        this.platform.sendUpdateToDevice(this, { vertical_swing: state.vertical_swing, horizontal_swing: state.horizontal_swing });
    }
    ;
    /*********************************************************************
     * AIR CONDITIONER specific helper functions follow....
     *
     */
    currentHeaterCoolerState(state) {
        if (!state.running) {
            return this.platform.Characteristic.CurrentHeaterCoolerState.INACTIVE;
        }
        else if (state.mode === MideaOperationalMode_1.MideaOperationalMode.Cooling) {
            return this.platform.Characteristic.CurrentHeaterCoolerState.COOLING;
        }
        else if (state.mode === MideaOperationalMode_1.MideaOperationalMode.Heating) {
            return this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
        }
        else if (state.indoor_temperature > state.target_temperature) {
            return this.platform.Characteristic.CurrentHeaterCoolerState.COOLING;
        }
        else {
            return this.platform.Characteristic.CurrentHeaterCoolerState.HEATING;
        }
        ;
    }
    ;
    // Handle requests to get the current value of the "CurrentHeaterCoolerState" characteristic
    async handleCurrentHeaterCoolerStateGet(state) {
        this.platform.log.debug('Triggered GET Current HeaterCooler State');
        return this.currentHeaterCoolerState(state);
    }
    ;
    // Get the current value of the "TargetHeaterCoolerState" characteristic
    targetHeaterCoolerState(state) {
        if (state.mode === MideaOperationalMode_1.MideaOperationalMode.Cooling) {
            return this.platform.Characteristic.TargetHeaterCoolerState.COOL;
        }
        else if (state.mode === MideaOperationalMode_1.MideaOperationalMode.Heating) {
            return this.platform.Characteristic.TargetHeaterCoolerState.HEAT;
        }
        else
            return this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
    }
    ;
    // Handle requests to get the current value of the "TargetHeaterCoolerState" characteristic
    async handleTargetHeaterCoolerStateGet(state) {
        this.platform.log.debug('Triggered GET Target HeaterCooler State');
        return this.targetHeaterCoolerState(state);
    }
    ;
    // Handle requests to set the "TargetHeaterCoolerState" characteristic
    async handleTargetHeaterCoolerStateSet(state, value) {
        this.platform.log.debug(`Triggered SET HeaterCooler State To: ${value}`);
        if (value === this.platform.Characteristic.TargetHeaterCoolerState.AUTO) {
            state.mode = MideaOperationalMode_1.MideaOperationalMode.Auto;
        }
        else if (value === this.platform.Characteristic.TargetHeaterCoolerState.COOL) {
            state.mode = MideaOperationalMode_1.MideaOperationalMode.Cooling;
        }
        else if (value === this.platform.Characteristic.TargetHeaterCoolerState.HEAT) {
            state.mode = MideaOperationalMode_1.MideaOperationalMode.Heating;
        }
        ;
        this.platform.sendUpdateToDevice(this, { mode: state.mode });
    }
    ;
    // Handle requests to get the current value of the "CurrentTemperature" characteristic
    async handleCurrentTemperatureGet(state) {
        this.platform.log.debug('Triggered GET CurrentTemperature');
        return state.indoor_temperature;
    }
    ;
    // Handle requests to get the current value of the "ThresholdTemperature" characteristic
    async handleThresholdTemperatureGet(state) {
        this.platform.log.debug('Triggered GET ThresholdTemperature');
        return state.target_temperature;
    }
    ;
    // Handle requests to set the "ThresholdTemperature" characteristic
    async handleThresholdTemperatureSet(state, value) {
        if (state.fahrenheit === true) {
            this.platform.log.debug(`Triggered SET ThresholdTemperature To: ${value}˚F`);
        }
        else {
            this.platform.log.debug(`Triggered SET ThresholdTemperature To: ${value}˚C`);
        }
        ;
        if (state.target_temperature !== value) {
            state.target_temperature = value;
            this.platform.sendUpdateToDevice(this, { target_temperature: state.target_temperature });
        }
        ;
    }
    ;
    // Get the current value of the "RotationSpeed" characteristic
    rotationSpeed(state) {
        // values from device are 20.0="Silent",40.0="Low",60.0="Medium",80.0="High",102.0="Auto"
        // convert to good usable slider in homekit in percent
        let currentValue = 0;
        if (state.fan_speed === 40) {
            currentValue = 25;
        }
        else if (state.fan_speed === 60) {
            currentValue = 50;
        }
        else if (state.fan_speed === 80) {
            currentValue = 75;
        }
        else {
            currentValue = 100;
        }
        ;
        return currentValue;
    }
    ;
    // Handle requests to get the current value of the "RotationSpeed" characteristic
    async handleRotationSpeedGet(state) {
        this.platform.log.debug('Triggered GET RotationSpeed');
        return this.rotationSpeed(state);
    }
    ;
    // Handle requests to set the "RotationSpeed" characteristic
    async handleRotationSpeedSet(state, value) {
        this.platform.log.debug(`Triggered SET RotationSpeed To: ${value}`);
        // transform values in percent
        // values from device are: 20="Silent",40="Low",60="Medium",80="High",100="Full",102="Auto"
        const percent = value;
        if (percent <= 25) {
            state.fan_speed = 40;
        }
        else if (percent > 25 && percent <= 50) {
            state.fan_speed = 60;
        }
        else if (percent > 50 && percent <= 75) {
            state.fan_speed = 80;
        }
        else {
            state.fan_speed = 102;
        }
        ;
        this.platform.sendUpdateToDevice(this, { fan_speed: state.fan_speed });
    }
    ;
    // Handle requests to get the current value of the "Temperature Display Units" characteristic
    async handleTemperatureDisplayUnitsGet(state) {
        this.platform.log.debug('Triggered GET Temperature Display Units');
        if (state.fahrenheit === true) {
            return this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
        }
        ;
        return this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
    }
    ;
    // Handle requests to set the "Temperature Display Units" characteristic
    async handleTemperatureDisplayUnitsSet(state, value) {
        this.platform.log.debug(`Triggered SET Temperature Display Units To: ${value}`);
        if (value === 1) {
            state.fahrenheit = true;
        }
        else {
            state.fahrenheit = false;
        }
        ;
        this.platform.sendUpdateToDevice(this, { fahrenheit: state.fahrenheit });
    }
    ;
    // Get the current value of the "FanActive" characteristic
    fanActive(state) {
        if (state.mode === MideaOperationalMode_1.MideaOperationalMode.FanOnly && state.running) {
            return this.platform.Characteristic.Active.ACTIVE;
        }
        return this.platform.Characteristic.Active.INACTIVE;
    }
    ;
    // Handle requests to get the current status of "Fan Mode" characteristic
    async handleFanActiveGet(state) {
        this.platform.log.debug('Triggered GET FanMode');
        return this.fanActive(state);
    }
    ;
    // Handle requests to set the "Fan Mode" characteristic
    async handleFanActiveSet(state, value) {
        this.platform.log.debug(`Triggered SET FanMode To: ${value}`);
        if (value === 1 && state.running) {
            state.mode = MideaOperationalMode_1.MideaOperationalMode.FanOnly;
        }
        else if (value === 1 && !state.running) {
            state.running = true;
            state.mode = MideaOperationalMode_1.MideaOperationalMode.FanOnly;
        }
        else if (value === 0 && state.running) {
            state.running = false;
        }
        ;
        this.platform.sendUpdateToDevice(this, { running: state.running, mode: state.mode });
    }
    ;
    // Outdoor Temperature Sensor
    // Handle requests to get the current value of the "OutdoorTemperature" characteristic
    async handleOutdoorTemperatureGet(state) {
        this.platform.log.debug(`Triggered GET CurrentTemperature, value: ${state.outdoor_temperature}`);
        return state.outdoor_temperature;
    }
    ;
    /*********************************************************************
     * DEHUMIDIFIER specific helper functions follow....
     *
     */
    currentHumidifierDehumidifierState(state) {
        if (!state.running) {
            // Powered off, must be inactive
            return this.platform.Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
        }
        else {
            // Powered on, check mode
            if (state.mode === MideaOperationalMode_1.MideaDehumidifierMode.Continuous ||
                state.mode === MideaOperationalMode_1.MideaDehumidifierMode.Dryer || state.mode === MideaOperationalMode_1.MideaDehumidifierMode.Maximum) {
                // Dehumidifying
                return this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
            }
            else if (state.mode === MideaOperationalMode_1.MideaDehumidifierMode.Auto) {
                // Whether deumidifying depends on whether we have reached target
                if (state.current_humidity < state.target_humidity) {
                    return this.platform.Characteristic.CurrentHumidifierDehumidifierState.IDLE;
                }
                else {
                    return this.platform.Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
                }
            }
            ;
            return this.platform.Characteristic.CurrentHumidifierDehumidifierState.IDLE;
        }
        ;
    }
    ;
    // Handle requests to get the current value of the "HumidifierDehumidifierState" characteristic
    async handleCurrentHumidifierDehumidifierStateGet(state) {
        this.platform.log.debug(`Triggered GET CurrentHumidifierDehumidifierState, value: ${state.running},${state.mode}`);
        return this.currentHumidifierDehumidifierState(state);
    }
    ;
    // Handle requests to get the target value of the "HumidifierDehumidifierState" characteristic
    async handleTargetHumidifierDehumidifierStateGet(state) {
        this.platform.log.debug(`Triggered GET TargetHumidifierDehumidifierState, value: ${this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER}`);
        // Always return that we are a dehumidifier, other states not supported.
        return this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER;
    }
    ;
    // Handle requests to set the target value of the "HumidifierDehumidifierState" characteristic
    async handleTargetHumidifierDehumidifierStateSet(state, value) {
        this.platform.log.debug(`Triggered SET TargetHumidifierDehumidifierState To: ${value}`);
        if (value !== this.platform.Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER) {
            throw new Error(`Device ${this.name} (${this.deviceId}) can only be a DeHumidifier, illegal value: ${value}`);
        }
    }
    ;
    // Handle requests to get the current value of the "RelativeHumidity" characteristic
    async handleCurrentRelativeHumidityGet(state) {
        this.platform.log.debug(`Triggered GET CurrentRelativeHumidity, value: ${state.current_humidity}`);
        return state.current_humidity;
    }
    ;
    // Handle requests to get the Relative value of the "HumidityDehumidifierThreshold" characteristic
    async handleRelativeHumidityDehumidifierThresholdGet(state) {
        this.platform.log.debug(`Triggered GET RelativeHumidityDehumidifierThreshold, value: ${state.target_humidity}`);
        return state.target_humidity;
    }
    ;
    // Handle requests to set the Relative value of the "HumidityDehumidifierThreshold" characteristic
    async handleRelativeHumidityDehumidifierThresholdSet(state, value) {
        let RequestedHumidity = value;
        // valid humidity has to be between min and max values
        state.target_humidity = (RequestedHumidity < this.minHumidity) ? this.minHumidity : (RequestedHumidity > this.maxHumidity) ? this.maxHumidity : RequestedHumidity;
        this.platform.log.debug(`Triggered SET RelativeHumidityDehumidifierThreshold To: ${state.target_humidity} (${RequestedHumidity})`);
        this.platform.sendUpdateToDevice(this, { target_humidity: state.target_humidity });
        // Update HomeKit in case we adjusted the value outside of min and max values
        if (state.target_humidity !== RequestedHumidity) {
            // calling updateCharacteristic within set handler seams to fail, new value is not accepted.  Workaround is
            // to request the update after short delay (say 50ms) to allow homebridge/homekit to complete the set handler.
            setTimeout(() => {
                this.service.updateCharacteristic(this.platform.Characteristic.RelativeHumidityDehumidifierThreshold, state.target_humidity);
            }, 50);
        }
        ;
    }
    ;
    // Get the current value of the "WindSpeed" characteristic
    WindSpeed(state) {
        // values from device are 40="Silent",60="Medium",80="High"
        // convert to good usable slider in homekit in percent
        if (state.fan_speed === 40) {
            return 30;
        }
        else if (state.fan_speed === 60) {
            return 60;
        }
        else if (state.fan_speed === 80) {
            return 100;
        }
        ;
        return 0;
    }
    ;
    // Handle requests to get the current value of the "RotationSpeed" characteristic
    async handleWindSpeedGet(state) {
        this.platform.log.debug(`Triggered GET WindSpeed, value: ${this.WindSpeed(state)}`);
        return this.WindSpeed(state);
    }
    ;
    // Handle requests to set the "RotationSpeed" characteristic
    async handleWindSpeedSet(state, value) {
        this.platform.log.debug(`Triggered SET WindSpeed To: ${value}`);
        // transform values in percent
        // values from device are 40.0="Silent",60.0="Medium",80.0="High"
        const percent = value;
        if (percent <= 30) {
            state.fan_speed = 40;
        }
        else if (percent > 30 && percent <= 60) {
            state.fan_speed = 60;
        }
        else if (percent > 60 && percent <= 100) {
            state.fan_speed = 80;
        }
        ;
        this.platform.sendUpdateToDevice(this, { fan_speed: state.fan_speed });
    }
    ;
    // Handle requests to get the current value of the "WaterLevel" characteristic
    async handleWaterLevelGet(state) {
        this.platform.log.debug(`Triggered GET WaterLevel, value: ${state.tank_level}`);
        return state.tank_level;
    }
    ;
}
exports.MideaAccessory = MideaAccessory;
;
//# sourceMappingURL=MideaAccessory.js.map
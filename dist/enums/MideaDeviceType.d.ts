import { MideaOperationalMode, MideaDehumidifierMode } from './MideaOperationalMode';
export declare enum MideaDeviceType {
    Plug = 16,
    RemoteController = 17,
    AirBox = 18,
    Light = 19,
    Curtain = 20,
    MBox = 27,
    Dehumidifier = 161,
    AirConditioner = 172,
    MicroWaveOven = 176,
    BigOven = 177,
    SteamerOven = 178,
    Sterilizer = 179,
    Toaster = 180,
    Hood = 182,
    Hob = 183,
    VacuumCleaner = 184,
    Induction = 185,
    Refrigerator = 202,
    MDV = 204,
    AirWaterHeater = 205,
    PulsatorWasher = 218,
    DurmWasher = 219,
    ClothesDryer = 220,
    DishWasher = 225,
    ElectricWaterHeater = 226,
    GasWaterHeater = 227,
    RiceCooker = 234,
    InductionCooker = 235,
    PressureCooker = 236,
    WaterPurifier = 237,
    SoybeanMachine = 239,
    ElectricFanner = 250,
    ElectricHeater = 251,
    AirPurifier = 252,
    Humidifier = 253,
    AirConditionFanner = 254,
    AllType = 255
}
export type dehumidifierState = {
    id: string;
    type: string;
    online: boolean;
    error: number;
    latest_data: string;
    capabilities: {
        fan_speed: number;
        filter: number;
        dry_clothes: number;
        water_level: number;
        [key: string]: any;
    };
    capabilities_data: string;
    running: boolean;
    ion_mode: boolean;
    mode: MideaDehumidifierMode;
    target_humidity: number;
    current_humidity: number;
    fan_speed: number;
    tank_full: boolean;
    current_temperature: number;
    defrosting: boolean;
    filter_indicator: boolean;
    pump: boolean;
    sleep: boolean;
    beep_prompt: boolean;
    tank_level: number;
    vertical_swing: boolean;
    pump_switch_flag: boolean;
    [key: string]: any;
};
export type airconditionerState = {
    id: string;
    type: string;
    online: boolean;
    error: number;
    latest_data: string;
    capabilities: {
        fan_speed: number;
        filter: number;
        dry_clothes: number;
        water_level: number;
        [key: string]: any;
    };
    capabilities_data: string;
    running: boolean;
    ion_mode: boolean;
    mode: MideaOperationalMode;
    fan_speed: number;
    tank_full: boolean;
    current_temperature: number;
    defrosting: boolean;
    filter_indicator: boolean;
    pump: boolean;
    sleep: boolean;
    beep_prompt: boolean;
    vertical_swing: boolean;
    pump_switch_flag: boolean;
    horizontal_swing: boolean;
    target_temperature: number;
    indoor_temperature: number;
    outdoor_temperature: number;
    fahrenheit: boolean;
    turbo_fan: boolean;
    eco_mode: boolean;
    turbo: boolean;
    purifier: boolean;
    dryer: boolean;
    comfort_sleep: boolean;
    show_screen: boolean;
    [key: string]: any;
};
//# sourceMappingURL=MideaDeviceType.d.ts.map
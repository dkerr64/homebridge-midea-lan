import { MideaOperationalMode, MideaDehumidifierMode } from './MideaOperationalMode';


export enum MideaDeviceType {
    Plug = 0x10,
    RemoteController = 0x11,
    AirBox = 0x12,
    Light = 0x13,
    Curtain = 0x14,
    MBox = 0x1B,

    Dehumidifier = 0xA1,
    AirConditioner = 0xAC,

    MicroWaveOven = 0xB0,
    BigOven = 0xB1,
    SteamerOven = 0xB2,
    Sterilizer = 0xB3,
    Toaster = 0xB4,
    Hood = 0xB6,
    Hob = 0xB7,
    VacuumCleaner = 0xB8,
    Induction = 0xB9,

    Refrigerator = 0xCA,
    MDV = 0xCC,
    AirWaterHeater = 0xCD,

    PulsatorWasher = 0xDA,
    DurmWasher = 0xDB,
    ClothesDryer = 0xDC,

    DishWasher = 0xE1,
    ElectricWaterHeater = 0xE2,
    GasWaterHeater = 0xE3,
    RiceCooker = 0xEA,
    InductionCooker = 0xEB,
    PressureCooker = 0xEC,
    WaterPurifier = 0xED,
    SoybeanMachine = 0xEF,

    ElectricFanner = 0xFA,
    ElectricHeater = 0xFB,
    AirPurifier = 0xFC,
    Humidifier = 0xFD,
    AirConditionFanner = 0xFE,

    AllType = 0xFF
};

export type dehumidifierState = {
    id: string;
    type: string;                       // hex string, 0xa1 as above
    online: boolean;                    // is device online
    error: number;                      // hopefully always zero
    latest_data: string;                // empty string
    capabilities: {
        fan_speed: number;
        filter: number;
        dry_clothes: number;
        water_level: number;
        [key: string]: any;             // in case something else comes along
    };
    capabilities_data: string;          // empty string
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
    [key: string]: any;                 // in case something else comes along
};

export type airconditionerState = {
    id: string;
    type: string;                       // hex string, 0xac as above
    online: boolean;                    // is device online
    error: number;                      // hopefully always zero
    latest_data: string;                // empty string
    capabilities: {
        fan_speed: number;
        filter: number;
        dry_clothes: number;
        water_level: number;
        [key: string]: any;             // in case something else comes along
    };
    capabilities_data: string;          // empty string
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
    [key: string]: any;             // in case something else comes along
};
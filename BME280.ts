/**
 * makecode BME280 digital pressure and humidity sensor Package.
 * teenkit 彩虹mate板载温湿度、大气压传感器插件
 * www.rootbrother.com
 */

enum BME280_I2C_ADDRESS {
    //% block="0x76"
    ADDR_0x76 = 0x76,
    //% block="0x77"
    ADDR_0x77 = 0x77
}

/**
 * BME280 block
 */
//% weight=100 color=#ff6600 icon="\uf042" block="teenkit温湿度大气压"
namespace bme280 {
    let bmeAddr = 0;
    let dig_T1: number;
    let dig_T2: number;
    let dig_T3: number;
    let dig_P1: number;
    let dig_P2: number;
    let dig_P3: number;
    let dig_P4: number;
    let dig_P5: number;
    let dig_P6: number;
    let dig_P7: number;
    let dig_P8: number;
    let dig_P9: number;
    let dig_H1: number;
    let dig_H2: number;
    let dig_H3: number;
    let a: number;
    let dig_H4: number;
    let dig_H5: number;
    let dig_H6: number;
    let T = 0;
    let P = 0;
    let H = 0;

    function init() {
        dig_T1 = getUInt16LE(0x88)
        dig_T2 = getInt16LE(0x8A)
        dig_T3 = getInt16LE(0x8C)
        dig_P1 = getUInt16LE(0x8E)
        dig_P2 = getInt16LE(0x90)
        dig_P3 = getInt16LE(0x92)
        dig_P4 = getInt16LE(0x94)
        dig_P5 = getInt16LE(0x96)
        dig_P6 = getInt16LE(0x98)
        dig_P7 = getInt16LE(0x9A)
        dig_P8 = getInt16LE(0x9C)
        dig_P9 = getInt16LE(0x9E)
        dig_H1 = getreg(0xA1)
        dig_H2 = getInt16LE(0xE1)
        dig_H3 = getreg(0xE3)
        a = getreg(0xE5)
        dig_H4 = (getreg(0xE4) << 4) + (a % 16)
        dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
        dig_H6 = getInt8LE(0xE7)
        setreg(0xF2, 0x04)
        setreg(0xF4, 0x2F)
        setreg(0xF5, 0x0C)
        T = 0
        P = 0
        H = 0
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(bmeAddr, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(bmeAddr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(bmeAddr, NumberFormat.Int16LE);
    }

    function get(): void {
        if (!bmeAddr) {  // lazy init
            bmeAddr = BME280_I2C_ADDRESS.ADDR_0x76;
            init();
        }
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = Math.idiv(_p, var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        P = P / 100
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024

    }

    /**
     * 读取大气压值，单位：百帕（hPa）。标准大气压为：1013.25hPa
     */
    //% blockId="BME280_PRESSURE" block="大气压"
    //% weight=80 blockGap=8
    export function pressure(): number {
        get();
        return P;
    }

    /**
     * 读取温度，单位：摄氏度（℃）
     */
    //% blockId="BME280_TEMPERATURE" block="温度"
    //% weight=80 blockGap=8
    export function temperature(): number {
        get();
        return T;
    }

    /**
     * 读取湿度，单位：百分比（%）
     */
    //% blockId="BME280_HUMIDITY" block="湿度"
    //% weight=80 blockGap=8    
    export function humidity(): number {
        get();
        return H;
    }

    /**
     * 读取海拔高度，单位：米
     */
    //% blockId="BME280_ELEVATION" block="海拔高度"
    //% weight=80 blockGap=8   
    export function elevation(): number {
        get();
        return (1013.25 - P) * 9;
    }

    /**
     * 启动温湿度、大气压传感器
     */
    //% blockId="BME280_SET_POWER_ON" block="启动传感器"
    //% weight=61 blockGap=8
    export function setPowerOn() {
        setAddress(BME280_I2C_ADDRESS.ADDR_0x77);
        setreg(0xF4, 0x2F)
    }

    /**
     * 停止温湿度、大气压传感器
     */
    //% blockId="BME280_SET_POWER_OFF" block="停止传感器"
    //% weight=61 blockGap=8
    export function setPowerOff() {
        setreg(0xF4, 0x00)
    }

    /**
     * set I2C address
     */

    function setAddress(addr: BME280_I2C_ADDRESS) {
        if (bmeAddr != addr) {
            bmeAddr = addr
            init();
        }
    }
}

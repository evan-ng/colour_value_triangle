"use strict";

/*
 * Classes for RGB, CYMK, HSV, and HSL colour representations
 */
class RGB {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

class CYMK {
  constructor(c, y, m, k) {
    this.c = c;
    this.y = y;
    this.m = m;
    this.k = k;
  }
}

class HSL {
  constructor(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
  }
}

class HSV {
  constructor(h, s, v) {
    this.h = h;
    this.s = s;
    this.v = v;
  }
}

/*
 * Greyscaling colour functions (luma and desaturation)
 */
// @param: RGB, CYMK, HSL, or HSV colours
// @return: ITU-R Recommendation BT.601 luma in RGB
function toGreyRelLum601(colour) {
  let rgb = colour;
  if (colour.constructor.name != RGB) {
    try {
      rgb = colour.toRGB();
    } catch (error) {
      return;
    }
  }

  let luma = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return new RGB(luma, luma, luma);
}

// @param: RGB, CYMK, HSL, or HSV colours
// @return: ITU-R Recommendation BT.709 luma in RGB
function toGreyRelLum709(colour) {
  let rgb = colour;
  if (colour.constructor.name != RGB) {
    try {
      rgb = colour.toRGB();
    } catch (error) {
      return;
    }
  }

  let luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return new RGB(luma, luma, luma);
}

// @param: RGB, CYMK, HSL, or HSV colours
// @return: Desaturated colour (S(aturation) in HSL/HSV set to 0) in RGB
function toGreyDesaturate(colour) {
  let hsl = colour;
  if (colour.constructor.name != HSL) {
    try {
      hsl = colour.toHSL();
    } catch (error) {
      return;
    }
  }

  let grey = new HSL(hsl.h, 0, hsl.l);
  return grey.toRGB();
}

/*
 * Colour conversion functions between HEX, RGB, CYMK, HSL, HSV
 */
function hexToRGB(hex) {
  let reg = /^\#{0,1}([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return new RGB(parseInt(reg[1], 16), 
    parseInt(reg[2], 16), 
    parseInt(reg[3], 16)
  );
}

function hexToCYMK(hex) {
  let rgb = hexToRGB(hex);
  return rgb.toCYMK();
}

function hexToHSL(hex) {
  let rgb = hexToRGB(hex);
  return rgb.toHSL();
}

function hexToHSV(hex) {
  let rgb = hexToRGB(hex);
  return rgb.toHSV();
}

RGB.prototype.toHEX = function() {
  return ((1 << 24) + (this.r << 16) + (this.g << 8) + this.b).toString(16).slice(1);
}

RGB.prototype.toCYMK = function() {
  let rd = this.r / 255;
  let gd = this.g / 255;
  let bd = this.b / 255;
  let k = 1 - Math.max(rd, gd, bd);
  let rk = 1 - k;
  let c = (rk - rd) / rk;
  let y = (rk - bd) / rk;
  let m = (rk - gd) / rk;
  c = Math.round(c * 100);
  y = Math.round(y * 100);
  m = Math.round(m * 100);
  k = Math.round(k * 100);
  return new CYMK(c, y, m, k);
}

RGB.prototype.toHSL = function() {
  let rd = this.r/255;
  let gd = this.g/255;
  let bd = this.b/255;
  let max = Math.max(rd, gd, bd);
  let min = Math.min(rd, gd, bd);
  let c = max - min;

  let h;
  if (c == 0) {
    h = 0;
  } else {
    let segment;
    let shift;
    switch (max) {
      case rd:
        segment = (gd - bd) / c;
        shift = (segment < 0) ? 6 : 0;
        break;
      case gd:
        segment = (bd - rd) / c;
        shift = 2;
        break;
      case bd:
        segment = (rd - gd) / c;
        shift = 4;
        break;
    }
    h = (segment + shift) * 60;
    h = Math.round(h);
  }

  let l = (max + min) / 2;
  let s = (c == 0) ? 0 : (c / (1 - Math.abs(2 * l - 1)));

  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return new HSL(h, s, l);
}

RGB.prototype.toHSV = function() {
  let rd = this.r/255;
  let gd = this.g/255;
  let bd = this.b/255;
  let max = Math.max(rd, gd, bd);
  let min = Math.min(rd, gd, bd);
  let c = max - min;

  let h;
  if (c == 0) {
    h = 0;
  } else {
    let segment;
    let shift;
    switch (max) {
      case rd:
        segment = (gd - bd) / c;
        shift = (segment < 0) ? 6 : 0;
        break;
      case gd:
        segment = (bd - rd) / c;
        shift = 2;
        break;
      case bd:
        segment = (rd - gd) / c;
        shift = 4;
        break;
    }
    h = (segment + shift) * 60;
    h = Math.round(h);
  }

  let s = (max == 0) ? 0 : Math.round(100 * c/max);
  let v = Math.round(max * 100);

  return new HSV(h, s, v);
}

CYMK.prototype.toHEX = function() {
  let rgb = this.toRGB();
  return rgb.toHEX();
}

CYMK.prototype.toRGB = function() {
  let rk = 1 - this.k;
  let r = 255 * (1 - this.c) * rk;
  let g = 255 * (1 - this.c) * rk;
  let b = 255 * (1 - this.c) * rk;

  return new RGB(r, g, b);
}

CYMK.prototype.toHSL = function() {
  let rgb = this.toRGB();
  return rgb.toHSL();
}

CYMK.prototype.toHSV = function() {
  let rgb = this.toRGB();
  return rgb.toHSV();
}

HSL.prototype.toHEX = function() {
  let rgb = this.toRGB();
  return rgb.toHEX();
}

HSL.prototype.toRGB = function() {
  let c = (1 - Math.abs(2 * this.l)) * this.s;
  let x = (1 - Math.abs(((H / 60) % 2) - 1)) * c;
  let m = this.l - c/2;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r = (r + m) * 255;
  g = (g + m) * 255;
  b = (b + m) * 255;
  return new RGB(r, g, b);
}

HSL.prototype.toCYMK = function() {
  let rgb = this.toRGB();
  return rgb.toCYMK();
}

HSL.prototype.toHSV = function() {
  let h = this.h;
  let s = this.s / 100;
  let l = this.l / 100;
  let v = l + s * Math.min(l, 1 - l);
  s = (v == 0) ? 0 : (2 * (1 - l/v));
  s = Math.round(s * 100);
  v = Math.round(v * 100);
  return new HSV(h, s, v);
}

HSV.prototype.toHEX = function() {
  let rgb = this.toRGB();
  return rgb.toHEX();
}

HSV.prototype.toRGB = function() {
  let c = (this.v / 100) * (this.s / 100);
  let x = (1 - Math.abs(((H / 60) % 2) - 1)) * c;
  let m = (this.v / 100) - c;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r = (r + m) * 255;
  g = (g + m) * 255;
  b = (b + m) * 255;
  return new RGB(r, g, b);
}

HSV.prototype.toCYMK = function() {
  let rgb = this.toRGB();
  return rgb.toCYMK();
}

HSV.prototype.toHSL = function() {
  let h = this.h;
  let s = this.s / 100;
  let v = this.v / 100;
  let l = v * (1 - s/2);
  s = (l == 0 || l == 1) ? 0 : ((v - l) / Math.min(l, 1 - l));
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return new HSL(h, s, l);
}
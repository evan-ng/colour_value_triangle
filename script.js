'use strict';

/**************************************************************
 * Classes for RGB, CYMK, HSV, and HSL colour representations *
 **************************************************************/
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

/*************************
 * Get document elements *
 *************************/
const hueInput = document.querySelector('.slider-input');
const colourCanvas = document.querySelector('.colourtriangle-canvas');
const colourDisplay = document.querySelector('.colour-display');
const greyDisplay = document.querySelector('.grey-display');
const triangleHandle = document.querySelector('.triangle-handle');
const hexInput = document.querySelector('.hex-input');
const rgbInput = document.querySelector('.rgb-input');
const cymkInput = document.querySelector('.cymk-input');
const hsvInput = document.querySelector('.hsv-input');
const hslInput = document.querySelector('.hsl-input');

/***************************
 * Global colour variables *
 ***************************/
let hue;
let fullSat; // full saturated colour in HSL
let greyFullRGB; // full saturated colour, greyscaled, in RGB
let greyFullHSL; // in HSL

let currentColour = new HSL(0, 0, 0); // current chosen colour, in hsl
let currentGrey = new RGB(0, 0, 0); // current chosen colour, greyscaled, in rgb

/*******************
 * Event listeners *
 *******************/

// when user changes the hue slider
hueInput.addEventListener( 'input', (e) => setCurrentHue(e.target.value) );
hueInput.addEventListener( 'mousedown', () => focusThumb() );
hueInput.addEventListener( 'mouseup', () => unFocusThumb() );
// when user clicks on handle in triangle
triangleHandle.addEventListener( 'mousedown', (e) => {
  setCurrentColour(e);
  focusHandle();
} );
triangleHandle.addEventListener( 'mouseup', () => unFocusHandle() );
// when user clicks on triangle, but not on handle
colourCanvas.addEventListener( 'mousedown', (e) => {
  dragHandle(e); 
  setCurrentColour(e);
  focusHandle();
} );
colourCanvas.addEventListener( 'mouseup', () => unFocusHandle() );
// ensure the colours and handles are in the correct places
window.addEventListener( 'resize', () => moveHandleToDefault() );
window.addEventListener( 'load', () => {
  setCurrentHue(hueInput.value);
  moveHandleToDefault();
} );


/*******************
 * Event functions *
 *******************/

/**
 * Sets the global variables according to the selected hue, 
 * draws the colour triangle, and makes any necessary adjustments to
 * the triangle handle
 * @param {*} hueValue 
 */
function setCurrentHue(hueValue) {
  hue = hueValue;
  hueInput.style.setProperty('--thumb-colour', `hsl(${hue}, 100%, 50%)`);

  // get the colour value positions
  fullSat = new HSL(hue, 100, 50); // full saturated colour in hsl
  greyFullRGB = toGreyRelLum601(fullSat); // in rgb
  greyFullHSL = greyFullRGB.toHSL();

  drawTriangle(hue);

  // reposition the triangle handle and change the colour according to where it is
  let triangleHandleBounds = triangleHandle.getBoundingClientRect();
  let pos = boundTriangleHandle(
    triangleHandleBounds.top + triangleHandle.clientHeight/2,
    triangleHandleBounds.left + triangleHandle.clientWidth/2
  );
  setTriangleHandle(pos.top, pos.left, pos.colour);
}

/**
 * Allows the user to drag the triangle handle, then
 * sets the selected colour based on the position of the handle
 * @param {*} e 
 */
function setCurrentColour(e) {
  e.preventDefault();

  document.onmousemove = dragHandle;
  document.onmouseup = closeHandleDrag;

  function closeHandleDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Move the triangle handle within allowed bounds then set
 * the current colour according to the handle's position
 * @param {*} e 
 */
function dragHandle(e) {
  let pos = boundTriangleHandle(e.clientY, e.clientX);
  setTriangleHandle(pos.top, pos.left, pos.colour);
}

/**
 * Thicken the border of the hue thumb
 */
 function focusThumb() {
  hueInput.style.setProperty('--thumb-thickness', '2px');
  hueInput.style.setProperty('--thumb-outline', 'var(--primary-dark)');
}

/**
 * Thin the border of the hue thumb
 */
function unFocusThumb() {
  hueInput.style.setProperty('--thumb-thickness', '1px');
  hueInput.style.setProperty('--thumb-outline', 'var(--secondary-light)');
}

/**
 * Thicken the border of the triangle handle
 */
function focusHandle() {
  triangleHandle.style.setProperty('border', '2px solid var(--primary-dark)');
}

/**
 * Thin the border of the triangle handle
 */
function unFocusHandle() {
  triangleHandle.style.setProperty('border', '1px solid var(--secondary-light)');
}

/**
 * Sets the triangle picker handle to the given top and left absolute positions,
 * changes its colour accordingly, and sets the colour representations
 * @param {number} top 
 * @param {number} left 
 * @param {HSL} colour 
 */
function setTriangleHandle(top, left, colour) {
  triangleHandle.style.left = (left - triangleHandle.clientWidth/2) + 'px';
  triangleHandle.style.top = (top - triangleHandle.clientHeight/2) + 'px';
  triangleHandle.style.setProperty(
      'background', 
      `hsl(${colour.h}, ${colour.s}%, ${colour.l}%)`
  );

  currentColour = colour;
  currentGrey = toGreyRelLum601(currentColour);
  setColourInputs();
  colourDisplay.style.setProperty(
    'background', 
    `hsl(${currentColour.h}, ${currentColour.s}%, ${currentColour.l}%)`
  );
  greyDisplay.style.setProperty(
    'background', 
    `rgb(${currentGrey.r}, ${currentGrey.g}, ${currentGrey.b})`
  );
}

/**
 * Based on the colour selected by the handle, 
 * places the colour's text representations in the input boxes
 */
function setColourInputs() {
  let hex = currentColour.toHEX();
  let rgb = currentColour.toRGB();
  let cymk = currentColour.toCYMK();
  let hsv = currentColour.toHSV();
  let hsl = currentColour;

  hexInput.value = `#${hex}`;
  rgbInput.value = `${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`;
  cymkInput.value = `${Math.round(cymk.c)}%, ${Math.round(cymk.y)}%, ${Math.round(cymk.m)}%, ${Math.round(cymk.k)}%`;
  hsvInput.value = `${Math.round(hsv.h)}°, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%`;
  hslInput.value = `${Math.round(hsl.h)}°, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;
}

/**
 * Enforces boundaries upon the top and left positions, then
 * returns the colour associated with that position
 * @param {*} top 
 * @param {*} left 
 * @returns {Object} The top and left values adjusted to the boundaries
 *                   and the colour associated with that position
 */
function boundTriangleHandle(top, left) {
  // get the boundary x and y coordinates of the triangle canvas
  let canvasBounds = colourCanvas.getBoundingClientRect();

  // limit handle x coordinate to between canvas bounds
  if (left < canvasBounds.left) { left = canvasBounds.left; }
  else if (left > canvasBounds.right) { left = canvasBounds.right; }
  if (top < canvasBounds.top) { top = canvasBounds.top; }
  else if (top > canvasBounds.bottom) { top = canvasBounds.bottom; }

  // limit handle y coordinate to areas of the canvas with colour
  let canvasX = left - canvasBounds.left;
  let canvasY = top - canvasBounds.top;

  let fullY = colourCanvas.clientHeight * ( 1 - (greyFullHSL.l / 100));
  let topSlope = fullY / colourCanvas.clientWidth;
  let botSlope = (colourCanvas.clientHeight - fullY) / colourCanvas.clientWidth;

  let topMin = Math.floor(topSlope * canvasX);
  let topMax = colourCanvas.clientHeight - Math.floor(botSlope * canvasX);
  if (canvasY < topMin) { canvasY = topMin; }
  else if (canvasY > topMax) { canvasY = topMax; }
  top = canvasY + canvasBounds.top;

  // calculate colour chosen from position
  let s = 100 * (canvasX / colourCanvas.clientWidth);
  let l = 100 * (1 - (canvasY / colourCanvas.clientHeight)) + (50 - greyFullHSL.l) * 
      (canvasX / colourCanvas.clientWidth);

  return {top: top, left: left, colour: new HSL(hue, s, l)};
}

/**
 * Places the triangle handle on the white corner of the triangle
 */
function moveHandleToDefault() {
  let canvasBounds = colourCanvas.getBoundingClientRect();

  triangleHandle.style.left = (canvasBounds.left - triangleHandle.clientWidth/2) + 'px';
  triangleHandle.style.top = (canvasBounds.top - triangleHandle.clientHeight/2) + 'px';
  triangleHandle.style.setProperty('background', `hsl(0, 0%, 100%)`);
}

/**
 * Draws the triangle based on the hue given, changing the position
 * of the vertex containing the most saturated colour
 * @param {*} hueValue 
 */
function drawTriangle(hueValue) {
  let ctx = colourCanvas.getContext('2d');
  let width = colourCanvas.width;
  let height = colourCanvas.height;
  ctx.clearRect(0, 0, width, height);
  let id = ctx.getImageData(0, 0, width, height);
  let pixels = id.data; 

  // determine vertex of most saturated end and slopes of lines leading to it
  let fullY = height * ( 1 - (greyFullHSL.l / 100));
  let topSlope = fullY / width;
  let botSlope = (height - fullY) / width;

  // fill in the triangle based based on the hue
  for (let x = 0; x < width; x++) {
    for (let y = Math.floor(topSlope * x); y < height - Math.floor(botSlope * x); y++) {
      let s = 100 * (x / width);
      let l = 100 * (1 - (y / height)) + (50 - greyFullHSL.l) * (x / width);
      
      let hsl = new HSL(hueValue, s, l);
      let rgb = hsl.toRGB();

      let off = (y * id.width + x) * 4;
      pixels[off] = rgb.r;
      pixels[off + 1] = rgb.g;
      pixels[off + 2] = rgb.b;
      pixels[off + 3] = 255;
    }
  }
  
  ctx.putImageData(id, 0, 0); // place image date into canvas
}


/********************************************************
 * Greyscaling colour functions (luma and desaturation) *
 ********************************************************/

/**
 * Greyscales a colour using the ITU-R Recommendation BT.601
 * @param {*} colour  RGB, CYMK, HSL, or HSV colours
 * @return {RGB} ITU-R Recommendation BT.601 luma in RGB
 */
function toGreyRelLum601(colour) {
  let rgb = colour;
  if (colour.constructor.name != 'RGB') {
    try {
      rgb = colour.toRGB();
    } catch (error) {
      return new RGB(0, 0, 0);
    }
  }

  let luma = (0.299 * rgb.r) + (0.587 * rgb.g) + (0.114 * rgb.b);
  return new RGB(luma, luma, luma);
}

/**
 * Greyscales a colour using the ITU-R Recommendation BT.709
 * @param {*} colour  RGB, CYMK, HSL, or HSV colours
 * @return {RGB} ITU-R Recommendation BT.709 luma in RGB
 */
function toGreyRelLum709(colour) {
  let rgb = colour;
  if (colour.constructor.name != 'RGB') {
    try {
      rgb = colour.toRGB();
    } catch (error) {
      return new RGB(0, 0, 0);
    }
  }

  let luma = (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
  return new RGB(luma, luma, luma);
}

/**
 * Greyscales a colour by desaturating, setting S (from HSL/HSV form) to 0
 * @param {*} colour  RGB, CYMK, HSL, or HSV colours
 * @return {RGB} Desaturated colour in RGB
 */
function toGreyDesaturate(colour) {
  let hsl = colour;
  if (colour.constructor.name != 'HSL') {
    try {
      hsl = colour.toHSL();
    } catch (error) {
      return new RGB(0, 0, 0);
    }
  }

  let grey = new HSL(hsl.h, 0, hsl.l);
  return grey.toRGB();
}

/****************************************************************
 * Colour conversion functions between HEX, RGB, CYMK, HSL, HSV *
 ****************************************************************/

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
  return ((1 << 24) + (Math.round(this.r) << 16) + 
      (Math.round(this.g) << 8) + Math.round(this.b)).toString(16).slice(1);
}

RGB.prototype.toCYMK = function() {
  let rd = this.r / 255;
  let gd = this.g / 255;
  let bd = this.b / 255;
  let k = 1 - Math.max(rd, gd, bd);
  let rk = 1 - k;
  let c, y, m;
  if (rk != 0) {
    c = (rk - rd) / rk;
    y = (rk - bd) / rk;
    m = (rk - gd) / rk;
  } else {
    c = 0;
    y = 0;
    m = 0;
  }
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
  let h = this.h;
  let s = this.s / 100;
  let l = this.l / 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = (1 - Math.abs(((this.h / 60) % 2) - 1)) * c;
  let m = l - (c / 2);

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
  let h = this.h;
  let s = this.s / 100;
  let v = this.v / 100;

  let c = v * s;
  let x = (1 - Math.abs(((h / 60) % 2) - 1)) * c;
  let m = v - c;
  
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
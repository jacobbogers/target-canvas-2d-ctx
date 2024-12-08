# RenderPipeline

base types

- string 0x10 (0 last nummble means empty string) (includes nr of lengthbytes)  0x11-0x14   so nr lengthbytes is bewteen 1 to 4 bytes (max size 4.3 Gig)
- int8 0x21
- int16  0x22
- int32  0x24
- int64  0x28
- intBool 0x30  0x30 = false, 0x31 = true
- float32   0x44
- float64   0x48
- skip 0x50 (optional value omitted)  
- ubyte  0x60 = zero length ubyte  (includes nr of length)   0x61-0x64   so nr lengthbytes is bewteen 1 to 4 bytes (max size 4.3 Gig)

- object 0x80 first nibble is the structure type, second nimbble is the unique index within the context of the namespace

https://html.spec.whatwg.org/multipage/canvas.html

| namespace | name                             | type         | return | arg1   | arg2                              | arg3 | arg 4 | namespace type id | type Id   |
| --------- | -------------------------------- | ------------ | ------ | ------ | --------------------------------- | ---- | ----- | ----------------- | --------- |
| canvas    | toDataURL                        | fun          | string | string | *string                           | x    | x     | 0x0a              | 10        |
| canvas    | toBlob                           | fun          | N/A    | N/A    | N/A                               | N/A  | N/A   | N/A               | N/A       |
| canvas    | getContext                       | fun          | N/A    | string | *CanvasRenderingContext2DSettings |      |       |                   | 20        |
| canvas    | length                           | prop get/set | number | number |                                   |      |       |                   | 31/32/33  |
| canvas    | width                            | prop get/set | number | number |                                   |      |       |                   | 40/41     |
| canvas    | CanvasRenderingContext2DSettings | struct       | N/A    | N/A    | N/A                               | N/A  | N/A   | N/A               | 80/81/.01 |

The unqiueness of an object is determined its "type" path explicit or contextual    <namespace><x80><specific structure index tag> 

dictionary CanvasRenderingContext2DSettings {
  boolean alpha = true;
  boolean desynchronized = false;
  PredefinedColorSpace colorSpace = "srgb";
  boolean willReadFrequently = false;
};

## canvas

### Types for HTMLCanvasElement

```typescript
typedef (
  CanvasRenderingContext2D      // the only one supported for now
  or ImageBitmapRenderingContext 
  or WebGLRenderingContext 
  or WebGL2RenderingContext 
  or GPUCanvasContext
) RenderingContext;
```

NOTE:  "quality" is a type of number in the range 0.0 to 1.0
NOTE:  "type" is a type of either "image/png", or "image/jpg", other types can be supported but you can only find out if you
test it with `toDataURL("image/webp[ type 

Example:
```typescript
var canvas = document.createElement('canvas');
var dataUrl = canvas.toDataURL('image/webp');
// -> data:image/webp;base64,UklGRogCAABXRUJQVlA4WA...."

//    it could also be  "data:image/webp," (note the use of a "," instead of a ";")

// In this case "webp" is supported, if it was not, it "dataUrl" would default to "data:image/png;base64,..."


canvas.length = 0; // canvas will have no pixels
var dataUrl = canvas.toDataURL('image/webp');
// dataUrl now is 'data:,'  since the canvas has no pixels
```

```typescript
[Exposed=Window]
interface HTMLCanvasElement : HTMLElement {
  [HTMLConstructor] constructor();

  [CEReactions] attribute unsigned long width;   // read and set
  [CEReactions] attribute unsigned long height; // read and set

  RenderingContext? getContext(DOMString contextId, optional any options = null); // only "2d" is supported for now
  // "SecurityError" is created like so "new DOMException(DOMException.SECURITY_ERR)"
  // can throw "SecurityError" if "origin-clean" is set to false
  USVString toDataURL(optional DOMString type = "image/png", optional any quality);

  // toBlob can throw "SecurityError" if the "origin-clean" is set to false
  undefined toBlob(BlobCallback _callback, optional DOMString type = "image/png", optional any quality); // null will be passed to the callback if the blob cannot created for some reason
 
  OffscreenCanvas transferControlToOffscreen(); // will not supported for now
};

callback BlobCallback = undefined (Blob? blob); // blob will be null if the creation fails
```

#### CanvasRenderingContext2DSettings

_CanvasRenderingContext2DSettings_ is mentioned here  aswell as in the "2D Rendering Context" section, because it bridges the gap from canvas -> 2Dcontext

```typescript
type CanvasRenderingContext2DSettings = {
  alpha: boolean;
  desynchronized: boolean;
  colorSpace: "srgb" | "display-p3"
  willReadFrequently: boolean;
};
```


## 2d rendering ontext

The context functions and props are partitioned into disperate namespaces mixed into the ` CanvasRenderingContext2D` interface

### CanvasRenderingContext2D primer

```typescript
interface CanvasRenderingContext2D {
  // back-reference to the canvas
  readonly attribute HTMLCanvasElement canvas;
  /*
      type CanvasRenderingContext2DSettings = {
        alpha: boolean;
        desynchronized: boolean;
        colorSpace: "srgb" | "display-p3"
        willReadFrequently: boolean;
      };
  */
  CanvasRenderingContext2DSettings getContextAttributes();
};
```

### CanvasState (mixin)

```typescript
interface mixin CanvasState {
  // state
  undefined save(); // push state on state stack
  undefined restore(); // pop state stack and restore state
  undefined reset(); // reset the rendering context to its default state
  boolean isContextLost(); // (should implement?) return whether context is lost
};
```

### CanvasTransform (mixin)

```typescript
interface mixin CanvasTransform {
  // transformations (default transform is the identity matrix)
  undefined scale(unrestricted double x, unrestricted double y);
  undefined rotate(unrestricted double angle);
  undefined translate(unrestricted double x, unrestricted double y);
  undefined transform(unrestricted double a, unrestricted double b, unrestricted double c, unrestricted double d, unrestricted double e, unrestricted double f);

// DOMMatrix looks like a horror of an object https://drafts.fxtf.org/geometry/#dommatrix
/*
DomMatrix (sans functions) {
  "a": 1,
  "b": 0,
  "c": 0,
  "d": 1,
  "e": 0,
  "f": 0,
  "m11": 1,
  "m12": 0,
  "m13": 0,
  "m14": 0,
  "m21": 0,
  "m22": 1,
  "m23": 0,
  "m24": 0,
  "m31": 0,
  "m32": 0,
  "m33": 1,
  "m34": 0,
  "m41": 0,
  "m42": 0,
  "m43": 0,
  "m44": 1,
  "is2D": true,
  "isIdentity": true
}
*/
  [NewObject] DOMMatrix getTransform(); // should we implement this?
  undefined setTransform(unrestricted double a, unrestricted double b, unrestricted double c, unrestricted double d, unrestricted double e, unrestricted double f);

  /* https://drafts.fxtf.org/geometry/#dictdef-dommatrix2dinit
  dictionary DOMMatrixInit : DOMMatrix2DInit {
    unrestricted double m13 = 0;
    unrestricted double m14 = 0;
    unrestricted double m23 = 0;
    unrestricted double m24 = 0;
    unrestricted double m31 = 0;
    unrestricted double m32 = 0;
    unrestricted double m33 = 1;
    unrestricted double m34 = 0;
    unrestricted double m43 = 0;
    unrestricted double m44 = 1;
    boolean is2D;
};
*/
  undefined setTransform(optional DOMMatrix2DInit transform = {});
  undefined resetTransform();
```

### CanvasComposition (mixin)

jkf: I am here

ctx.globalAlpha; (property)

https://drafts.fxtf.org/compositing

<blend-mode> = normal | multiply | screen | overlay | darken | lighten | color-dodge |color-burn | hard-light | soft-light | difference | exclusion | hue |
saturation | color | luminosity

<composite-mode> = clear | copy | source-over | destination-over | source-in |    
destination-in | source-out | destination-out | source-atop |    
destination-atop | xor | lighter | plus-darker | plus-lighter


ctx.globalCompositionOperation; ("source-over")

### CanvasImageSmoothing

ctx.imageSmoothingEnabled: boolean (default true)
ctx.imageSmoothingQuality:"low" | "medium" | "high"  (default "low")

### CanvasFillStrokeStyles

https://drafts.fxtf.org/geometry

dictionary DOMMatrix2DInit {
    unrestricted double a;
    unrestricted double b;
    unrestricted double c;
    unrestricted double d;
    unrestricted double e;
    unrestricted double f;
    unrestricted double m11;
    unrestricted double m12;
    unrestricted double m21;
    unrestricted double m22;
    unrestricted double m41;
    unrestricted double m42;
};


[Exposed=(Window,Worker)]
interface CanvasGradient {
  // opaque object
  undefined addColorStop(double offset, DOMString color);
};

[Exposed=(Window,Worker)]
interface CanvasPattern {
  // opaque object
  undefined setTransform(optional DOMMatrix2DInit transform = {});
};


ctx.strokeStyle: DOMString | CanvasGradient | CanvasPattern
ctx.fillStyle: DOMString | CanvasGradient | CanvasPattern

CanvasGradient

ctx.createLinearGradient(double x0, double y0, double x1, double y1);
ctx.createRadialGradient(double x0, double y0, double r0, double x1, double y1, double r1);
ctx.createConicGradient(double startAngle, double x, double y);

CanvasPattern
-- will not implement because "CanvasImageSource" cannot be purely serialized in one step
ctx.createPattern(CanvasImageSource image, [LegacyNullToEmptyString] DOMString repetition);

### CanvasShadowStyles

ctx.shadowOffsetX; unrestricted double
ctx.shadowOffsetY; " "
ctx.shadowBlur; " "
ctx.shadowColor: DOMString (default transparent black)

### CanvasFilters

ctx.filter; (default "none")

### CanvasRect

ctx.clearRect(unrestricted double x, unrestricted double y, unrestricted double w, unrestricted double h)

ctx.fillRect(unrestricted double x, unrestricted double y, unrestricted double w, unrestricted double h);

ctx.strokeRect(unrestricted double x, unrestricted double y, unrestricted double w, unrestricted double h);

### CanvasDrawPath

ctx.beginPath();
ctx.fill(fillRule: "nonzero" | "evenodd" = "nonzero");
ctx.stroke();
ctx.clip(fillRule: "nonzero" | "evenodd" =  = "nonzero");
ctx.isPointInPath(unrestricted double x, unrestricted double y, fillRule: "nonzero" | "evenodd" =  = "nonzero");
ctx.isPointInStroke(unrestricted double x, unrestricted double y);
ctx.isPointInStroke(Path2D path, unrestricted double x, unrestricted double y);
ctx.


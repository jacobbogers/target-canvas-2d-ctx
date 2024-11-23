# RenderPipeline

## canvas

only rendering context supported for now is "2d"

canvas.toDataURL() // implement
canvas.toBlob() // implement
canvas.getContext("2d", options: CanvasRenderingContext2DSettings)
## 2d context

// for the creation of 2d rendering context

type CanvasRenderingContext2DSettings = {
  alpha: boolean;
  desynchronized: boolean;
  colorSpace: "srgb" | "display-p3"
  willReadFrequently: boolean;
};

ctx = canvas.getContext(...) [see](## canvas)

ctx.canvas (Canvas instance)
ctx.getContextAttriby(): CanvasRenderingContext2DSettings;

### CanvasState

ctx.save()
ctx.restore()
ctx.reset()
ctx.isContextLost(): boolean;

### CanvasTransform

ctx.scale(double, double) # accepts unrestricted doubles
ctx.rotate(double)
ctx.translate(x,y)
ctx.transform(a,b,c,d,e,f)
ctx.setTransform(a,b,c,d,e,f)
ctx.resetTransform();

### CanvasComposition

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


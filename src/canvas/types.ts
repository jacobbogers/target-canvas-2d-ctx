// the ascii sequence of "canvas" is 99, 97, 110, 118, 97, 115,
// the ascii sequence of "width" is 119, 105, 100, 116, 104,
// the ascii sequence of "2dctx" is 50, 100, 99, 116, 120
// the "response" of an "oid" is just the rpc Id for re-conciliation
// a call a method on 2d context is done by "canvas2dctx"0"<method>.. then arguments then response

// each call the the canvas target begins with an oidStructure
// each response from a canvas target is a null object (nothing) or null with payload
// null are not errors perse though just general return traffic

// 1. canvas target does parse
// 2. canvas matches oid to target structure (either canvas or canvas2dx)
// 3. canvas can also do temporary store (stamping)
// 4. decided against having canvas store fonts in some very long term semipermanent way
// 5. drawing instructions can be glyphed as macros and reused within a block marked by [begin] & [end]
// 6. Canvas receives instructions via "enque" function (synchronious)
// 7. Enqueues are executed within the same microtask


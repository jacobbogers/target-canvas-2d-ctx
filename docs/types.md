base types (namespace base)
* null 0x00  0000-0000
* null has payload  0000-0xxx


* string 0x10 (0 last nibble means empty string) 0x11-0x14, so if 4 means 32bit twos complement (max size2.1 Gig)

* int8 0x21
* int16  0x22
* int24  0x23
* int32  0x24
* inty  0x2..(y/8)

* intBool 0x30  0x30 = false, 0x31 = true

+ float32   0x44
+ float64   0x48

+ skip 0x50 (optional value omitted)  

+ ubyte  0x60 = zero length ubyte  (includes nr of length)  0x61-0x64   so nr lengthbytes is bewteen 1 to 4 bytes (max size 4.3 Gig)

+ object start 0x80 first nibble is the structure type, second is the size of the lengthBytes in 2's complement (max 6 bytes)
+ 1   0001
+ 2   0010
+ 3   0011
+ 4   0100
+ 5   0101
+ 6   0110
+ 8   1000 // this could be a subtype (since lenght bytes are nevernot beyond 7)

So an Oid type and getting the type 0x07 to strip off any length bytes
+  0x88


+ after the size of the object there is an oid that gives the object id (type) that makes sense within the namespace the object is used
+ object end 0x81
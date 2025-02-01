# Types
* null 0x00 
* null + payload start 0x01
* null + payload end 0x02

* oid frame start = 0x03


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
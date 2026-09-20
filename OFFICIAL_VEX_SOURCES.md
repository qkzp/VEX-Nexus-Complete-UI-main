# Official VEX hardware sources used by VEX Coder

Hardware selectors in this build are constrained from official VEX-owned sources. Community forum posts are not treated as authoritative hardware or competition rules.

- **V5 Robot Brain (276-4810):** 21 Smart Ports and 8 built-in 3-Wire ports (A–H).  
  https://www.vexrobotics.com/276-4810.html
- **V5 Smart Motor (11W) (276-4840):** 36:1 / 100 RPM, 18:1 / 200 RPM, and 6:1 / 600 RPM cartridges.  
  https://www.vexrobotics.com/276-4840.html
- **V5 Smart Motor (5.5W) (276-4842):** fixed 200 RPM and not compatible with 11W gear cartridges. This build does not silently apply an 11W cartridge value to a 5.5W motor.  
  https://www.vexrobotics.com/276-4842.html
- **V5 gears:** drivetrain/mechanism spur-gear selectors use current listed tooth counts: 12T, 24T, 36T, 48T, 60T, 72T, and 84T.  
  https://www.vexrobotics.com/gears.html
- **V5 wheels:** nominal diameter selectors use current listed V5 wheel sizes: 2 in, 2.75 in, 3.25 in, and 4 in.  
  https://www.vexrobotics.com/wheels.html
- **VEXcode V5 API:** used to cross-check Smart Port sensor support, including AI Vision.  
  https://api.vex.com/v5/home/
- **V5RC Override Game Manual:** competition legality is governed by the current Game Manual, V5 Competition Legal Parts List, and official Q&A—not by a community forum post.  
  https://www.vexrobotics.com/override-manual

## Important scope note

The gear selector above is intentionally a **spur/high-strength gear selector**. VEX also sells other transmission components such as bevel gears, rack gears, worm gears, sprockets, and pulleys; those should be modeled in their corresponding mechanism calculators rather than mixed into a spur-gear tooth selector.

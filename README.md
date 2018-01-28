# The Hertzfeld Kernel

```
 ____________________
< Under Construction >
 --------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

Work in Progress : Some documentation may reflect planned features.

---

## :octocat: About the Hertzfeld Kernel

The Hertzfeld Kernel is a multitasking microkernel for JavaScript which enables concurrent execution of multiple functions. Userspace programs can be scheduled cooperatively and/or preemptively.

To implement voluntary preemptive multitasking, which is a hybrid of both cooperative and preemptive multitasking, Hertzfeld optionally pre-processes userspace source code using [the HertzScript compiler](https://github.com/Floofies/HertzScript). By using HertzScript, functions can be transparently transformed into Generators, and scheduler control points can be inserted.

## Overview of Features

A wide variety of configurations are available for multiple use cases.

### Process Scheduling

There are several available scheduling policies to choose from:
- Completely Fair Scheduler
- Background/Batch
- FCFS/FIFO
- Round Robin
- Multilevel Priority Queue
- Manual

Context switching may take place at three specific points during the execution of a user process:
- System Calls
- Control Points
- User-supplied Yields

At any one of these points, the kernel may invoke the scheduler and/or delegate control to another process, eventually returning control back to a process at the same point; or the kernel may do nothing, and allow the process to continue executing.

## Kernel Standard Library

Hertzfeld includes a standard kernel library which contains the reusable and user-friendly components of the kernel.

Available classes include:
- EventBus
- Core Scheduler & Scheduling Classes
- Thread Manager

## Kernel Modules

In addition to the kernel library, Hertzfeld includes a number of imported libraries and modules.
- [Differentia.js](https://github.com/Floofies/Differentia.js)
- [HertzScript](https://github.com/Floofies/HertzScript)

---

## :man: About the Hertzfeld Name

Andy Hertzfeld (after whom this project is named) is an American computer scientist, inventor, and "software wizard". He was a member of the original Apple Macintosh development team during the 1980s, where became a primary architect of the original Macintosh System Software. Among his more recent escapades, Andy helped to create the Nautilus file manager for GNOME, helped the Open Source Applications Foundation promote open source software, and was also the key designer of the Circles user interface in Google+.
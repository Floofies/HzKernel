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

The Hertzfeld Kernel is a multitasking microkernel for JavaScript which enables concurrent & time-shared execution of multiple functions. Userspace programs can be scheduled cooperatively and/or preemptively.

To implement voluntary preemptive multitasking, which is a hybrid of both cooperative and preemptive multitasking, Hertzfeld optionally pre-processes userspace source code using [the HertzScript compiler](https://github.com/Floofies/hertzscript-compiler).

## Overview of Features

A wide variety of configurations are available for multiple use cases.

### Processes & Threading

All processes in Hertzfeld are executed within one or more instances of a Threader class. The Threader class encapsulates most process-specific behaviors, and performs interoperability functions between them, a scheduler class instance, and the kernel. Threaders may be nested inside processes directly to implement prototypal process groups with their own scheduling policies. The kernel instantiates a single top-level Threader by default, in which all processes and nested sub-Threaders are executed.

There are several scheduler classes to choose from:

- Completely Fair Scheduler
- Brain Fuck Scheduler
- Background
- Batch
- Round Robin
- User-Supplied Scheduler

Context switching may take place at three specific points during the execution of a user process:

- System Calls
- Control Points
- User-Supplied Yields

At any one of these points, the kernel may invoke the scheduler and/or delegate control to another process, eventually returning control back to a process at the same point; or the kernel may do nothing, and allow the process to continue executing.

### System Calls

System calls primarily interact with the kernel's top-level Threader instance. Hertzfeld implements system calls via the `yield` expression and a System Call Interface (SCI) library. The SCI library is composed of simple Object factories, the return values of which may be yielded as system calls.

Calls to the kernel are yielded like so:

```JavaScript
// Waits for 10 seconds before resuming
yield Kernel.SCI.TIME_WAIT(10000);
console.log("This gets logged after 10 seconds!");
```

System calls may also be written directly, rather than using the SCI library:

```JavaScript
yield {"TIME_WAIT", [10000]};
console.log("This gets logged after 10 seconds!");
```

## Kernel Standard Library

Hertzfeld includes a standard kernel library which contains the reusable and user-friendly components of the kernel.

Available modules include:
- EventBus
- MessageBus
- Threader
- CoreScheduler & Extenders

## Kernel Modules

In addition to the kernel library, Hertzfeld includes a number of imported libraries and modules.
- [Differentia.js](https://github.com/Floofies/Differentia.js)
- [HertzScript](https://github.com/Floofies/HertzScript)

---

## :man: About the Hertzfeld Name

Andy Hertzfeld (after whom this project is named) is an American computer scientist, inventor, and "software wizard". He was a member of the original Apple Macintosh development team during the 1980s, where became a primary architect of the original Macintosh System Software. Among his more recent escapades, Andy helped to create the Nautilus file manager for GNOME, helped the Open Source Applications Foundation promote open source software, and was also the key designer of the Circles user interface in Google+.
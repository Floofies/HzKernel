# The Hertzfeld Kernel
```
  __________________
< Under Construction >
  ------------------
         \   ^__^ 
          \  (oo)\_______
             (__)\       )\/\
                 ||----w |
                 ||     ||
```

---

## :man: About Hertzfeld

Andy Hertzfeld (born April 6, 1953) is an American computer scientist and inventor who was a member of the original Apple Macintosh development team during the 1980s. After buying an Apple II in January 1978, he went to work for Apple Computer from August 1979 until March 1984, where he was a designer for the Macintosh system software.

Since leaving Apple, he has co-founded three companies: Radius in 1986, General Magic in 1990 and Eazel in 1999. In 2002, he helped the Open Source Applications Foundation promote open source software. Hertzfeld worked at Google from 2005 to 2013, where in 2011 he was the key designer of the Circles user interface in Google+.

## :octocat: About the Hertzfeld Kernel

The Hertzfeld Kernel is a configurable cooperative multitasking microkernel for JavaScript, enabling concurrent execution of multiple functions in real-time.

## Configurations

A wide variety of configurations are available.

### Scheduling

There are several available schedulers to choose from:
- The Completely Fair Scheduler (CFS)
- Batch
- FIFO
- Idle/Background
- Multilevel Priority Queue

### Privilege Modes

Hertzfeld can restrict or relax how much it controls userspace execution. The kernel includes [the HertzScript compiler module](https://github.com/Floofies/HzScript), which it optionally uses to modify the Abstract Syntax Trees of userspace code. The kernel can enforce cooperative preemption, or allow tasks to implement it themselves.
